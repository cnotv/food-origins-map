import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readdir, readFile, writeFile, rename } from 'node:fs/promises'
import sharp from 'sharp'

// Re-encodes every image so the whole public/images directory fits a size cap,
// keeping photos as large as the cap allows. Runs the conversion FIRST (into
// memory), measures the total from the converted bytes, and only then picks the
// largest spec that fits and writes it — each source is encoded once, from the
// original on-disk file, so quality is never compounded by repeated re-encoding.
//
// Usage: vite-node scripts/optimize-images.mjs [--max-mb 30]

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIR = join(__dirname, '..', 'public', 'images')

const maxArg = process.argv.indexOf('--max-mb')
const BUDGET = (maxArg !== -1 ? Number(process.argv[maxArg + 1]) : 30) * 1024 * 1024

const BADGE = { w: 160, q: 70 }
// A fixed photo spec (used for targeted --ids fixes so they match the rest of
// the set instead of re-picking from a tiny subset's budget).
const pwArg = process.argv.indexOf('--photo-w')
const pqArg = process.argv.indexOf('--photo-q')
const FIXED_SPEC =
  pwArg !== -1 && pqArg !== -1
    ? { w: Number(process.argv[pwArg + 1]), q: Number(process.argv[pqArg + 1]) }
    : null
// Tried largest-first; the first whose converted total fits the cap wins.
const PHOTO_SPECS = FIXED_SPEC
  ? [FIXED_SPEC]
  : [
      { w: 440, q: 60 },
      { w: 400, q: 58 },
      { w: 360, q: 54 },
      { w: 320, q: 50 },
      { w: 288, q: 46 },
      { w: 256, q: 42 },
    ]

const isBadge = (f) => f.endsWith('-badge.webp')
const sum = (bufs) => bufs.reduce((n, [, b]) => n + b.length, 0)

async function encodeAll(files, { w, q }) {
  const out = []
  for (const f of files) {
    const input = await readFile(join(DIR, f))
    if (input.length === 0) continue // skip stray empty files
    const buf = await sharp(input, { limitInputPixels: false })
      .resize(w, w, { fit: 'inside' })
      .webp({ quality: q })
      .toBuffer()
    out.push([f, buf])
  }
  return out
}

async function writeAll(pairs) {
  for (const [f, buf] of pairs) {
    const p = join(DIR, f)
    await writeFile(`${p}.tmp`, buf)
    await rename(`${p}.tmp`, p)
  }
}

async function main() {
  // Optional --ids a,b,c limits the re-encode to those items' images, so a
  // targeted fix doesn't re-encode (and churn) the whole set.
  const idsArg = process.argv.indexOf('--ids')
  const only = idsArg !== -1 ? process.argv[idsArg + 1].split(',') : null
  const matches = (f) => !only || only.some((id) => f.startsWith(`${id}-`))

  const all = (await readdir(DIR)).filter((f) => f.endsWith('.webp') && matches(f))
  const badges = all.filter(isBadge)
  const photos = all.filter((f) => !isBadge(f)) // heroes + parts

  console.log(`Converting ${badges.length} badges at ${BADGE.w}px q${BADGE.q}…`)
  const badgeBufs = await encodeAll(badges, BADGE)
  const badgeBytes = sum(badgeBufs)

  let chosen = null
  let photoBufs = null
  for (const spec of PHOTO_SPECS) {
    console.log(`Converting ${photos.length} photos at ${spec.w}px q${spec.q}…`)
    const bufs = await encodeAll(photos, spec)
    const total = badgeBytes + sum(bufs)
    console.log(`  converted total: ${(total / 1048576).toFixed(2)} MB`)
    if (total <= BUDGET || spec === PHOTO_SPECS[PHOTO_SPECS.length - 1]) {
      chosen = spec
      photoBufs = bufs
      if (total <= BUDGET) break
    }
  }

  console.log('Writing…')
  await writeAll(badgeBufs)
  await writeAll(photoBufs)

  const finalBytes = badgeBytes + sum(photoBufs)
  console.log(
    `\nDone. ${all.length} images, ${(finalBytes / 1048576).toFixed(2)} MB ` +
      `(cap ${(BUDGET / 1048576).toFixed(0)} MB). Photos at ${chosen.w}px q${chosen.q}.`,
  )
  if (finalBytes > BUDGET) process.exitCode = 1
}

main()
