import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdir, writeFile, readFile, access } from 'node:fs/promises'
import sharp from 'sharp'
import { produce } from '../src/data/produce.ts'
import { commonsSearchUrl } from './fetch-images.mjs'

// Fetches up to four botanical part photos per item — fruit, leaves, seed and
// tree/plant — from Wikimedia Commons, saved as `${id}-${part}.webp`. Resumable
// (skips parts that already exist) and rate-limited. Attributions are merged
// into public/images/attributions.json under `${id}__${part}` keys.
//
// Usage:
//   vite-node scripts/fetch-part-images.mjs                 # all items
//   vite-node scripts/fetch-part-images.mjs --ids a,b,c     # only these ids
//   vite-node scripts/fetch-part-images.mjs --limit 20      # first N items

const __dirname = dirname(fileURLToPath(import.meta.url))
const IMAGES_DIR = join(__dirname, '..', 'public', 'images')
const ATTR_FILE = join(IMAGES_DIR, 'attributions.json')
const UA = 'food-origins-map/1.0 (https://github.com/cnotv/food-origins-map; build script)'

const PARTS = ['fruit', 'leaves', 'seed', 'tree']
const exists = (p) => access(p).then(() => true, () => false)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const searchQuery = (name) => name.replace(/\([^)]*\)/g, '').replace(/['"’]/g, '').trim()

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
  const items = selectItems()
  let added = 0
  let missed = 0

  for (const item of items) {
    // Track files already used by this item so each part gets a distinct photo
    // (keyword search often ranks the same dominant image first for every part).
    const used = new Set()
    for (const part of PARTS) {
      const existing = join(IMAGES_DIR, `${item.id}-${part}.webp`)
      if (await exists(existing)) continue
      // "tree" reads oddly for herbs/vines; ask for the plant instead.
      const term = part === 'tree' ? 'plant' : part
      try {
        const candidates = await searchCommonsCandidates(`${searchQuery(item.name)} ${term}`)
        await sleep(300)
        const hit = candidates.find((c) => !used.has(c.file))
        if (!hit) {
          missed++
          console.log(`miss ${item.id}-${part}`)
          continue
        }
        used.add(hit.file)
        const buf = await downloadWithRetry(hit.url)
        // Small webp: the whole image set is kept under a tight size budget, so
        // parts are thumbnail-sized (they display at ~130-190px in the gallery).
        await sharp(buf, { limitInputPixels: false })
          .resize(200, 200, { fit: 'inside' })
          .webp({ quality: 44 })
          .toFile(existing)
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
