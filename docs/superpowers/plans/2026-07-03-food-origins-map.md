# Food Origins Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static Vue SPA showing an interactive world map where fruits/vegetables are pinned at their domestication origin, with a side panel for story, nutrition, and a TasteAtlas recipe link.

**Architecture:** Fully static single-page app. Leaflet renders an OpenStreetMap base with clustered image markers, fully encapsulated in `WorldMap.vue`. A typed dataset in `src/data/produce.ts` drives everything. A one-time Node script downloads Wikimedia images and converts them to WebP. Data flows down via props; selection/filter events flow up to `App.vue`.

**Tech Stack:** Vue 3 (`<script setup>` + TypeScript), Vite, Leaflet + `leaflet.markercluster`, Vitest + `@vue/test-utils` + jsdom, `sharp` for image conversion.

## Global Constraints

- Node 20+, package manager: `npm` (standalone repo, no workspace).
- App is fully static: no runtime API calls except OSM tile loading. App must render completely even if the image pipeline never ran (fallback markers).
- Recipe links MUST start with `https://www.tasteatlas.com/`.
- Image asset paths are derived by convention from `id`: `/images/<id>-badge.webp` and `/images/<id>-hero.webp`. Never store image paths on items.
- Categories are exactly: `'fruit' | 'vegetable' | 'legume' | 'herb-spice'`.
- Leaflet APIs are used only inside `WorldMap.vue`; no other component imports `leaflet`.
- TypeScript strict mode on. `npm run type-check` and `npm run test:unit` must pass before each commit.

---

### Task 1: Scaffold the Vite + Vue + TS project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.ts`, `src/App.vue`, `src/env.d.ts`, `.gitignore`, `vitest.config.ts`
- Test: `src/__tests__/smoke.test.ts`

**Interfaces:**
- Produces: a working `npm run dev`, `npm run build`, `npm run type-check`, `npm run test:unit`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "food-origins-map",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview",
    "type-check": "vue-tsc --noEmit",
    "test:unit": "vitest run",
    "test:watch": "vitest",
    "fetch-images": "node scripts/fetch-images.mjs"
  },
  "dependencies": {
    "leaflet": "^1.9.4",
    "leaflet.markercluster": "^1.5.3",
    "vue": "^3.5.0"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.12",
    "@types/leaflet.markercluster": "^1.5.4",
    "@vitejs/plugin-vue": "^5.1.0",
    "@vue/test-utils": "^2.4.6",
    "jsdom": "^25.0.0",
    "sharp": "^0.33.5",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0",
    "vue-tsc": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create config files**

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
})
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: { environment: 'jsdom', globals: true },
})
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "vite.config.ts", "vitest.config.ts"]
}
```

`tsconfig.node.json`:
```json
{ "compilerOptions": { "module": "ESNext", "moduleResolution": "Bundler", "strict": true } }
```

`src/env.d.ts`:
```ts
/// <reference types="vite/client" />
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

`.gitignore`:
```
node_modules
dist
*.log
.DS_Store
```

- [ ] **Step 3: Create `index.html`, `src/main.ts`, `src/App.vue`**

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Food Origins Map</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`src/main.ts`:
```ts
import { createApp } from 'vue'
import App from './App.vue'
import './styles/global.css'

createApp(App).mount('#app')
```

`src/App.vue` (placeholder, replaced in Task 7):
```vue
<template>
  <div id="app-root">Food Origins Map</div>
</template>
<script setup lang="ts"></script>
```

Create `src/styles/global.css`:
```css
* { box-sizing: border-box; }
html, body, #app { margin: 0; height: 100%; }
body { font-family: system-ui, -apple-system, sans-serif; }
```

- [ ] **Step 4: Write smoke test**

`src/__tests__/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it('mounts', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Food Origins Map')
  })
})
```

- [ ] **Step 5: Install and verify**

Run: `npm install && npm run type-check && npm run test:unit`
Expected: install succeeds, type-check passes, 1 test passes.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + Vue + TS project"
```

---

### Task 2: Define the ProduceItem type and dataset schema validators

**Files:**
- Create: `src/data/types.ts`, `src/data/validators.ts`
- Test: `src/data/__tests__/validators.test.ts`

**Interfaces:**
- Produces:
  - `type Category = 'fruit' | 'vegetable' | 'legume' | 'herb-spice'`
  - `interface ProduceItem` (fields per spec data model)
  - `function badgeImagePath(id: string): string` → `/images/<id>-badge.webp`
  - `function heroImagePath(id: string): string` → `/images/<id>-hero.webp`
  - `function validateDataset(items: ProduceItem[]): string[]` → array of human-readable error strings (empty = valid)

- [ ] **Step 1: Write failing test**

`src/data/__tests__/validators.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { validateDataset, badgeImagePath, heroImagePath } from '../validators'
import type { ProduceItem } from '../types'

const good: ProduceItem = {
  id: 'tomato',
  name: 'Tomato',
  category: 'fruit',
  origin: { lat: -12, lng: -77, region: 'Andes' },
  story: 'A short story.',
  nutrition: { per100g: { calories: 18, carbs: 3.9, fiber: 1.2, protein: 0.9 }, highlights: ['Lycopene'] },
  tasteAtlasUrl: 'https://www.tasteatlas.com/tomato',
  commonsFile: 'Tomato.jpg',
}

describe('validators', () => {
  it('accepts a valid dataset', () => {
    expect(validateDataset([good])).toEqual([])
  })
  it('rejects duplicate ids', () => {
    expect(validateDataset([good, good]).join()).toMatch(/duplicate/i)
  })
  it('rejects out-of-range coordinates', () => {
    const bad = { ...good, id: 'x', origin: { ...good.origin, lat: 999 } }
    expect(validateDataset([bad]).join()).toMatch(/lat/i)
  })
  it('rejects non-tasteatlas urls', () => {
    const bad = { ...good, id: 'y', tasteAtlasUrl: 'https://example.com' }
    expect(validateDataset([bad]).join()).toMatch(/tasteatlas/i)
  })
  it('derives image paths', () => {
    expect(badgeImagePath('tomato')).toBe('/images/tomato-badge.webp')
    expect(heroImagePath('tomato')).toBe('/images/tomato-hero.webp')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- validators`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement types and validators**

`src/data/types.ts`:
```ts
export type Category = 'fruit' | 'vegetable' | 'legume' | 'herb-spice'

export interface ProduceItem {
  id: string
  name: string
  category: Category
  origin: { lat: number; lng: number; region: string }
  story: string
  nutrition: {
    per100g: { calories: number; carbs: number; fiber: number; protein: number }
    highlights: string[]
  }
  tasteAtlasUrl: string
  commonsFile: string
}

export const CATEGORIES: Category[] = ['fruit', 'vegetable', 'legume', 'herb-spice']
```

`src/data/validators.ts`:
```ts
import type { ProduceItem } from './types'
import { CATEGORIES } from './types'

export const badgeImagePath = (id: string) => `/images/${id}-badge.webp`
export const heroImagePath = (id: string) => `/images/${id}-hero.webp`

export function validateDataset(items: ProduceItem[]): string[] {
  const errors: string[] = []
  const seen = new Set<string>()
  for (const it of items) {
    if (seen.has(it.id)) errors.push(`duplicate id: ${it.id}`)
    seen.add(it.id)
    if (!it.id || !/^[a-z0-9-]+$/.test(it.id)) errors.push(`invalid id: ${it.id}`)
    if (!it.name) errors.push(`missing name for ${it.id}`)
    if (!CATEGORIES.includes(it.category)) errors.push(`bad category for ${it.id}`)
    if (it.origin.lat < -90 || it.origin.lat > 90) errors.push(`lat out of range for ${it.id}`)
    if (it.origin.lng < -180 || it.origin.lng > 180) errors.push(`lng out of range for ${it.id}`)
    if (!it.origin.region) errors.push(`missing region for ${it.id}`)
    if (!it.story) errors.push(`missing story for ${it.id}`)
    if (!it.nutrition.highlights.length) errors.push(`missing highlights for ${it.id}`)
    if (!it.tasteAtlasUrl.startsWith('https://www.tasteatlas.com/'))
      errors.push(`non-tasteatlas url for ${it.id}`)
    if (!it.commonsFile) errors.push(`missing commonsFile for ${it.id}`)
  }
  return errors
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- validators`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data
git commit -m "feat: add ProduceItem types and dataset validators"
```

---

### Task 3: Build the produce dataset (50+ items) with a validation test

**Files:**
- Create: `src/data/produce.ts`
- Test: `src/data/__tests__/produce.test.ts`

**Interfaces:**
- Consumes: `ProduceItem`, `validateDataset` from Task 2.
- Produces: `export const produce: ProduceItem[]` with ≥ 50 items across all four categories.

- [ ] **Step 1: Write failing test**

`src/data/__tests__/produce.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { produce } from '../produce'
import { validateDataset } from '../validators'
import { CATEGORIES } from '../types'

describe('produce dataset', () => {
  it('has at least 50 items', () => {
    expect(produce.length).toBeGreaterThanOrEqual(50)
  })
  it('passes schema validation', () => {
    expect(validateDataset(produce)).toEqual([])
  })
  it('covers every category', () => {
    for (const c of CATEGORIES) {
      expect(produce.some((p) => p.category === c)).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- produce`
Expected: FAIL — `src/data/produce.ts` not found.

- [ ] **Step 3: Implement the dataset**

Create `src/data/produce.ts` exporting `export const produce: ProduceItem[] = [ ... ]`. Author 55 items. Each item needs a real domestication origin (lat/lng at the historically-cited center of origin), a 2–3 sentence story, plausible per-100g nutrition, 1–3 highlights, a `tasteAtlasUrl` under `https://www.tasteatlas.com/`, and a real Wikimedia Commons filename (verified later in Task 4 dry-run).

Include at least these ids (extend to 55): `tomato` (Andes, `-12,-77`), `potato` (Andes, `-14,-70`), `maize` (Mexico, `18,-97`), `chili-pepper` (Mexico, `19,-99`), `avocado` (Mexico, `19,-99`), `common-bean` (Mesoamerica, `19,-99`), `cacao` (Amazon, `-4,-73`), `pineapple` (Brazil/Paraguay, `-25,-57`), `peanut` (Bolivia, `-17,-63`), `cassava` (Brazil, `-10,-53`), `sunflower` (North America, `39,-98`), `blueberry` (North America, `44,-72`), `cranberry` (North America, `42,-71`), `pumpkin` (Mexico, `20,-99`), `wheat` (Fertile Crescent, `36,40`), `barley` (Fertile Crescent, `36,40`), `lentil` (Near East, `37,38`), `chickpea` (Anatolia, `37,38`), `pea` (Near East, `37,38`), `fig` (Near East, `32,35`), `olive` (Levant, `32,35`), `date-palm` (Persian Gulf, `29,48`), `pomegranate` (Iran, `35,52`), `almond` (Central Asia/Iran, `35,52`), `carrot` (Persia, `34,53`), `spinach` (Persia, `34,53`), `apple` (Kazakhstan, `43,77`), `walnut` (Central Asia, `41,72`), `apricot` (China/Central Asia, `40,90`), `onion` (Central Asia, `39,66`), `garlic` (Central Asia, `39,66`), `rice` (Yangtze, China, `30,112`), `soybean` (China, `35,110`), `peach` (China, `30,104`), `tea` (SW China, `25,100`), `orange` (SE Asia, `25,100`), `cucumber` (India, `28,77`), `eggplant` (India, `21,79`), `black-pepper` (India, `10,76`), `mango` (India, `22,80`), `banana` (New Guinea, `-6,144`), `sugarcane` (New Guinea, `-6,144`), `taro` (SE Asia, `2,113`), `coconut` (Indo-Pacific, `0,110`), `ginger` (Maritime SE Asia, `2,113`), `turmeric` (India, `13,80`), `coffee` (Ethiopia, `8,38`), `okra` (Ethiopia, `9,38`), `sorghum` (Sudan/Ethiopia, `13,32`), `watermelon` (NE Africa, `18,30`), `yam` (West Africa, `8,4`), `oil-palm` (West Africa, `6,3`), `cowpea` (West Africa, `10,5`), `grape` (Caucasus, `42,44`), `cabbage` (Europe/Mediterranean, `43,5`), `leek` (Mediterranean, `41,15`).

Categories: fruits (tomato, avocado, cacao, pineapple, blueberry, cranberry, pumpkin, fig, olive, date-palm, pomegranate, apple, apricot, peach, orange, cucumber, eggplant, mango, banana, coconut, watermelon, grape), vegetables (potato, cassava, carrot, spinach, onion, garlic, taro, yam, okra, cabbage, leek), legumes (common-bean, peanut, lentil, chickpea, pea, soybean, cowpea), herb-spice (chili-pepper, black-pepper, ginger, turmeric, tea, coffee), grains-as-vegetable-or-fruit: classify `maize`, `wheat`, `barley`, `rice`, `sorghum`, `sugarcane`, `sunflower`, `almond`, `walnut`, `oil-palm` sensibly (grains/nuts → `vegetable` if starchy staple, `fruit` for tree fruits/nuts like almond/walnut). Ensure each of the four categories has ≥ 5 items.

Example entry:
```ts
{
  id: 'tomato',
  name: 'Tomato',
  category: 'fruit',
  origin: { lat: -12, lng: -77, region: 'Andes, western South America' },
  story:
    'Wild tomatoes originated along the Andes and were first domesticated in Mesoamerica. Spanish traders carried them to Europe in the 16th century, where they were long grown as ornamentals before becoming a kitchen staple.',
  nutrition: { per100g: { calories: 18, carbs: 3.9, fiber: 1.2, protein: 0.9 }, highlights: ['Rich in lycopene', 'Vitamin C'] },
  tasteAtlasUrl: 'https://www.tasteatlas.com/tomato',
  commonsFile: 'Bright red tomato and cross section02.jpg',
},
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- produce`
Expected: PASS (3 tests). Fix any validation errors the test prints.

- [ ] **Step 5: Commit**

```bash
git add src/data/produce.ts src/data/__tests__/produce.test.ts
git commit -m "feat: add 55-item produce origins dataset"
```

---

### Task 4: Image fetch/convert pipeline script

**Files:**
- Create: `scripts/fetch-images.mjs`
- Test: `scripts/__tests__/fetch-images.test.mjs`

**Interfaces:**
- Consumes: `produce` dataset (`commonsFile`, `id`).
- Produces: `public/images/<id>-badge.webp` (128×128, center-crop), `public/images/<id>-hero.webp` (640 px wide), `public/images/attributions.json`.
- CLI flags: `--dry-run` (validate Commons filenames resolve, write nothing), `--force` (re-download existing), default (skip items whose outputs exist).

- [ ] **Step 1: Write failing test for the URL/skip helpers**

The script must export pure helpers so they're testable without network:
```js
// scripts/fetch-images.mjs exports: commonsInfoUrl(file), outputPaths(id)
```

`scripts/__tests__/fetch-images.test.mjs`:
```js
import { describe, it, expect } from 'vitest'
import { commonsInfoUrl, outputPaths } from '../fetch-images.mjs'

describe('fetch-images helpers', () => {
  it('builds a Commons imageinfo API url', () => {
    const url = commonsInfoUrl('Tomato.jpg')
    expect(url).toContain('commons.wikimedia.org')
    expect(url).toContain('File%3ATomato.jpg')
    expect(url).toContain('iiprop=url%7Cextmetadata')
  })
  it('derives output paths from id', () => {
    const p = outputPaths('tomato')
    expect(p.badge).toMatch(/public\/images\/tomato-badge\.webp$/)
    expect(p.hero).toMatch(/public\/images\/tomato-hero\.webp$/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- fetch-images`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the script**

`scripts/fetch-images.mjs`:
```js
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdir, writeFile, access } from 'node:fs/promises'
import sharp from 'sharp'
import { produce } from '../src/data/produce.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const IMAGES_DIR = join(__dirname, '..', 'public', 'images')

export function commonsInfoUrl(file) {
  const title = encodeURIComponent('File:' + file)
  const props = encodeURIComponent('url|extmetadata')
  return `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&titles=${title}&iiprop=${props}`
}

export function outputPaths(id) {
  return { badge: join(IMAGES_DIR, `${id}-badge.webp`), hero: join(IMAGES_DIR, `${id}-hero.webp`) }
}

const exists = (p) => access(p).then(() => true, () => false)

async function fetchImageInfo(file) {
  const res = await fetch(commonsInfoUrl(file), { headers: { 'User-Agent': 'food-origins-map/1.0 (build script)' } })
  if (!res.ok) throw new Error(`API ${res.status} for ${file}`)
  const data = await res.json()
  const pages = data.query?.pages ?? {}
  const page = Object.values(pages)[0]
  if (!page || page.missing !== undefined || !page.imageinfo) throw new Error(`Commons file not found: ${file}`)
  const info = page.imageinfo[0]
  const meta = info.extmetadata ?? {}
  return {
    url: info.url,
    artist: (meta.Artist?.value ?? 'Unknown').replace(/<[^>]+>/g, '').trim(),
    license: meta.LicenseShortName?.value ?? 'Unknown',
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const force = process.argv.includes('--force')
  if (!dryRun) await mkdir(IMAGES_DIR, { recursive: true })
  const attributions = {}
  const failures = []

  for (const item of produce) {
    try {
      const info = await fetchImageInfo(item.commonsFile)
      attributions[item.id] = { file: item.commonsFile, artist: info.artist, license: info.license, source: info.url }
      if (dryRun) { console.log(`ok   ${item.id} <- ${item.commonsFile}`); continue }
      const { badge, hero } = outputPaths(item.id)
      if (!force && (await exists(badge)) && (await exists(hero))) { console.log(`skip ${item.id}`); continue }
      const imgRes = await fetch(info.url, { headers: { 'User-Agent': 'food-origins-map/1.0 (build script)' } })
      const buf = Buffer.from(await imgRes.arrayBuffer())
      await sharp(buf).resize(128, 128, { fit: 'cover', position: 'centre' }).webp({ quality: 82 }).toFile(badge)
      await sharp(buf).resize(640, null, { fit: 'inside' }).webp({ quality: 80 }).toFile(hero)
      console.log(`done ${item.id}`)
    } catch (err) {
      console.error(`FAIL ${item.id}: ${err.message}`)
      failures.push(item.id)
    }
  }

  if (!dryRun) await writeFile(join(IMAGES_DIR, 'attributions.json'), JSON.stringify(attributions, null, 2))
  if (failures.length) { console.error(`\n${failures.length} failures: ${failures.join(', ')}`); process.exitCode = 1 }
}

// Only run when invoked directly, not when imported by tests.
if (process.argv[1] && process.argv[1].endsWith('fetch-images.mjs')) main()
```

Note: importing a `.ts` file from a `.mjs` script requires running under Vitest (which transpiles) for the test, and `node --experimental-strip-types` or a loader for CLI use. To keep the CLI simple, run it via `npx vite-node scripts/fetch-images.mjs`. Update the `fetch-images` npm script to: `"fetch-images": "vite-node scripts/fetch-images.mjs"` and add `vite-node` to devDependencies (`^2.1.0`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- fetch-images`
Expected: PASS (2 tests).

- [ ] **Step 5: Dry-run against Commons (network) to validate filenames**

Run: `npm run fetch-images -- --dry-run`
Expected: every item prints `ok`. Any `FAIL ... Commons file not found` means fix that item's `commonsFile` in `src/data/produce.ts` and re-run. Do not proceed until all pass.

- [ ] **Step 6: Generate the real images**

Run: `npm run fetch-images`
Expected: `public/images/<id>-badge.webp`, `<id>-hero.webp` for all items, plus `attributions.json`. Exit code 0.

- [ ] **Step 7: Commit**

```bash
git add scripts public/images
git commit -m "feat: add Wikimedia image pipeline and generated WebP assets"
```

---

### Task 5: WorldMap component with clustered image markers

**Files:**
- Create: `src/components/WorldMap.vue`
- Test: `src/components/__tests__/WorldMap.test.ts`

**Interfaces:**
- Consumes: `produce`, `ProduceItem`, `badgeImagePath`, category from Tasks 2–3.
- Props: `items: ProduceItem[]`, `selectedId: string | null`.
- Emits: `select` with payload `ProduceItem`.
- Produces: encapsulated Leaflet map. Exposes nothing else; all Leaflet usage lives here.

- [ ] **Step 1: Write failing test**

Leaflet needs DOM sizing that jsdom lacks; test the marker HTML builder as a pure exported helper rather than mounting a live map.

`src/components/__tests__/WorldMap.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { buildMarkerHtml, categoryColor } from '../WorldMap.vue'
import type { ProduceItem } from '../../data/types'

const item = { id: 'tomato', name: 'Tomato', category: 'fruit' } as ProduceItem

describe('WorldMap marker helpers', () => {
  it('builds badge html referencing the derived image path', () => {
    const html = buildMarkerHtml(item)
    expect(html).toContain('/images/tomato-badge.webp')
    expect(html).toContain('Tomato')
  })
  it('includes a fallback initial for onerror', () => {
    expect(buildMarkerHtml(item)).toMatch(/onerror/)
    expect(buildMarkerHtml(item)).toContain('>T<')
  })
  it('maps each category to a color', () => {
    expect(categoryColor('fruit')).toMatch(/^#/)
    expect(categoryColor('vegetable')).not.toBe(categoryColor('fruit'))
  })
})
```

To export helpers from an SFC, add a second `<script lang="ts">` block (non-setup) that `export`s them.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- WorldMap`
Expected: FAIL — component not found.

- [ ] **Step 3: Implement WorldMap.vue**

```vue
<script lang="ts">
import type { ProduceItem, Category } from '../data/types'
import { badgeImagePath } from '../data/validators'

const COLORS: Record<Category, string> = {
  fruit: '#e4572e',
  vegetable: '#3a7d44',
  legume: '#c9a227',
  'herb-spice': '#7b4fb5',
}
export const categoryColor = (c: Category) => COLORS[c]

export function buildMarkerHtml(item: ProduceItem): string {
  const initial = item.name.charAt(0).toUpperCase()
  const color = COLORS[item.category]
  return `<div class="marker-badge" style="border-color:${color}" title="${item.name}">
    <img src="${badgeImagePath(item.id)}" alt="${item.name}"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
    <span class="marker-fallback" style="background:${color};display:none">${initial}</span>
  </div>`
}
</script>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import type { ProduceItem } from '../data/types'

const props = defineProps<{ items: ProduceItem[]; selectedId: string | null }>()
const emit = defineEmits<{ select: [item: ProduceItem] }>()

const el = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let cluster: L.MarkerClusterGroup | null = null
const markerById = new Map<string, L.Marker>()

function render(items: ProduceItem[]) {
  if (!map || !cluster) return
  cluster.clearLayers()
  markerById.clear()
  for (const item of items) {
    const icon = L.divIcon({ html: buildMarkerHtml(item), className: 'marker-wrap', iconSize: [40, 40], iconAnchor: [20, 20] })
    const marker = L.marker([item.origin.lat, item.origin.lng], { icon })
    marker.on('click', () => emit('select', item))
    markerById.set(item.id, marker)
    cluster.addLayer(marker)
  }
}

onMounted(() => {
  if (!el.value) return
  map = L.map(el.value, { worldCopyJump: true }).setView([20, 10], 2)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors', maxZoom: 12,
  }).addTo(map)
  cluster = L.markerClusterGroup({ maxClusterRadius: 45 })
  map.addLayer(cluster)
  render(props.items)
})

watch(() => props.items, (items) => render(items))
watch(() => props.selectedId, (id) => {
  if (!map || !id) return
  const m = markerById.get(id)
  if (m) map.panTo(m.getLatLng(), { animate: true })
})

onBeforeUnmount(() => { map?.remove(); map = null })
</script>

<template>
  <div ref="el" class="world-map" role="application" aria-label="World map of food origins"></div>
</template>

<style>
.world-map { position: absolute; inset: 0; }
.marker-badge { width: 40px; height: 40px; border-radius: 50%; border: 3px solid; overflow: hidden; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.3); }
.marker-badge img { width: 100%; height: 100%; object-fit: cover; display: block; }
.marker-fallback { width: 100%; height: 100%; align-items: center; justify-content: center; color: #fff; font-weight: 700; }
</style>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- WorldMap`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/WorldMap.vue src/components/__tests__/WorldMap.test.ts
git commit -m "feat: add WorldMap with clustered image markers"
```

---

### Task 6: SidePanel, NutritionTable, and FilterChips components

**Files:**
- Create: `src/components/NutritionTable.vue`, `src/components/SidePanel.vue`, `src/components/FilterChips.vue`
- Test: `src/components/__tests__/SidePanel.test.ts`, `src/components/__tests__/FilterChips.test.ts`

**Interfaces:**
- `NutritionTable` props: `nutrition: ProduceItem['nutrition']`.
- `SidePanel` props: `item: ProduceItem | null`; emits `close`. Renders hero image (`heroImagePath`), name, category tag, region, story, `NutritionTable`, TasteAtlas link (`target="_blank" rel="noopener"`), attribution line if present.
- `FilterChips` props: `active: Category | 'all'`; emits `change` with `Category | 'all'`.

- [ ] **Step 1: Write failing tests**

`src/components/__tests__/SidePanel.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SidePanel from '../SidePanel.vue'
import type { ProduceItem } from '../../data/types'

const item: ProduceItem = {
  id: 'tomato', name: 'Tomato', category: 'fruit',
  origin: { lat: -12, lng: -77, region: 'Andes' },
  story: 'A tomato story.',
  nutrition: { per100g: { calories: 18, carbs: 3.9, fiber: 1.2, protein: 0.9 }, highlights: ['Lycopene'] },
  tasteAtlasUrl: 'https://www.tasteatlas.com/tomato', commonsFile: 'Tomato.jpg',
}

describe('SidePanel', () => {
  it('renders nothing when item is null', () => {
    const w = mount(SidePanel, { props: { item: null } })
    expect(w.find('.side-panel').exists()).toBe(false)
  })
  it('renders all sections for an item', () => {
    const w = mount(SidePanel, { props: { item } })
    expect(w.text()).toContain('Tomato')
    expect(w.text()).toContain('Andes')
    expect(w.text()).toContain('A tomato story.')
    expect(w.text()).toContain('Lycopene')
    const link = w.find('a.recipes-link')
    expect(link.attributes('href')).toBe('https://www.tasteatlas.com/tomato')
    expect(link.attributes('target')).toBe('_blank')
  })
  it('emits close when the close button is clicked', async () => {
    const w = mount(SidePanel, { props: { item } })
    await w.find('button.close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
```

`src/components/__tests__/FilterChips.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterChips from '../FilterChips.vue'

describe('FilterChips', () => {
  it('renders all + 4 category chips', () => {
    const w = mount(FilterChips, { props: { active: 'all' } })
    expect(w.findAll('button.chip').length).toBe(5)
  })
  it('emits change with the clicked category', async () => {
    const w = mount(FilterChips, { props: { active: 'all' } })
    await w.findAll('button.chip')[1].trigger('click')
    expect(w.emitted('change')?.[0]?.[0]).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit -- SidePanel FilterChips`
Expected: FAIL — components not found.

- [ ] **Step 3: Implement the three components**

`src/components/NutritionTable.vue`:
```vue
<script setup lang="ts">
import type { ProduceItem } from '../data/types'
defineProps<{ nutrition: ProduceItem['nutrition'] }>()
</script>
<template>
  <table class="nutrition">
    <caption>Per 100 g</caption>
    <tbody>
      <tr><th>Calories</th><td>{{ nutrition.per100g.calories }} kcal</td></tr>
      <tr><th>Carbs</th><td>{{ nutrition.per100g.carbs }} g</td></tr>
      <tr><th>Fiber</th><td>{{ nutrition.per100g.fiber }} g</td></tr>
      <tr><th>Protein</th><td>{{ nutrition.per100g.protein }} g</td></tr>
    </tbody>
  </table>
  <ul class="highlights">
    <li v-for="h in nutrition.highlights" :key="h">{{ h }}</li>
  </ul>
</template>
<style scoped>
.nutrition { width: 100%; border-collapse: collapse; margin: 8px 0; }
.nutrition th { text-align: left; color: #555; font-weight: 500; padding: 4px 0; }
.nutrition td { text-align: right; }
.nutrition caption { text-align: left; font-size: 12px; color: #888; margin-bottom: 4px; }
.highlights { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.highlights li { background: #eef6ef; color: #2f6b3a; border-radius: 12px; padding: 2px 10px; font-size: 13px; }
</style>
```

`src/components/SidePanel.vue`:
```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { ProduceItem } from '../data/types'
import { heroImagePath } from '../data/validators'
import NutritionTable from './NutritionTable.vue'
import attributions from '../../public/images/attributions.json'

const props = defineProps<{ item: ProduceItem | null }>()
defineEmits<{ close: [] }>()

const CATEGORY_LABEL: Record<string, string> = {
  fruit: 'Fruit', vegetable: 'Vegetable', legume: 'Legume', 'herb-spice': 'Herb / Spice',
}
const attribution = computed(() =>
  props.item ? (attributions as Record<string, { artist: string; license: string }>)[props.item.id] : undefined,
)
const onHeroError = (e: Event) => ((e.target as HTMLElement).style.visibility = 'hidden')
</script>
<template>
  <aside v-if="item" class="side-panel">
    <button class="close" aria-label="Close" @click="$emit('close')">✕</button>
    <img class="hero" :src="heroImagePath(item.id)" :alt="item.name" @error="onHeroError" />
    <div class="body">
      <span class="tag">{{ CATEGORY_LABEL[item.category] }}</span>
      <h2>{{ item.name }}</h2>
      <p class="region">📍 {{ item.origin.region }}</p>
      <p class="story">{{ item.story }}</p>
      <NutritionTable :nutrition="item.nutrition" />
      <a class="recipes-link" :href="item.tasteAtlasUrl" target="_blank" rel="noopener">
        Recipes on TasteAtlas ↗
      </a>
      <p v-if="attribution" class="attribution">
        Image: {{ attribution.artist }} — {{ attribution.license }} (Wikimedia Commons)
      </p>
    </div>
  </aside>
</template>
<style scoped>
.side-panel { position: absolute; top: 0; right: 0; bottom: 0; width: min(380px, 100%); background: #fff; box-shadow: -2px 0 12px rgba(0,0,0,.15); overflow-y: auto; z-index: 1000; }
.close { position: absolute; top: 10px; right: 10px; border: none; background: rgba(255,255,255,.85); border-radius: 50%; width: 32px; height: 32px; font-size: 16px; cursor: pointer; }
.hero { width: 100%; height: 200px; object-fit: cover; display: block; }
.body { padding: 16px 20px 32px; }
.tag { display: inline-block; background: #eee; border-radius: 12px; padding: 2px 10px; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #555; }
h2 { margin: 8px 0 4px; }
.region { color: #666; margin: 0 0 12px; }
.story { line-height: 1.5; }
.recipes-link { display: inline-block; margin-top: 12px; background: #e4572e; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; }
.attribution { margin-top: 16px; font-size: 11px; color: #999; }
@media (max-width: 640px) {
  .side-panel { top: auto; width: 100%; height: 70%; border-radius: 16px 16px 0 0; }
}
</style>
```

`src/components/FilterChips.vue`:
```vue
<script setup lang="ts">
import type { Category } from '../data/types'
import { CATEGORIES } from '../data/types'

defineProps<{ active: Category | 'all' }>()
defineEmits<{ change: [value: Category | 'all'] }>()

const LABELS: Record<Category | 'all', string> = {
  all: 'All', fruit: 'Fruits', vegetable: 'Vegetables', legume: 'Legumes', 'herb-spice': 'Herbs & spices',
}
const options: (Category | 'all')[] = ['all', ...CATEGORIES]
</script>
<template>
  <div class="chips">
    <button
      v-for="opt in options" :key="opt"
      class="chip" :class="{ active: active === opt }"
      @click="$emit('change', opt)"
    >{{ LABELS[opt] }}</button>
  </div>
</template>
<style scoped>
.chips { display: flex; gap: 8px; overflow-x: auto; }
.chip { border: 1px solid #ccc; background: #fff; border-radius: 16px; padding: 6px 14px; font-size: 13px; cursor: pointer; white-space: nowrap; }
.chip.active { background: #333; color: #fff; border-color: #333; }
</style>
```

Note: `SidePanel` imports `public/images/attributions.json`. Create a minimal `public/images/attributions.json` containing `{}` now if Task 4 hasn't produced one yet, so type-check and tests pass regardless of pipeline state.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit -- SidePanel FilterChips`
Expected: PASS (5 tests total).

- [ ] **Step 5: Commit**

```bash
git add src/components/NutritionTable.vue src/components/SidePanel.vue src/components/FilterChips.vue src/components/__tests__ public/images/attributions.json
git commit -m "feat: add SidePanel, NutritionTable, and FilterChips"
```

---

### Task 7: Wire up App.vue (state, filtering, selection, Esc-to-close)

**Files:**
- Modify: `src/App.vue`
- Test: `src/__tests__/app-integration.test.ts`

**Interfaces:**
- Consumes: all prior components + `produce`.
- Owns state: `selected: ProduceItem | null`, `activeFilter: Category | 'all'`.
- Passes `filteredItems` to `WorldMap`; handles `select`, `change`, `close`; closes on `Escape`.

- [ ] **Step 1: Write failing integration test**

`src/__tests__/app-integration.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'
import { produce } from '../data/produce'

describe('App integration', () => {
  it('renders header title and filter chips', () => {
    const w = mount(App)
    expect(w.text()).toContain('Food Origins Map')
    expect(w.findAll('button.chip').length).toBe(5)
  })
  it('filtering to fruits reduces the item count passed to the map', async () => {
    const w = mount(App)
    const chips = w.findAll('button.chip')
    const fruitChip = chips.find((c) => c.text() === 'Fruits')!
    await fruitChip.trigger('click')
    const map = w.findComponent({ name: 'WorldMap' })
    const passed = map.props('items') as typeof produce
    expect(passed.length).toBeLessThan(produce.length)
    expect(passed.every((p) => p.category === 'fruit')).toBe(true)
  })
  it('selecting an item opens the side panel; close hides it', async () => {
    const w = mount(App)
    const map = w.findComponent({ name: 'WorldMap' })
    map.vm.$emit('select', produce[0])
    await w.vm.$nextTick()
    expect(w.find('.side-panel').exists()).toBe(true)
    await w.find('button.close').trigger('click')
    expect(w.find('.side-panel').exists()).toBe(false)
  })
})
```

`WorldMap` must set `name: 'WorldMap'`. With `<script setup>`, add `defineOptions({ name: 'WorldMap' })` in the setup block of Task 5's component. Add this now.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- app-integration`
Expected: FAIL — App still shows placeholder / no chips.

- [ ] **Step 3: Implement App.vue**

```vue
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import WorldMap from './components/WorldMap.vue'
import SidePanel from './components/SidePanel.vue'
import FilterChips from './components/FilterChips.vue'
import { produce } from './data/produce'
import type { ProduceItem, Category } from './data/types'

const selected = ref<ProduceItem | null>(null)
const activeFilter = ref<Category | 'all'>('all')

const filteredItems = computed(() =>
  activeFilter.value === 'all' ? produce : produce.filter((p) => p.category === activeFilter.value),
)

const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') selected.value = null }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>
<template>
  <div class="app-shell">
    <header class="topbar">
      <h1>Food Origins Map</h1>
      <FilterChips :active="activeFilter" @change="activeFilter = $event" />
    </header>
    <WorldMap :items="filteredItems" :selected-id="selected?.id ?? null" @select="selected = $event" />
    <SidePanel :item="selected" @close="selected = null" />
  </div>
</template>
<style scoped>
.app-shell { position: absolute; inset: 0; }
.topbar { position: absolute; top: 0; left: 0; right: 0; z-index: 900; display: flex; align-items: center; gap: 16px; padding: 10px 16px; background: rgba(255,255,255,.92); box-shadow: 0 1px 6px rgba(0,0,0,.1); }
.topbar h1 { font-size: 18px; margin: 0; white-space: nowrap; }
@media (max-width: 640px) { .topbar { flex-direction: column; align-items: stretch; gap: 8px; } }
</style>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit -- app-integration`
Expected: PASS (3 tests).

- [ ] **Step 5: Full check**

Run: `npm run type-check && npm run test:unit`
Expected: type-check clean, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/App.vue src/components/WorldMap.vue src/__tests__/app-integration.test.ts
git commit -m "feat: wire up app state, filtering, and selection"
```

---

### Task 8: Manual verification, README, and final polish

**Files:**
- Create: `README.md`
- Modify: any bugs found during manual run.

- [ ] **Step 1: Run the dev server and verify in-browser**

Run: `npm run dev`
Verify: map loads with clustered image markers; zoom/pan work; clicking a marker opens the side panel with hero image, story, nutrition, and a working TasteAtlas link (new tab); filter chips show/hide markers; Esc and ✕ close the panel; mobile viewport shows the bottom sheet.

- [ ] **Step 2: Verify production build**

Run: `npm run build && npm run preview`
Expected: build succeeds (type-check clean), preview serves the app identically.

- [ ] **Step 3: Write README**

`README.md` covering: what it is, `npm install`, `npm run dev`, `npm run fetch-images -- --dry-run` / `npm run fetch-images` (when adding items), how to add a produce item (append to `src/data/produce.ts`, run the fetch script, the validation test guards the schema), and a Wikimedia Commons image-attribution note.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup and contribution guide"
```

---

## Self-Review Notes

- **Spec coverage:** map + zoom/pan (Task 5), image markers (Tasks 4–5), click → story/nutrition/recipe side panel (Task 6–7), 50+ dataset (Task 3), Wikimedia WebP pipeline with dry-run + idempotency + attribution (Task 4), TasteAtlas URL constraint (Tasks 2–6), category filter (Tasks 6–7), fallback rendering when pipeline never ran (Tasks 5–6, empty `attributions.json`), all four testing categories (Tasks 2,3,4,6,7). Out-of-scope items excluded.
- **Type consistency:** `ProduceItem`/`Category` defined once (Task 2), reused everywhere; `badgeImagePath`/`heroImagePath` used in Tasks 5–6; `render`/`clearLayers` naming consistent within Task 5; `WorldMap` component name set via `defineOptions` for the integration test.
- **Placeholder scan:** every code step contains full code; the only intentionally-authored-by-hand artifact is the 55-item dataset body in Task 3, which is bounded by an explicit id list and a validating test.
