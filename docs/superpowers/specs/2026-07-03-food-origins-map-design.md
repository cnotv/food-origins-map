# Food Origins Map — Design

**Date:** 2026-07-03
**Status:** Approved

## Purpose

An interactive world map showing where common fruits and vegetables were first
domesticated. Each item appears as an image marker at its origin location.
Clicking a marker reveals a brief history, nutrition facts, and a link to the
item's page on TasteAtlas (tasteatlas.com) for recipes and dishes.

## Decisions

| Topic | Decision |
|---|---|
| Stack | Vue 3 + TypeScript + Vite (matches user's existing projects) |
| Map engine | Leaflet + OpenStreetMap tiles, `leaflet.markercluster` for clustering |
| Dataset | 50+ hand-curated items covering all continents |
| Markers | Circular WebP image badges (36 px) with category-colored ring |
| Images | Wikimedia Commons photos, fetched by a build-prep script, converted to WebP |
| Detail view | Slide-in side panel (right on desktop, bottom sheet on mobile) |
| Recipe links | Direct links to tasteatlas.com ingredient/dish pages |
| Location | `~/projects/food-origins-map`, standalone static SPA, no backend |

## Architecture

Fully static single-page app. No runtime API calls except OSM tile loading.

```
src/
  data/produce.ts        # typed dataset, ~55 items
  components/
    WorldMap.vue         # owns Leaflet map + markers, emits select events
    SidePanel.vue        # detail view for selected item
    FilterChips.vue      # category filter
    NutritionTable.vue   # per-100g table + highlight badges
  App.vue                # state: selected item, active filter
scripts/
  fetch-images.mjs       # build-prep: Commons download -> sharp -> WebP
public/
  images/<id>-badge.webp # 128 px square (rendered as 36 px circle)
  images/<id>-hero.webp  # 640 px wide panel hero
  images/attributions.json
```

Data flows one way down (props); events flow up (`select`, `filter`).
Leaflet is fully encapsulated in `WorldMap.vue`; no other component touches it.

## Data model

```ts
interface ProduceItem {
  id: string;                       // "tomato" — unique, kebab-case
  name: string;                     // "Tomato"
  category: 'fruit' | 'vegetable' | 'legume' | 'herb-spice';
  origin: {
    lat: number;
    lng: number;
    region: string;                 // "Andes, western South America"
  };
  story: string;                    // 2–3 sentence domestication/history blurb
  nutrition: {
    per100g: { calories: number; carbs: number; fiber: number; protein: number };
    highlights: string[];           // e.g. ["Rich in lycopene", "Vitamin C"]
  };
  tasteAtlasUrl: string;            // https://www.tasteatlas.com/...
  commonsFile: string;              // curated Wikimedia Commons filename (pipeline input)
}
```

Image paths are derived from `id` by convention (`/images/<id>-badge.webp`,
`/images/<id>-hero.webp`), not stored per item.

## Image pipeline

`scripts/fetch-images.mjs`:

1. Reads the dataset's `commonsFile` per item.
2. Downloads the original via the Wikimedia Commons API.
3. Uses `sharp` to emit `<id>-badge.webp` (128 px square, center-crop) and
   `<id>-hero.webp` (640 px wide).
4. Records author/license per file in `public/images/attributions.json`.
5. Supports `--dry-run` (validate filenames exist on Commons, download nothing)
   and is idempotent (skips items whose outputs already exist unless `--force`).

Run manually when items are added; outputs are committed so the app builds
without network access.

## UI & interaction

- **Layout:** full-screen map; slim floating header with title and category
  filter chips (All / Fruits / Vegetables / Legumes / Herbs & spices). Chips
  show/hide markers live. No search in v1.
- **Markers:** 36 px circular image badge, category-colored ring. Hover tooltip
  with the name. Clusters show a count and expand on click/zoom.
- **Side panel:** hero image, name + category tag, origin region, story,
  nutrition table with highlight badges, "Recipes on TasteAtlas ↗" button
  (opens in new tab), Wikimedia attribution line. Close via ✕, Esc, or map
  click. Map pans so the selected marker stays visible beside the panel.
- **Mobile:** panel becomes a bottom sheet; header chips scroll horizontally.

## Error handling

- Missing or failed marker/hero images fall back to a category-colored dot
  showing the item's initial; the app must render fully without the pipeline
  ever having run.
- Tile-load failures are Leaflet's default behavior (gray tiles); no custom
  handling in v1.

## Testing

- **Dataset validation (Vitest):** unique ids; lat ∈ [-90, 90], lng ∈ [-180, 180];
  all required fields non-empty; `tasteAtlasUrl` starts with
  `https://www.tasteatlas.com/`; category is a known value.
- **Component tests:** SidePanel renders all sections from a fixture item;
  FilterChips filtering logic; fallback marker rendering when image missing.
- **Pipeline:** `--dry-run` mode validates Commons filenames without writing.

## Out of scope (v1)

Search, multiple origin points per item, seasonal information, i18n,
user-contributed items, offline tile caching.
