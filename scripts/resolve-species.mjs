import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import { produce } from '../src/data/produce.ts'

// Resolves each item's scientific (binomial) name so part photos can be searched
// precisely (so "chestnut leaves" can't return a butterfly). Strategy:
//   1. Read the Commons categories of the item's own photo — it is almost always
//      filed under a "<Genus species>" category (sometimes as "… (fruit)").
//   2. Validate each binomial-shaped candidate against Wikidata: accept it only
//      if Wikidata describes it as a plant species/genus. This rejects English
//      category names that merely look like binomials ("Kidney beans",
//      "Colorful objects").
// Writes public/images/species.json = { id: "Genus species" }. Resumable.

const __dirname = dirname(fileURLToPath(import.meta.url))
const IMAGES_DIR = join(__dirname, '..', 'public', 'images')
const OUT = join(IMAGES_DIR, 'species.json')
const UA = 'food-origins-map/1.0 (https://github.com/cnotv/food-origins-map; build script)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Cheap pre-filter so we don't validate obvious non-binomials on Wikidata.
const STOP = new Set(
  ('of the with and in by featured pictures picture commons taken license quality ' +
    'photographs media files category wikipedia wikimedia self published').split(' '),
)

async function getJson(url) {
  for (let i = 0; i < 6; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      const text = await res.text()
      if (text.startsWith('You are making too many')) throw new Error('rate limited')
      return JSON.parse(text)
    } catch {
      await sleep(2000 * (i + 1))
    }
  }
  return null
}

async function fileCategories(file) {
  const data = await getJson(
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=categories&cllimit=max' +
      `&titles=${encodeURIComponent('File:' + file)}`,
  )
  const page = Object.values(data?.query?.pages ?? {})[0]
  return page ? (page.categories ?? []).map((c) => c.title.replace(/^Category:/, '')) : []
}

// Binomial-shaped candidates from a file's categories, best first (a botanical
// "(fruit)"-style suffix is a strong signal of a real species category).
function candidatesFrom(cats) {
  const scored = []
  for (const raw of cats) {
    const hadPart = /\((fruit|fruits|leaves|leaf|seed|seeds|flowers?|plant|tree|nuts?)\)\s*$/i.test(
      raw,
    )
    const c = raw.replace(/\s*\([^)]*\)\s*$/, '').trim()
    const m = c.match(/^([A-Z][a-z-]+) ([a-z-]{3,})$/)
    if (!m) continue
    if (STOP.has(m[1].toLowerCase()) || STOP.has(m[2].toLowerCase())) continue
    scored.push({ name: `${m[1]} ${m[2]}`, score: hadPart ? 2 : 1 })
  }
  scored.sort((a, b) => b.score - a.score)
  return [...new Map(scored.map((s) => [s.name, s])).keys()]
}

// True if Wikidata describes the name as a plant species/genus.
const taxonCache = new Map()
async function isPlantTaxon(name) {
  if (taxonCache.has(name)) return taxonCache.get(name)
  const data = await getJson(
    'https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&limit=1' +
      `&search=${encodeURIComponent(name)}`,
  )
  await sleep(500)
  const desc = (data?.search?.[0]?.description ?? '').toLowerCase()
  const ok =
    /\b(species|genus|subspecies|hybrid)\b/.test(desc) &&
    /plant|tree|shrub|grass|herb|vine|flower|fern|palm|cactus|legume|fruit|berry|crop|cereal|vegetable|spice/.test(
      desc,
    )
  taxonCache.set(name, ok)
  return ok
}

async function main() {
  const attributions = await readFile(join(IMAGES_DIR, 'attributions.json'), 'utf8')
    .then(JSON.parse)
    .catch(() => ({}))
  const species = await readFile(OUT, 'utf8')
    .then(JSON.parse)
    .catch(() => ({}))

  const limArg = process.argv.indexOf('--limit')
  const items = limArg !== -1 ? produce.slice(0, Number(process.argv[limArg + 1])) : produce

  let resolved = 0
  let missed = 0
  let done = 0
  for (const item of items) {
    if (species[item.id]) continue
    const file = attributions[item.id]?.file || item.commonsFile
    const cands = candidatesFrom(await fileCategories(file))
    await sleep(250)
    let picked = null
    for (const name of cands) {
      if (await isPlantTaxon(name)) {
        picked = name
        break
      }
    }
    if (picked) {
      species[item.id] = picked
      resolved++
      console.log(`ok   ${item.id} -> ${picked}`)
    } else {
      missed++
      console.log(`miss ${item.id}`)
    }
    if (++done % 20 === 0) await writeFile(OUT, JSON.stringify(species, null, 2))
  }
  await writeFile(OUT, JSON.stringify(species, null, 2))
  console.log(
    `\nResolved ${Object.keys(species).length}/${produce.length} scientific names ` +
      `(${resolved} new, ${missed} misses this run).`,
  )
}

main()
