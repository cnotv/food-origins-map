# Architecture

Developer-facing overview of how Food Origins Map is built: the stack, the data
flow, the module layout, and the conventions that keep the dataset trustworthy.

For end-user behavior see [USER_GUIDE.md](./USER_GUIDE.md). For a hands-on build
walkthrough of the map itself see [TUTORIAL.md](./TUTORIAL.md).

---

## Stack

| Concern | Choice | Notes |
|---------|--------|-------|
| Framework | **Vue 3** (`<script setup>`) | Single-file components |
| Build tool | **Vite** | Dev server, bundling, `vite-node` for scripts |
| Language | **TypeScript** | Strict types across data and components |
| Mapping | **Leaflet** + **Leaflet.markercluster** | Tiles, markers, clustering/animation |
| Basemap | **CARTO Positron (no labels)** | Roads/labels stripped so markers dominate |
| Testing | **Vitest** + Vue Test Utils + jsdom | Unit, component, and integration tests |
| Images | **sharp** + a Wikimedia Commons pipeline | Generates WebP badges & heroes offline |

There is no backend and no runtime data fetching for content: the food dataset
is a typed, in-repo array and images are pre-generated static assets. The app is
a pure static SPA.

---

## High-level data flow

```
src/data/produce.ts ──┐
                      │  (typed ProduceItem[])
                      ▼
                  App.vue  ── holds selected item + active category filter
                   │  │
        filteredItems │  │ selected
                   ▼  ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ FilterChips  │  │  WorldMap    │  │  SidePanel   │
    │ (category)   │  │  (Leaflet)   │  │ (detail +    │
    │              │  │  markers +   │  │  Nutrition   │
    │              │  │  clustering  │  │  Table)      │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                 │                 ▲
            └── change ───────┘   select ───────┘
              (App updates activeFilter / selected)

public/images/<id>-badge.webp   ← marker thumbnails
public/images/<id>-hero.webp    ← side-panel photos
   ▲
   └── generated offline by scripts/fetch-images.mjs (Wikimedia Commons → sharp → WebP)
```

`App.vue` owns two pieces of state — the active category filter and the selected
food — and passes derived props down. Children emit events up; there is no store
or global state library, which is appropriate for this app's size.

---

## Module layout

```
src/
├── App.vue                     # Root: owns filter + selection state, Esc-to-close
├── main.ts                     # App bootstrap
├── styles/global.css           # Global styles
├── components/
│   ├── WorldMap.vue            # Leaflet map, markers, clustering, pan-to-selection
│   ├── SidePanel.vue           # Slide-in detail panel for the selected food
│   ├── NutritionTable.vue      # Per-100g nutrition + highlights
│   └── FilterChips.vue         # Category filter buttons
└── data/
    ├── types.ts                # ProduceItem, Category, CATEGORIES
    ├── validators.ts           # validateDataset() + image path helpers
    ├── produce.ts              # curated[] + exported produce = [...curated, ...produceExtra]
    └── produce-extra.ts        # bulk dataset (compact tuple rows → ProduceItem[])

scripts/
└── fetch-images.mjs            # Offline image pipeline (Commons → WebP)

public/images/                  # Generated <id>-badge.webp / <id>-hero.webp + attributions.json
```

---

## The data model

Everything hangs off one type in [src/data/types.ts](../src/data/types.ts):

```ts
export type Category = 'fruit' | 'vegetable' | 'legume' | 'herb-spice'

export interface ProduceItem {
  id: string                    // kebab-case, unique, used for image filenames
  name: string
  category: Category
  origin: { lat: number; lng: number; region: string }
  story: string                 // sourced origin narrative
  nutrition: {
    per100g: { calories: number; carbs: number; fiber: number; protein: number }
    highlights: string[]
  }
  tasteAtlasUrl: string         // must start with https://www.tasteatlas.com/
  commonsFile: string           // Wikimedia Commons filename for the image pipeline
}
```

### Two-file dataset

The dataset is intentionally split:

- **[produce.ts](../src/data/produce.ts)** holds the original, richly hand-written
  `curated` entries as full object literals, and exports the final array as
  `[...curated, ...produceExtra]`.
- **[produce-extra.ts](../src/data/produce-extra.ts)** holds the bulk expansion
  (500+ items) in a **compact tuple form** that a `toItem()` mapper expands into
  `ProduceItem` objects.

Why tuples? At this scale, repeating a dozen object keys per entry is noisy and
error-prone (easy to typo a key, duplicate an id, or drift the shape). A
positional `Row` tuple keeps each food on one line and funnels every entry
through a single typed constructor, so the shape can't drift:

```ts
type Row = [id, name, category, lat, lng, region, story,
            calories, carbs, fiber, protein, highlights, tasteAtlasSlug, commonsFile]

const rows: Row[] = [
  ['pear', 'Pear', 'fruit', 41, 44, 'South Caucasus & Anatolia', '…story…',
   57, 15, 3.1, 0.4, ['Fiber', 'Vitamin C', 'Copper'], 'pear', 'Pears.jpg'],
  // …
]
export const produceExtra: ProduceItem[] = rows.map(toItem)
```

The `Category` position is type-checked, and `tasteAtlasSlug` is expanded to a
full URL inside `toItem()`, so the tuple stays terse without weakening types.

---

## Data integrity: the validator + guard tests

Because the dataset is large and hand-authored, correctness is enforced by code,
not vigilance.

[validators.ts](../src/data/validators.ts) exports `validateDataset()`, which
returns an array of human-readable error strings (empty = valid). It checks:

- unique, kebab-case `id`s
- non-empty `name`, `region`, `story`, and `highlights`
- `category` is one of the four allowed values
- latitude in [−90, 90], longitude in [−180, 180]
- `tasteAtlasUrl` starts with `https://www.tasteatlas.com/`
- non-empty `commonsFile`

[src/data/__tests__/produce.test.ts](../src/data/__tests__/produce.test.ts) then
asserts the *shipped* dataset:

- has at least 50 items,
- returns `[]` from `validateDataset()`, and
- covers **every** category.

So a malformed entry — a duplicate id, an out-of-range coordinate, a bad
TasteAtlas URL — fails CI rather than silently shipping. Adding foods is safe:
if the tests pass, the data is structurally sound.

The same `id` doubles as the image filename key via
`badgeImagePath(id)` / `heroImagePath(id)` (`/images/<id>-badge.webp`), which is
why ids must be unique and filename-safe.

---

## Components

### WorldMap.vue

The heart of the app. Responsibilities:

- Initializes a Leaflet map with the **label-free CARTO basemap**.
- Renders each `ProduceItem` as an `L.divIcon` **badge** — a circular WebP
  thumbnail outlined in its category color, with a lettered fallback if the image
  fails (`onerror` swaps to a colored initial).
- Adds all markers to an `L.markerClusterGroup` so crowded regions **collapse
  into clusters and split apart on zoom** (see the tutorial for the mechanics).
- Watches `props.items` and re-renders markers when the category filter changes.
- Watches `props.selectedId` and **pans** to the chosen marker.
- Emits `select` when a marker is clicked.

Two exported helpers, `buildMarkerHtml()` and `categoryColor()`, are pure and
unit-tested independently of Leaflet.

**Clustering policy:** `maxClusterRadius` is set to the 40px badge diameter, so
markers group up *only* when they would otherwise overlap, and stay as
individual images wherever there's room.

### SidePanel.vue + NutritionTable.vue

`SidePanel` renders the selected food's hero image, name, region, story, a
`NutritionTable`, and the TasteAtlas link, and emits `close`. `NutritionTable`
renders the per-100g figures and highlight chips. Both are presentational and
driven entirely by props.

### FilterChips.vue

Renders a chip per category (plus "All"), highlights the active one, and emits
`change`. `App.vue` maps this to `activeFilter` and recomputes `filteredItems`.

---

## The image pipeline

Images are **not** fetched at runtime. `scripts/fetch-images.mjs`
(run via `npm run fetch-images`, executed with `vite-node`) turns each item into
two static WebP assets:

- `<id>-badge.webp` — 128×128 cover crop, the map marker.
- `<id>-hero.webp` — 640px-wide fit, the side-panel photo.

Flow per item:

1. **Batch resolve.** Query the Commons `imageinfo` API for up to 40 files at a
   time (`resolveAllInfo`) to stay under rate limits, mapping API title
   normalization back to the requested filename.
2. **Search fallback.** If an item's exact `commonsFile` doesn't resolve,
   `searchCommonsImage()` runs a Commons File-namespace search on the item's name
   and takes the first JPEG/PNG result — so every item gets a real image even if
   its pinned filename is stale.
3. **Download + convert.** `downloadWithRetry()` fetches the original (with
   backoff on 429/5xx), and `sharp` produces the badge and hero WebPs.
4. **Attribution.** Author, license, and source URL for each image are written to
   `public/images/attributions.json`.

The script is resilient: it batches, backs off on rate limits, skips items whose
outputs already exist (unless `--force`), supports `--dry-run`, and collects
failures into a non-zero exit code rather than aborting the whole run.

Design constraints worth preserving:

- The exported helpers `commonsInfoUrl`, `commonsSearchUrl`, and `outputPaths`
  are covered by [scripts/__tests__/fetch-images.test.mjs](../scripts/__tests__/fetch-images.test.mjs)
  — keep their signatures stable.
- The script guards `if (!process.env.VITEST) main()` so importing it in tests
  doesn't hit the network.

---

## Testing

`npm run test:unit` runs Vitest across:

- **Data** — validator rules and the shipped-dataset guard.
- **Components** — `WorldMap` marker HTML/color helpers, `SidePanel`,
  `FilterChips`.
- **Integration** — `app-integration.test.ts` wires the app together (filter →
  map, select → panel, Esc → close).
- **Script** — `fetch-images` URL/path helpers.

`npm run type-check` (`vue-tsc --noEmit`) type-checks the whole project,
including the dataset, so tuple/shape errors surface at compile time.

---

## Conventions & gotchas

- **Add foods to `produce-extra.ts`, not `produce.ts`.** Append a `Row` tuple;
  run `npm run type-check` and `npm run test:unit`; then `npm run fetch-images`
  to generate its images.
- **`id` is a contract.** It must be unique, kebab-case, and stable — it names
  the image files. Renaming an id orphans its images.
- **Coordinates are domestication centers,** not modern production centers or
  precise points; the `story` should justify the pin.
- **Keep `tasteAtlasUrl` on the real host** (`https://www.tasteatlas.com/…`) or
  the validator rejects it.
- **Generated images live in `public/images/`** and are committed (not
  gitignored), so a clean checkout renders without a network run.
