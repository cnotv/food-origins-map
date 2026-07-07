import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readdir, stat, readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

// Re-encodes every image so the whole public/images directory stays under a
// tight size budget (the app ships all of them). Badges (map markers) keep a
// fixed small spec; photos/parts are re-encoded at the largest spec that fits.
//
// Usage: vite-node scripts/optimize-images.mjs [--max-mb 9.5]

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIR = join(__dirname, '..', 'public', 'images')

const maxArg = process.argv.indexOf('--max-mb')
const BUDGET = (maxArg !== -1 ? Number(process.argv[maxArg + 1]) : 24) * 1024 * 1024

const BADGE = { w: 128, q: 66 }
// Tried in order; the first that brings the total under budget wins. Photos are
// roughly double the previous size (~360px) for a sharper gallery/slideshow.
const PHOTO_SPECS = [
  { w: 360, q: 52 },
  { w: 340, q: 50 },
  { w: 320, q: 48 },
  { w: 300, q: 46 },
  { w: 280, q: 44 },
  { w: 256, q: 42 },
]

const isBadge = (f) => f.endsWith('-badge.webp')

async function totalBytes(files) {
  let sum = 0
  for (const f of files) sum += (await stat(join(DIR, f))).size
  return sum
}

async function reencode(file, { w, q }) {
  const p = join(DIR, file)
  const input = await readFile(p)
  if (input.length === 0) return // skip stray empty files
  const buf = await sharp(input, { limitInputPixels: false })
    .resize(w, w, { fit: 'inside' })
    .webp({ quality: q })
    .toBuffer()
  await writeFile(p, buf)
}

async function main() {
  const all = (await readdir(DIR)).filter((f) => f.endsWith('.webp'))
  const badges = all.filter(isBadge)
  const photos = all.filter((f) => !isBadge(f)) // heroes + parts

  console.log(`Re-encoding ${badges.length} badges at ${BADGE.w}px q${BADGE.q}…`)
  for (const f of badges) await reencode(f, BADGE)

  let chosen = null
  for (const spec of PHOTO_SPECS) {
    console.log(`Trying photos at ${spec.w}px q${spec.q}…`)
    for (const f of photos) await reencode(f, spec)
    const total = await totalBytes(all)
    console.log(`  total: ${(total / 1048576).toFixed(2)} MB`)
    if (total <= BUDGET) {
      chosen = spec
      break
    }
  }

  const finalTotal = await totalBytes(all)
  console.log(
    `\nDone. ${all.length} images, ${(finalTotal / 1048576).toFixed(2)} MB ` +
      `(budget ${(BUDGET / 1048576).toFixed(1)} MB). Photos at ${chosen ? `${chosen.w}px q${chosen.q}` : 'smallest spec'}.`,
  )
  if (finalTotal > BUDGET) process.exitCode = 1
}

main()
