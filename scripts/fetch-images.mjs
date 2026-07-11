import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdir, writeFile, readFile, rename, access } from 'node:fs/promises'
import sharp from 'sharp'
import { produce } from '../src/data/produce.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const IMAGES_DIR = join(__dirname, '..', 'public', 'images')
const UA = 'food-origins-map/1.0 (https://github.com/; build script)'

export function commonsInfoUrl(file) {
  const title = encodeURIComponent('File:' + file)
  const props = encodeURIComponent('url|extmetadata')
  return `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&titles=${title}&iiprop=${props}`
}

// Full-text search over the Commons File namespace, used as a fallback when an
// item's exact commonsFile can't be resolved. Returns the API url for a query.
export function commonsSearchUrl(query) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrnamespace: '6', // File namespace
    gsrsearch: query,
    gsrlimit: '10',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    maxlag: '5',
  })
  return `https://commons.wikimedia.org/w/api.php?${params.toString()}`
}

export function outputPaths(id) {
  return { badge: join(IMAGES_DIR, `${id}-badge.webp`), hero: join(IMAGES_DIR, `${id}-hero.webp`) }
}

const exists = (p) => access(p).then(() => true, () => false)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function downloadWithRetry(url, tries = 6) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (res.ok) return Buffer.from(await res.arrayBuffer())
    if (res.status === 429 || res.status >= 500) {
      await sleep(2000 * (i + 1))
      continue
    }
    throw new Error(`download ${res.status}`)
  }
  throw new Error('download 429 (exhausted retries)')
}
const normTitle = (t) => t.replace(/^File:/, '').replace(/_/g, ' ')

// Query imageinfo for up to 50 files in a single API call to stay under rate limits.
async function fetchImageInfoBatch(files) {
  const titles = files.map((f) => 'File:' + f).join('|')
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo' +
    `&iiprop=${encodeURIComponent('url|extmetadata')}&maxlag=5&titles=${encodeURIComponent(titles)}`
  let data
  for (let i = 0; i < 6; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    const text = await res.text()
    try {
      const parsed = JSON.parse(text)
      if (parsed.query) { data = parsed; break }
    } catch {}
    await sleep(3000 * (i + 1))
  }
  if (!data) throw new Error('API rate-limited (exhausted retries)')
  const query = data.query ?? {}
  // Map any API title normalization back to the requested filename.
  const canonical = new Map() // normalized title -> requested file
  for (const f of files) canonical.set(normTitle('File:' + f), f)
  for (const n of query.normalized ?? []) {
    if (canonical.has(normTitle(n.from))) canonical.set(normTitle(n.to), canonical.get(normTitle(n.from)))
  }
  const byFile = new Map() // requested file -> info | null
  for (const f of files) byFile.set(f, null)
  for (const page of Object.values(query.pages ?? {})) {
    const file = canonical.get(normTitle(page.title))
    if (!file) continue
    if (page.missing !== undefined || !page.imageinfo) continue
    const info = page.imageinfo[0]
    const meta = info.extmetadata ?? {}
    byFile.set(file, {
      url: info.url,
      artist: (meta.Artist?.value ?? 'Unknown').replace(/<[^>]+>/g, '').trim(),
      license: meta.LicenseShortName?.value ?? 'Unknown',
    })
  }
  return byFile
}

// Clean an item's display name into a plain search query: drop parentheticals
// (e.g. "Ugu (Fluted Pumpkin)") and stray punctuation that hurts search recall.
const searchQuery = (name) => name.replace(/\([^)]*\)/g, '').replace(/['"’]/g, '').trim()

// Better Commons search terms for items whose display name searches poorly.
const SEARCH_OVERRIDE = {
  'epimedium-fern': 'Ostrich fern',
  biriba: 'Rollinia deliciosa',
  purslane: 'Portulaca oleracea',
}

// Items whose declared commonsFile is unusable (e.g. a corrupt/truncated source
// that fails to decode); force them through the name-search fallback instead.
const FORCE_SEARCH = new Set(['purslane'])

// Fallback: search Commons for a photo matching the query. `preferTokens` (e.g.
// scientific-name words) is used to avoid fuzzy mismatches — Commons ranks
// "Hattie Caraway" first for "Carum carvi", so we prefer a result whose filename
// actually contains a scientific token before falling back to relevance order.
async function searchCommonsImage(query, preferTokens = []) {
  const url = commonsSearchUrl(query)
  let data
  for (let i = 0; i < 5; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    const text = await res.text()
    try {
      const parsed = JSON.parse(text)
      if (parsed.query || parsed.batchcomplete !== undefined) { data = parsed; break }
    } catch {}
    await sleep(2500 * (i + 1))
  }
  if (!data || !data.query) return null
  const pages = Object.values(data.query.pages ?? {}).sort(
    (a, b) => (a.index ?? 0) - (b.index ?? 0),
  )
  const rasters = pages.filter((p) => /\.(jpe?g|png)$/i.test(p.title) && p.imageinfo?.[0])
  const tokens = preferTokens.map((t) => t.toLowerCase()).filter((t) => t.length > 3)
  const preferred =
    tokens.length &&
    rasters.find((p) => tokens.some((t) => p.title.toLowerCase().includes(t)))
  const page = preferred || rasters[0]
  if (!page) return null
  const info = page.imageinfo[0]
  const meta = info.extmetadata ?? {}
  return {
    url: info.url,
    file: page.title.replace(/^File:/, ''),
    artist: (meta.Artist?.value ?? 'Unknown').replace(/<[^>]+>/g, '').trim(),
    license: meta.LicenseShortName?.value ?? 'Unknown',
  }
}

async function resolveAllInfo(items) {
  const infoByFile = new Map()
  for (let i = 0; i < items.length; i += 40) {
    const chunk = items.slice(i, i + 40)
    const batch = await fetchImageInfoBatch(chunk.map((it) => it.commonsFile))
    for (const [k, v] of batch) infoByFile.set(k, v)
    if (i + 40 < items.length) await sleep(400)
  }
  return infoByFile
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const force = process.argv.includes('--force')
  if (!dryRun) await mkdir(IMAGES_DIR, { recursive: true })
  // Start from the existing attributions so an incremental run (which skips
  // items whose images already exist) preserves their credits instead of
  // wiping the file down to only the newly-processed items.
  const attributions = await readFile(join(IMAGES_DIR, 'attributions.json'), 'utf8')
    .then(JSON.parse)
    .catch(() => ({}))
  // Curated scientific names: for these, ignore the declared commonsFile and
  // search the binomial instead, fixing common-name collisions (e.g. "Caraway"
  // matching a photo of Senator Hattie Caraway).
  const scientificNames = await readFile(join(__dirname, 'scientific-names.json'), 'utf8')
    .then(JSON.parse)
    .catch(() => ({}))
  const failures = []

  const idsArg = process.argv.indexOf('--ids')
  const only = idsArg !== -1 ? new Set(process.argv[idsArg + 1].split(',')) : null
  const items = only ? produce.filter((it) => only.has(it.id)) : produce

  const infoByFile = await resolveAllInfo(items)

  for (const item of items) {
    try {
      const { badge, hero } = outputPaths(item.id)
      // Skip work early if both outputs already exist (unless --force).
      if (!force && !dryRun && (await exists(badge)) && (await exists(hero))) {
        console.log(`skip ${item.id}`)
        continue
      }
      // Prefer the item's exact commonsFile; if it didn't resolve (or a
      // scientific-name override applies), fall back to a Commons search.
      const sciName = scientificNames[item.id]
      let info =
        sciName || FORCE_SEARCH.has(item.id) ? undefined : infoByFile.get(item.commonsFile)
      let sourceFile = item.commonsFile
      if (!info) {
        const term = sciName ?? SEARCH_OVERRIDE[item.id] ?? searchQuery(item.name)
        info = await searchCommonsImage(term, sciName ? sciName.split(/\s+/) : [])
        if (info) sourceFile = info.file
        await sleep(300)
      }
      if (!info) throw new Error(`No Commons image found for ${item.id} (${item.name})`)
      attributions[item.id] = { file: sourceFile, artist: info.artist, license: info.license, source: info.url }
      if (dryRun) {
        console.log(`ok   ${item.id} <- ${sourceFile}`)
        continue
      }
      const buf = await downloadWithRetry(info.url)
      const src = () => sharp(buf, { limitInputPixels: false })
      // Atomic writes (temp + rename) so an in-place --force run never leaves a
      // partial or empty file if encoding/writing is interrupted.
      await src().resize(200, 200, { fit: 'cover', position: 'centre' }).webp({ quality: 84 }).toFile(`${badge}.tmp`)
      await rename(`${badge}.tmp`, badge)
      await src().resize(1000, null, { fit: 'inside' }).webp({ quality: 84 }).toFile(`${hero}.tmp`)
      await rename(`${hero}.tmp`, hero)
      console.log(`done ${item.id}`)
      await sleep(600)
    } catch (err) {
      console.error(`FAIL ${item.id}: ${err.message}`)
      failures.push(item.id)
    }
  }

  if (!dryRun) await writeFile(join(IMAGES_DIR, 'attributions.json'), JSON.stringify(attributions, null, 2))
  if (failures.length) {
    console.error(`\n${failures.length} failures: ${failures.join(', ')}`)
    process.exitCode = 1
  } else {
    console.log(`\nAll ${produce.length} items processed successfully.`)
  }
}

// Run as a CLI, but not when imported by the Vitest test (which sets VITEST).
if (!process.env.VITEST) main()
