import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdir, writeFile, readFile, rename, access } from 'node:fs/promises'
import sharp from 'sharp'
import { produce } from '../src/data/produce.ts'
import { commonsSearchUrl } from './fetch-images.mjs'

// Fetches up to four botanical part photos per item — fruit, leaves, seed and
// tree/plant — from Wikimedia Commons, saved as `${id}-${part}.webp`. Searches
// by the item's scientific name (from species.json) when known, so results are
// far more likely to be the right species. Resumable, rate-limited; attributions
// merged into attributions.json under `${id}__${part}` keys. Writes are atomic
// (temp file + rename) so an in-place --force run never leaves a missing/partial
// image.
//
// Usage:
//   vite-node scripts/fetch-part-images.mjs                 # all items (skip existing)
//   vite-node scripts/fetch-part-images.mjs --force         # re-fetch, overwrite in place
//   vite-node scripts/fetch-part-images.mjs --ids a,b,c     # only these ids
//   vite-node scripts/fetch-part-images.mjs --limit 20      # first N items

const __dirname = dirname(fileURLToPath(import.meta.url))
const IMAGES_DIR = join(__dirname, '..', 'public', 'images')
const ATTR_FILE = join(IMAGES_DIR, 'attributions.json')
const SPECIES_FILE = join(IMAGES_DIR, 'species.json')
const UA = 'food-origins-map/1.0 (https://github.com/cnotv/food-origins-map; build script)'
const FORCE = process.argv.includes('--force')

const PARTS = ['fruit', 'leaves', 'seed', 'tree']
const exists = (p) => access(p).then(() => true, () => false)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const searchQuery = (name) => name.replace(/\([^)]*\)/g, '').replace(/['"’]/g, '').trim()

// Per-part search terms. Commons full-text search ANDs the words, so extra
// qualifiers drastically cut recall — keep it to the name plus one part word and
// let pickCandidate() below handle relevance by preferring filenames that
// mention the plant. A couple of light exclusions drop the worst confusers
// (a butterfly called "Chestnut Bob") without hurting recall much.
const PART_QUERY = {
  fruit: (n) => `${n} fruit`,
  leaves: (n) => `${n} leaves -butterfly -moth`,
  seed: (n) => `${n} seeds`,
  tree: (n) => `${n} plant -butterfly -moth`,
}

// A candidate is more trustworthy if its filename mentions the plant, so prefer
// those over unrelated top hits when picking an unused image.
function pickCandidate(candidates, nameTokens, used) {
  const relevant = candidates.filter((c) => {
    const t = c.file.toLowerCase()
    return nameTokens.some((tok) => tok.length > 2 && t.includes(tok))
  })
  return (
    relevant.find((c) => !used.has(c.file)) ?? candidates.find((c) => !used.has(c.file)) ?? null
  )
}

// Returns raster (jpg/png) candidates for a query, in the search engine's
// relevance order, so the caller can pick the first one it hasn't used yet.
async function searchCommonsCandidates(query) {
  const url = commonsSearchUrl(query)
  let data
  for (let i = 0; i < 5; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    const text = await res.text()
    try {
      const parsed = JSON.parse(text)
      if (parsed.query || parsed.batchcomplete !== undefined) {
        data = parsed
        break
      }
    } catch {}
    await sleep(2500 * (i + 1))
  }
  if (!data || !data.query) return []
  const pages = Object.values(data.query.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
  const out = []
  for (const page of pages) {
    const info = page.imageinfo?.[0]
    if (!info) continue
    if (!/\.(jpe?g|png)$/i.test(page.title)) continue
    const meta = info.extmetadata ?? {}
    out.push({
      url: info.url,
      file: page.title.replace(/^File:/, ''),
      artist: (meta.Artist?.value ?? 'Unknown').replace(/<[^>]+>/g, '').trim(),
      license: meta.LicenseShortName?.value ?? 'Unknown',
    })
  }
  return out
}

async function downloadWithRetry(url, tries = 5) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (res.ok) return Buffer.from(await res.arrayBuffer())
    if (res.status === 429 || res.status >= 500) {
      await sleep(2000 * (i + 1))
      continue
    }
    throw new Error(`download ${res.status}`)
  }
  throw new Error('download exhausted retries')
}

function selectItems() {
  const idsArg = process.argv.indexOf('--ids')
  if (idsArg !== -1 && process.argv[idsArg + 1]) {
    const set = new Set(process.argv[idsArg + 1].split(','))
    return produce.filter((it) => set.has(it.id))
  }
  const limArg = process.argv.indexOf('--limit')
  if (limArg !== -1 && process.argv[limArg + 1]) {
    return produce.slice(0, Number(process.argv[limArg + 1]))
  }
  return produce
}

async function main() {
  await mkdir(IMAGES_DIR, { recursive: true })
  const attributions = await readFile(ATTR_FILE, 'utf8').then(JSON.parse).catch(() => ({}))
  const species = await readFile(SPECIES_FILE, 'utf8').then(JSON.parse).catch(() => ({}))
  const items = selectItems()
  let added = 0
  let missed = 0

  for (const item of items) {
    // Search by scientific name when known — far more precise than the common
    // name. Fall back to the display name otherwise.
    const sci = species[item.id]
    const searchName = sci || searchQuery(item.name)
    // Track files already used by this item so each part gets a distinct photo
    // (search often ranks the same dominant image first for every part).
    const used = new Set()
    const nameTokens = `${sci ?? ''} ${searchQuery(item.name)}`.toLowerCase().split(/\s+/)
    for (const part of PARTS) {
      const existing = join(IMAGES_DIR, `${item.id}-${part}.webp`)
      // Skip parts already at current resolution so a re-run only upgrades the
      // remaining low-res ones (a resumable upgrade). A leftover 180px file from
      // an earlier pass is below the threshold and gets re-fetched. --force redoes
      // everything regardless.
      if ((await exists(existing)) && !FORCE) {
        const w = await sharp(existing)
          .metadata()
          .then((m) => m.width || 0)
          .catch(() => 0)
        if (w >= 260) continue
      }
      try {
        const candidates = await searchCommonsCandidates(PART_QUERY[part](searchName))
        await sleep(300)
        const hit = pickCandidate(candidates, nameTokens, used)
        if (!hit) {
          missed++
          console.log(`miss ${item.id}-${part}`)
          continue
        }
        used.add(hit.file)
        const buf = await downloadWithRetry(hit.url)
        // Fetched larger than final; optimize-images.mjs re-encodes the whole set
        // down to the size budget afterwards. Written atomically (temp + rename)
        // so an in-place --force run never leaves a missing or partial file.
        const tmp = `${existing}.tmp`
        await sharp(buf, { limitInputPixels: false })
          .resize(520, 520, { fit: 'inside' })
          .webp({ quality: 66 })
          .toFile(tmp)
        await rename(tmp, existing)
        attributions[`${item.id}__${part}`] = {
          file: hit.file,
          artist: hit.artist,
          license: hit.license,
          source: hit.url,
        }
        added++
        console.log(`done ${item.id}-${part} <- ${hit.file}`)
        await sleep(500)
      } catch (err) {
        missed++
        console.error(`FAIL ${item.id}-${part}: ${err.message}`)
      }
    }
    // Persist progress after each item so a long run is safe to interrupt.
    await writeFile(ATTR_FILE, JSON.stringify(attributions, null, 2))
  }

  console.log(`\nDone. Added ${added} part images, ${missed} misses, over ${items.length} items.`)
}

if (!process.env.VITEST) main()
