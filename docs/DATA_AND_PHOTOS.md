# How the map, data, and photos are built

This document explains the three things people most often ask about the project:
how the **map** is generated, how the **dataset** was collected, and how the
**photos** were gathered. It reflects the current state of the code and is
deliberately honest about what is precise and what is approximate.

- Map rendering: [`src/components/WorldMap.vue`](../src/components/WorldMap.vue),
  [`MiniMap.vue`](../src/components/MiniMap.vue),
  [`ImageGallery.vue`](../src/components/ImageGallery.vue),
  [`composables/basemap.ts`](../src/composables/basemap.ts)
- Data: [`src/data/`](../src/data/) (`produce.ts`, `produce-extra.ts`, `types.ts`,
  `guide.ts`, `season.ts`, `validators.ts`)
- Photo pipeline: [`scripts/`](../scripts/) (`fetch-images.mjs`,
  `fetch-part-images.mjs`, `optimize-images.mjs`)

---

## 1. How the map is generated

The map is a client-side **Leaflet** map — there is no backend. It is created in
`WorldMap.vue` and rendered over a **label-free CARTO** basemap so the produce
markers, not place names, carry the meaning. The basemap follows the operating
system's light/dark setting and swaps tiles live; that logic lives in
`composables/basemap.ts` (`addBasemap`), shared by the main map and the mini
locator map.

Each food is a Leaflet marker built from an `L.divIcon` whose HTML is the item's
circular image **badge** (80 px). Markers are grouped with
`leaflet.markercluster`, but the presentation is customised:

- **Collage cluster icons.** A cluster of 4 or fewer items is drawn as a small
  collage of the child images — 2 split vertically, 3 as radial thirds, 4 as a
  2×2 grid — with the count overlaid in bold white with a black outline. Larger
  clusters keep a single tinted disc. See `buildClusterHtml` and the
  `iconCreateFunction`.
- **Coincidence spreading.** Several foods share an *identical* origin point
  (e.g. multiple Mesoamerican crops at ~19°N, 99°W). Identical points can never
  be separated by zooming, so `markerPositions()` spreads each such group onto a
  tiny ring around the shared point. The offset is geographically negligible but
  lets zoom pull them apart automatically.
- **Explode at max zoom.** `disableClusteringAtZoom` breaks every cluster apart
  at the deepest zoom so each marker image is visible individually.

Selecting an item opens `SidePanel.vue`. Its **About** tab embeds `MiniMap.vue`,
a small non-interactive Leaflet locator that shows the item's approximate
growing region (a circle around the origin) — useful on mobile where the panel
covers the main map.

**Origin markers vs. growing area.** Every marker sits at the item's *origin*
point — the historically cited centre of domestication — **not** its modern
farmed range. The mini-map circle is an indicative region, not a cultivation
polygon (we do not have per-species range data).

**Shareable views.** App state is mirrored into the URL query string
(`?view=search|forage`, `?item=<id>`, `?tab=<slug>`) in `App.vue`, so a specific
item, tab, or panel can be linked or bookmarked.

---

## 2. How the data was collected

The dataset is **authored**, not scraped, and lives in two files merged at load
time (see [ARCHITECTURE.md](./ARCHITECTURE.md) for the two-file rationale):

- `produce.ts` — the original hand-written staples.
- `produce-extra.ts` — a bulk expansion authored in a compact tuple form.

Together they define **554 items**, each with an `id`, name, category, an origin
(`lat`/`lng` + region text), a short history, per-100 g nutrition, a TasteAtlas
link, and a Wikimedia Commons filename. `validators.ts` enforces the shape (unique
ids, coordinate ranges, required fields, TasteAtlas URLs), and guard tests run it
over the whole dataset.

Layered on top, `guide.ts` and `season.ts` add per-item knowledge:

- **Field guide** (`guide.ts`): harvest season, whether the food is farmed
  and/or foraged, whether it is safe to eat raw, side effects, and — where it can
  be foraged — habitat and identification notes, plus recipes, well-known
  varieties, and local/native names.
- **Seasons & regions** (`season.ts`): the free-text harvest season is parsed
  into a set of seasons; a location's latitude gives its hemisphere (and thus the
  current season), and a coordinate is classified into a **biogeographic realm**
  (Palearctic, Nearctic, Neotropical, Afrotropical, Indomalayan, Australasian).
  The Forage view uses these to list wild foods in season for a place.

**Honesty about accuracy.** Origins are the cited domestication centres and are
approximate. The field-guide entries — especially raw-edibility and side
effects, which are safety-sensitive (cassava, dried beans, ackee and elderberry
are toxic raw) — are authored **only where the information is reliable**;
undocumented items show a clear "not documented" state rather than a guess. The
realm boundaries are coarse lat/lng rules. None of this is a substitute for a
field guide or expert identification, and the app says so wherever it matters.

---

## 3. How the photos were collected

All images come from **Wikimedia Commons** via three build scripts. They are
resumable (skip work already done) and rate-limited to respect the Commons API.
Every image's author, license, and source URL are recorded in
`public/images/attributions.json`; the SidePanel and slideshow surface that
credit.

### Base images — `fetch-images.mjs`

For each item it resolves the declared `commonsFile` through the Commons
`imageinfo` API (batched 40–50 files per call). If that file cannot be resolved,
it falls back to a Commons **name search** and takes the first raster result, so
every item still gets a real photo. A couple of items with poor-searching names
or corrupt source files are handled by `SEARCH_OVERRIDE` / `FORCE_SEARCH`. Each
source is re-encoded with **sharp** into a small circular **badge** (map marker)
and a larger **hero** photo.

### Part images — `fetch-part-images.mjs`

For each item it fetches up to four botanical parts — **fruit, leaves, seed, and
tree/plant** — saved as `${id}-${part}.webp`. To get the right subject it:

- builds a **part-specific query** with botanical qualifiers (e.g.
  `"<name> leaf foliage plant"`) and **excludes common confusers**
  (`-butterfly -moth -stamp -logo -drawing …`) so a search like "chestnut
  leaves" doesn't return a butterfly named "Chestnut Bob";
- ranks the raster results and **prefers a filename that mentions the plant**;
- **de-duplicates per item** so each part gets a distinct photo, since keyword
  search tends to rank the same dominant image first for every part.

### Size budget — `optimize-images.mjs`

Because the whole `public/images` folder ships with the static app, a final pass
re-encodes every image to the **largest webp spec that keeps the folder under a
size budget**: badges stay a fixed size for crisp markers, while photos step down
in size/quality until the total fits. This never drops an image — it only shrinks
files. The gallery in `ImageGallery.vue` then shows whichever parts exist for an
item (any that 404 are hidden, so the layout never leaves an empty cell) and lets
you step through them in a full-screen slideshow.

**Honesty about quality.** Part images are chosen by automated keyword search, so
some are imperfect — a wrong subject slips through despite the exclusions and
filename preference, and obscure species may have no matching Commons photo at
all (those items simply show fewer tiles). The pipeline is resumable, so any
image can be re-fetched or hand-corrected by deleting the file and re-running the
relevant script.

### Re-running the pipeline

```bash
# Base badge + hero for every item (skips existing)
npm run fetch-images

# Botanical part photos for every item (skips existing)
npx vite-node scripts/fetch-part-images.mjs
#   --ids a,b,c   only these item ids
#   --limit N     only the first N items

# Shrink the whole folder under the size budget
npx vite-node scripts/optimize-images.mjs --max-mb 24
```
