import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdir, writeFile, access } from 'node:fs/promises'
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
  const attributions = {}
  const failures = []

  const infoByFile = await resolveAllInfo(produce)

  for (const item of produce) {
    try {
      const info = infoByFile.get(item.commonsFile)
      if (!info) throw new Error(`Commons file not found: ${item.commonsFile}`)
      attributions[item.id] = { file: item.commonsFile, artist: info.artist, license: info.license, source: info.url }
      if (dryRun) {
        console.log(`ok   ${item.id} <- ${item.commonsFile}`)
        continue
      }
      const { badge, hero } = outputPaths(item.id)
      if (!force && (await exists(badge)) && (await exists(hero))) {
        console.log(`skip ${item.id}`)
        continue
      }
      const buf = await downloadWithRetry(info.url)
      await sharp(buf).resize(128, 128, { fit: 'cover', position: 'centre' }).webp({ quality: 82 }).toFile(badge)
      await sharp(buf).resize(640, null, { fit: 'inside' }).webp({ quality: 80 }).toFile(hero)
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
