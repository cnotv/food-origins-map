# Food Origins Map

An interactive world map showing where 550+ foods — fruits, vegetables, legumes,
herbs, and spices — were first domesticated. Each item is pinned at its origin as
an image marker; clicking a marker opens a side panel with a short history,
nutrition facts, and a link to the item's page on
[TasteAtlas](https://www.tasteatlas.com/) for recipes and dishes. The map
supports zoom, pan, marker clustering, and filtering by category.

## Documentation

- **[User Guide](docs/USER_GUIDE.md)** — what the app does and how to use it.
- **[Architecture](docs/ARCHITECTURE.md)** — stack, data flow, and conventions.
- **[Data & Photos](docs/DATA_AND_PHOTOS.md)** — how the map is generated, and
  how the dataset and Wikimedia photos were collected.
- **[Tutorial](docs/TUTORIAL.md)** — build a clustered map whose points split
  apart with transitions.

## Tech stack

- **Vue 3** (`<script setup>` + TypeScript) + **Vite**
- **Leaflet** + label-free **CARTO Positron** tiles, with `leaflet.markercluster`
- **Vitest** + `@vue/test-utils` for tests
- **sharp** for the image build-prep pipeline

The app is fully static — no backend. The only network dependency at runtime is
the CARTO basemap tiles.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build
npm run type-check # vue-tsc --noEmit
npm run test:unit  # run the Vitest suite
```

## Data

Produce entries are split across two files, both typed by `ProduceItem` in
[`src/data/types.ts`](src/data/types.ts):

- [`src/data/produce.ts`](src/data/produce.ts) — the original hand-written
  `curated` entries, and the exported `produce = [...curated, ...produceExtra]`.
- [`src/data/produce-extra.ts`](src/data/produce-extra.ts) — the 500+ item bulk
  expansion in a compact tuple form expanded by a `toItem()` mapper.

The dataset is guarded by [`src/data/validators.ts`](src/data/validators.ts) and
a test (`src/data/__tests__/produce.test.ts`) that enforces unique ids, in-range
coordinates, non-empty fields, a `https://www.tasteatlas.com/` recipe URL, and a
valid category on every item.

## Images (build-prep pipeline)

Marker and hero images are **generated**, not fetched at runtime. Each item
references a Wikimedia Commons filename via `commonsFile`. The pipeline in
[`scripts/fetch-images.mjs`](scripts/fetch-images.mjs) downloads each file,
produces a 128×128 `-badge.webp` and a 640 px-wide `-hero.webp` under
`public/images/`, and records author/license in
`public/images/attributions.json`. If an item's exact `commonsFile` doesn't
resolve, the pipeline falls back to a **Commons name search** and uses the first
matching photo, so every item still gets a real image.

```bash
npm run fetch-images -- --dry-run   # validate all commonsFile names resolve on Commons (no writes)
npm run fetch-images                # download + convert (idempotent: skips existing)
npm run fetch-images -- --force     # re-download everything
```

Image paths are derived by convention from `id` (`/images/<id>-badge.webp`,
`/images/<id>-hero.webp`), so they are never stored on items. If an image is
missing, markers fall back to a category-colored circle with the item's initial
and the hero image is hidden — the app renders fully even if the pipeline never
ran.

The Wikimedia Commons API is rate-limited, so the pipeline batches metadata
lookups and retries downloads with backoff. A full run of 550+ items (with the
search fallback) takes a while; it is idempotent and skips items whose WebP
assets already exist.

## Adding a produce item

1. Append a `Row` tuple to
   [`src/data/produce-extra.ts`](src/data/produce-extra.ts) (a real Commons
   filename in the last field helps the image pipeline resolve exactly).
2. Run `npm run type-check` and `npm run test:unit` — the validator flags any
   schema issues.
3. Run `npm run fetch-images` to generate its WebP assets (the search fallback
   covers filenames that don't resolve).

## Attribution

All produce images come from **Wikimedia Commons** under their respective
licenses (recorded in `public/images/attributions.json` and shown in the side
panel). Map tiles are © OpenStreetMap contributors.
