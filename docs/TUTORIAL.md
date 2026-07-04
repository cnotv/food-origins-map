# Tutorial: A Map Whose Points Split Apart, With Transitions

This tutorial builds the kind of map at the center of Food Origins Map: a world
map covered in **image points that group into clusters when they'd overlap and
split apart — with animation — as you zoom in**. We use Vue 3 + Leaflet +
Leaflet.markercluster, the same stack as this app, but the ideas port to plain
JavaScript or React.

By the end you'll understand:

1. Rendering custom image markers (not default pins).
2. Clustering them so dense areas stay readable.
3. The "**split apart on zoom**" behavior and the transitions that sell it.
4. Tuning clustering so points group **only when they'd actually overlap**.
5. Animating a smooth **fly-to** transition when a point is selected.

> "Splitting points" here means the reverse of clustering: as space opens up
> (you zoom in, or click a cluster), a group **breaks apart** and its members
> animate outward to their true positions. "Transitions" are the animations that
> make that — and selection — feel continuous instead of snapping.

---

## 0. Prerequisites

```bash
npm install leaflet leaflet.markercluster
```

A data array of points. We'll use this shape:

```ts
interface Point {
  id: string
  name: string
  lat: number
  lng: number
  imageUrl: string   // small square thumbnail
  color: string      // outline color
}
```

---

## 1. A bare map with a calm basemap

Clustering and transitions read best on a quiet background. We use CARTO's
**label-free** tiles so the points — not roads and text — carry the map.

```ts
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const map = L.map('map', { worldCopyJump: true, minZoom: 2 }).setView([20, 10], 2)

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap contributors © CARTO',
  maxZoom: 12,
}).addTo(map)
```

`worldCopyJump: true` lets the map wrap seamlessly east–west, so dragging across
the antimeridian keeps points visible.

---

## 2. Custom image markers with a fallback

Default Leaflet pins can't carry an image. Use `L.divIcon` to render arbitrary
HTML — here a circular thumbnail outlined in the point's color, with a lettered
fallback if the image 404s:

```ts
function buildMarkerHtml(p: Point): string {
  const initial = p.name.charAt(0).toUpperCase()
  return `<div class="badge" style="border-color:${p.color}">
    <img src="${p.imageUrl}" alt="${p.name}"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
    <span class="fallback" style="background:${p.color};display:none">${initial}</span>
  </div>`
}

function makeMarker(p: Point): L.Marker {
  const icon = L.divIcon({
    html: buildMarkerHtml(p),
    className: 'marker-wrap',
    iconSize: [40, 40],
    iconAnchor: [20, 20], // center the 40px badge on the coordinate
  })
  return L.marker([p.lat, p.lng], { icon }).on('click', () => selectPoint(p))
}
```

```css
.badge {
  width: 40px; height: 40px; border-radius: 50%; border: 3px solid;
  overflow: hidden; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.3);
}
.badge img { width: 100%; height: 100%; object-fit: cover; display: block; }
.fallback { width: 100%; height: 100%; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; }
```

Note the **40px** size and **[20,20]** anchor — remember these numbers; they
drive the clustering threshold in step 4.

---

## 3. Clustering that splits apart on zoom

Add the plugin and drop your markers into an `L.markerClusterGroup` instead of
straight onto the map:

```ts
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

const cluster = L.markerClusterGroup({
  // animation options — see step 5
  animate: true,
  spiderfyOnMaxZoom: true,
})

for (const p of points) cluster.addLayer(makeMarker(p))
map.addLayer(cluster)
```

That's the whole splitting mechanism. `markerClusterGroup`:

- **Groups** nearby markers into a single numbered cluster circle.
- **Splits** them apart as you zoom in — clusters divide into sub-clusters and
  eventually into individual points as space opens up.
- **Splits on click** — clicking a cluster zooms to its bounds and expands it.
- **Spiderfies** at max zoom — if points share (nearly) the same coordinate and
  can't be separated by zooming, `spiderfyOnMaxZoom` fans them out on little legs
  so each is clickable.

The "splitting" is emergent: clustering is recomputed per zoom level, and fewer
points fall within the grouping radius as the world stretches out.

---

## 4. Group up *only* when points would overlap

By default the plugin clusters anything within `maxClusterRadius` pixels
(default **80**), which groups points that had plenty of room. To make points
group **only when they'd actually collide**, set the radius to the marker's own
size:

```ts
const cluster = L.markerClusterGroup({
  // Badges are 40px wide. Two badges overlap when their centers are < 40px
  // apart, so a 40px radius clusters them exactly then — and never sooner.
  maxClusterRadius: 40,
  animate: true,
  spiderfyOnMaxZoom: true,
})
```

Because the badge is 40px and anchored at its center, two badges visually touch
when their centers are ~40px apart. Matching `maxClusterRadius` to that distance
means:

- points with room to breathe **always** show as individual images, and
- they **only** collapse into a cluster when there genuinely isn't space to
  spread them without overlapping.

`maxClusterRadius` can also be a function of zoom if you want the threshold to
tighten as you zoom in:

```ts
maxClusterRadius: (zoom) => (zoom >= 8 ? 20 : 40),
```

---

## 5. The transitions that make splitting feel smooth

Two animations do the heavy lifting. Both come from the cluster plugin and are
on by default — the point is knowing which knobs exist:

```ts
const cluster = L.markerClusterGroup({
  maxClusterRadius: 40,
  animate: true,              // animate cluster split/merge on zoom
  animateAddingMarkers: false, // keep initial load snappy; animate only zoom
  spiderfyOnMaxZoom: true,    // fan out co-located points at max zoom
  disableClusteringAtZoom: 11, // below this, always show individual points
})
```

- **`animate: true`** — when a cluster splits on zoom, its children **slide out**
  from the cluster's position to their own; when they merge, they slide back in.
  This is the core "transition" of splitting points.
- **spiderfy** — the fan-out at max zoom is itself an animation (legs extend
  outward). Toggle with `spiderfyOnMaxZoom`.
- **`disableClusteringAtZoom`** — past this zoom level everything is always
  individual, giving a definite "fully split" state.

You can restyle the cluster bubbles (and thus what the user watches split/merge)
with `iconCreateFunction`:

```ts
iconCreateFunction: (cl) =>
  L.divIcon({
    html: `<div class="cluster">${cl.getChildCount()}</div>`,
    className: 'cluster-wrap',
    iconSize: [40, 40],
  }),
```

```css
/* A subtle transition so cluster bubbles scale in rather than pop. */
.cluster {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #333; color: #fff; font-weight: 700;
  transition: transform .15s ease;
}
.cluster:hover { transform: scale(1.1); }
```

---

## 6. A fly-to transition when a point is selected

Splitting isn't the only transition worth animating. When the user selects a
point (from the map or an external list), glide the map to it instead of
jumping:

```ts
function selectPoint(p: Point) {
  // Smoothly pan (and optionally zoom) to the point.
  map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 5), {
    animate: true,
    duration: 0.8,
  })
  openDetailPanel(p)
}
```

`flyTo` interpolates center **and** zoom along a curved path; `panTo` is the
pan-only version if you don't want to change zoom. This app uses a gentle
`panTo` on selection so the chosen marker slides to center without yanking the
zoom level.

If selection can target a point currently hidden inside a cluster, ask the group
to reveal it first, then the reveal animates the cluster open:

```ts
cluster.zoomToShowLayer(markerById.get(p.id), () => openDetailPanel(p))
```

---

## 7. Re-rendering when the data changes (filters)

When you filter the dataset, don't rebuild the map — just repopulate the cluster
group. The split/merge animation then plays as points appear and regroup:

```ts
function render(points: Point[]) {
  cluster.clearLayers()
  markerById.clear()
  for (const p of points) {
    const marker = makeMarker(p)
    markerById.set(p.id, marker)
    cluster.addLayer(marker)
  }
}
```

In Vue, drive this from a watcher so a changing prop re-renders markers:

```ts
watch(() => props.items, (items) => render(items))
```

---

## 8. Clean up

Leaflet holds DOM and event listeners; destroy the map when the component
unmounts:

```ts
onBeforeUnmount(() => {
  map?.remove()
  map = null
})
```

---

## Putting it together

The complete, production version of everything above lives in
[src/components/WorldMap.vue](../src/components/WorldMap.vue): custom image
badges with fallbacks, a `markerClusterGroup` tuned to `maxClusterRadius: 40` so
points group only on overlap, animated split/merge on zoom, pan-to-selection,
and filter-driven re-rendering. Read it alongside this tutorial to see each piece
in its real context.

### Recap of the knobs

| Goal | Knob |
|------|------|
| Points split apart on zoom | `markerClusterGroup` + `animate: true` |
| Group only when overlapping | `maxClusterRadius: 40` (≈ marker size) |
| Fan out co-located points | `spiderfyOnMaxZoom: true` |
| A definite "fully split" zoom | `disableClusteringAtZoom` |
| Smooth move to a selection | `map.flyTo(...)` / `panTo(...)` |
| Reveal a clustered point | `cluster.zoomToShowLayer(marker, cb)` |
| Calm backdrop for the points | CARTO `light_nolabels` tiles |
