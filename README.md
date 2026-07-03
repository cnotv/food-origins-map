# Food Origins Map

An interactive world map showing where common fruits and vegetables were first
domesticated. Each item is pinned at its origin as an image marker; clicking a
marker opens a side panel with a short history, nutrition facts, and a link to
the item's page on [TasteAtlas](https://www.tasteatlas.com/) for recipes and
dishes. The map supports zoom, pan, marker clustering, and filtering by
category.

## Tech stack

- **Vue 3** (`<script setup>` + TypeScript) + **Vite**
- **Leaflet** + OpenStreetMap tiles, with `leaflet.markercluster`
- **Vitest** + `@vue/test-utils` for tests
- **sharp** for the image build-prep pipeline

The app is fully static — no backend. The only network dependency at runtime is
OpenStreetMap tiles.

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

All produce entries live in [`src/data/produce.ts`](src/data/produce.ts), typed
by `ProduceItem` in [`src/data/types.ts`](src/data/types.ts). The dataset is
guarded by [`src/data/validators.ts`](src/data/validators.ts) and a test
(`src/data/__tests__/produce.test.ts`) that enforces unique ids, in-range
coordinates, non-empty fields, a `https://www.tasteatlas.com/` recipe URL, and a
valid category on every item.

## Images (build-prep pipeline)

Marker and hero images are **generated**, not fetched at runtime. Each item
references a real Wikimedia Commons filename via `commonsFile`. The pipeline in
[`scripts/fetch-images.mjs`](scripts/fetch-images.mjs) downloads each file,
produces a 128×128 `-badge.webp` and a 640 px-wide `-hero.webp` under
`public/images/`, and records author/license in
`public/images/attributions.json`.

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
lookups and retries downloads with backoff. A full run of ~55 items takes a
couple of minutes.

## Adding a produce item

1. Append a `ProduceItem` to `src/data/produce.ts` with a real Commons filename
   in `commonsFile`.
2. Run `npm run fetch-images -- --dry-run` to confirm the filename resolves.
3. Run `npm run fetch-images` to generate its WebP assets.
4. Run `npm run test:unit` — the dataset validator will flag any schema issues.

## Attribution

All produce images come from **Wikimedia Commons** under their respective
licenses (recorded in `public/images/attributions.json` and shown in the side
panel). Map tiles are © OpenStreetMap contributors.
