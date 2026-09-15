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
is a typed, in-repo array and images are pre-generated static assets. The app
is a pure static SPA.

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
│   ├── FilterChips.vue         # Category filter buttons
│   ├── SearchView.vue          # Search panel: name/region query, category + nutrition filters
│   ├── NutritionFilter.vue     # Per-nutrient threshold sliders, used by SearchView
│   ├── ForageView.vue          # Forage panel: save points, per-point results, map toggles
│   └── Icon.vue                # Small inline SVG icon set (search/filter/leaf/close/map-pin)
├── composables/
│   ├── savedPoints.ts          # localStorage-backed saved-point CRUD (Forage)
│   └── recentFoods.ts          # localStorage-backed "last used" food MRU list (Forage)
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

### ForageView.vue + App.vue — saved points

Foraging is built around **saved points**, not the single current-location search of
earlier versions: a point is added by searching a city, or by arming "Add a point by
tapping the map" and clicking `WorldMap` (relayed up through `App.vue` as a `mapClick`
signal, back down to `ForageView` as a prop — see `composables/savedPoints.ts` for the
`localStorage` CRUD). "Use my location" is deliberately **not** one of these — it only
centers/zooms the map on the visitor's position (the same `focus` emit described below)
so they can look around before deciding where to actually drop a point; it never saves
one.

**`App.vue` owns the canonical `points` ref** (`SavedPoint[]`, read via `listSavedPoints()`),
not `ForageView` — because forage dots have to stay correct on the map even while
`ForageView` is unmounted (`forageMode` can be on with the panel closed) or while a point is
deleted from a map popup with the panel never having been open at all. `App.vue` computes
`forageMarkers` straight from `points` (one `MarkerEntry` per point × picked food, looked up
directly in `produce` by id) and passes it down to `WorldMap` as the `forage-markers` prop;
`ForageView` keeps its own local copy of `points` only to drive whichever point's food picker
is currently open, and tells `App.vue` to refresh its copy via a `pointsChanged` emit after
every mutation (add/toggle/discard). Note `forageMarkers` is deliberately **not** gated by
the food-picker's own category filter — a food the visitor picked shouldn't vanish off the
map just because they later narrowed their search for something else.

Saved points are **never rendered as a list** — the only place they show up is as dots on
the map. Creating one (tap or city search) immediately centers/zooms the map on it
(`emit('focus', …)`, picked up by `WorldMap`'s `focus` prop) and opens a **food picker
inline**, right in the `.forage-view` panel below the city-search/use-location controls
(not a modal — it was one briefly, but got hard to notice, so it was folded back into the
panel itself) for that one point: a free-text search (`foodQuery`, matched against
name/region — the "autocomplete" for finding a food without scrolling) narrows its
foragable-now results (`data/season.ts`'s `foragableNow`), further filterable by a `<select>`
type dropdown (not `FilterChips` — a chip row was too wide for the space here), each with a
checkbox opt-in (`visibleFoodIds` on the point) — a point starts with **nothing shown on the
map**, since a spot can be foragable for dozens of things at once. On small screens
(`isMobile`, tracked live via `matchMedia('(max-width: 640px)')`) the results list is
capped to 3 matches at a time, with a "N more — search to narrow it down" hint, rather
than a long scroll. Closing the picker (its own `✕`) keeps the point if at least one food
was picked; if none was, the point is discarded outright — there's no list to leave an
orphaned empty entry sitting in.

Re-picking foods for an existing point later doesn't mean re-tapping the same spot (which
would just create a second, separate point there) — **clicking its dot's popup on the map
offers Edit and Delete** (see below), and Edit is what reopens that exact point's food
picker: `App.vue`'s `onEditForagePoint(id)` opens the panel if it wasn't already
(`forageSearchOpen = true`) and sends the point id down as an `editPoint` prop (the same
nonce-signal pattern as `mapClick`, so re-clicking Edit on the same point re-opens it even if
the picker never closed), which `ForageView` watches and points `activePointId` at.

While Forage is open, `WorldMap` swaps its normal per-food origin markers for the saved
points' results instead (`origin-markers-visible="false"` + a `forage-markers` prop of
`MarkerEntry[]`, exported from `WorldMap.vue`): a food now renders at the saved point's
coordinates rather than its domestication origin, since that's what's actually relevant to
foraging there. Closing Forage restores the origin markers.

Forage markers render differently from origin markers too: a small colored dot
(`buildDotHtml`) rather than a photo badge, in their own unclustered `L.LayerGroup`
(`forageDots`) instead of the origin `markerClusterGroup`, positioned at the saved point's
*exact* coordinates — no ring-spread. **One dot per point**, however many foods were picked
there (`renderForageDots` groups entries by exact lat/lng before drawing), colored by the
first food's category with a small count badge when there's more than one. Clicking the dot
opens a popup (`buildForagePopup`, a real `HTMLElement` so each row can hold a working click
listener) listing every picked food at that point as an image + name (each a link through to
the full `SidePanel`), followed by an **Edit / Delete row**: Edit emits `editForagePoint`
with the point id (see above); Delete asks for confirmation (`window.confirm` — a one-tap,
no-undo action on a small map target otherwise) then emits `deleteForagePoint` with every
point id sharing that dot's coordinates, which `App.vue` removes via `removeSavedPoint` and
a `refreshPoints()` call — working whether or not `ForageView` is even mounted, since it
only touches `App.vue`'s own state and the composable. `MarkerEntry.pointId` is what makes
this possible: an optional field, set only on forage entries, carrying the `SavedPoint.id`
each entry came from through to the popup builder.

The food picker also carries a **"last used" shortcut row** (`composables/recentFoods.ts`,
a small global `localStorage` MRU list, most-recent first) pinned above its own filtered
results — picking a food anywhere pushes it there, so re-picking a favorite at a new point
doesn't mean re-searching from scratch. Each shortcut has its own ✕ to drop it from the
list without touching any point's actual selection.

### Mobile layout: the map is the base layer

Below 640px, `App.vue` drops the header bar entirely (`.topbar { display: none }`) and
replaces it with a small floating icon cluster (`.mobile-toolbar`: search, filter, forage
search, mode toggle) positioned `position: fixed` over the map, which now fills the
*entire* viewport (`grid-template-areas: 'map' 'panel'` — only the detail `SidePanel`
still claims a row, as a bottom sheet). `SearchView`/`ForageView` become capped-height
floating cards (`position: fixed; max-height: 70vh`) anchored below the toolbar instead
of swapping into the map's grid area — the map stays visible around and behind them,
which is the whole point: earlier mobile builds replaced the map with whatever panel was
open, so it was never visible once you touched Search or Forage. `FilterChips` gets the
same popover treatment (`.mobile-filter-pop`, toggled by `filterOpen`) rather than
sitting inline in a header that no longer exists on this breakpoint.

The map's marker mode (food origins vs. forage dots) and the Forage panel's visibility are
two independent controls, both present on desktop and mobile: the pill-shaped
`.mode-toggle` switch (`forageMode`, a plain boolean) only swaps which marker set
`WorldMap` renders (`origin-markers-visible="!forageMode"`) and never opens a panel;
`forageSearchOpen` — flipped by its own "Forage search" button, distinct from the general
"Search" button — opens/closes `ForageView` the same way `searchOpen` opens/closes
`SearchView`. A watcher (`watch(forageSearchOpen, ...)`) flips `forageMode` on when the
Forage panel opens, so saving a point immediately shows forage dots, but the toggle can
still be flipped back to origins independently while the panel stays open, and flipping it
never closes or opens either panel.

One added wrinkle: while "tap the map to add a point" is armed, `ForageView` hides itself
entirely (`.forage-view.picking { display: none }`) rather than leaving only the sliver of
map around its card tappable, replaced by a small cancelable `.picking-banner`; it
reappears (scrolled to the new point) once you tap. Desktop is unaffected — it keeps the
original header + sidebar grid, which already left the map mostly visible.

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
