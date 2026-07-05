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

const MARKER_SIZE = 80

// A single badge: the produce image with a lettered fallback if it 404s.
function badgeCellHtml(item: ProduceItem): string {
  const initial = item.name.charAt(0).toUpperCase()
  const color = COLORS[item.category]
  return `<img src="${badgeImagePath(item.id)}" alt="${item.name}"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
    <span class="marker-fallback" style="background:${color}">${initial}</span>`
}

export function buildMarkerHtml(item: ProduceItem): string {
  const color = COLORS[item.category]
  return `<div class="marker-badge" style="border-color:${color}" title="${item.name}">
    ${badgeCellHtml(item)}
  </div>`
}

// Cluster icon. For 4 or fewer children the badges are collaged into a small
// grid so their images stay visible; the count sits on top in bold white with
// a crisp black shadow. A lone child shows just its image, no number. Larger
// clusters keep a single tinted circle with the count.
export function buildClusterHtml(items: ProduceItem[]): string {
  const count = items.length
  const label = count > 1 ? `<span class="cluster-count">${count}</span>` : ''
  if (count <= 4) {
    const cells = items
      .map(
        (item) =>
          `<div class="cluster-cell" style="border-color:${COLORS[item.category]}">${badgeCellHtml(item)}</div>`,
      )
      .join('')
    return `<div class="cluster-collage collage-${count}">${cells}${label}</div>`
  }
  return `<div class="cluster-solid">${label}</div>`
}
</script>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

defineOptions({ name: 'WorldMap' })

const props = defineProps<{ items: ProduceItem[]; selectedId: string | null }>()
const emit = defineEmits<{ select: [item: ProduceItem] }>()

// Deepest zoom; clustering is switched off here so all markers explode apart.
const MAX_ZOOM = 12

const el = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let cluster: L.MarkerClusterGroup | null = null
let resizeObserver: ResizeObserver | null = null
let areaLayer: L.Circle | null = null
const markerById = new Map<string, L.Marker>()

// Indicative radius of the origin/growing region. We only have a single origin
// point per item, not a true cultivation polygon, so this is a labelled
// approximation rather than exact range data.
const AREA_RADIUS_M = 750_000

function clearArea() {
  if (areaLayer && map) map.removeLayer(areaLayer)
  areaLayer = null
}

function showArea(item: ProduceItem) {
  if (!map) return
  clearArea()
  const color = COLORS[item.category]
  areaLayer = L.circle([item.origin.lat, item.origin.lng], {
    radius: AREA_RADIUS_M,
    color,
    weight: 1.5,
    fillColor: color,
    fillOpacity: 0.12,
    interactive: false,
  }).addTo(map)
  areaLayer.bindTooltip(`Approximate growing region of ${item.name}`, { sticky: true })
}

// Items sharing an identical origin point can never be separated by zooming,
// so they would stay clustered (or stack) forever. Spread each such group onto
// a tiny ring around the shared point; the offset is geographically negligible
// but lets zoom pull them apart automatically, no click needed.
function markerPositions(items: ProduceItem[]): Map<string, [number, number]> {
  const groups = new Map<string, ProduceItem[]>()
  for (const it of items) {
    const key = `${it.origin.lat.toFixed(3)},${it.origin.lng.toFixed(3)}`
    const g = groups.get(key)
    if (g) g.push(it)
    else groups.set(key, [it])
  }
  const positions = new Map<string, [number, number]>()
  const RING_DEG = 0.12
  for (const group of groups.values()) {
    if (group.length === 1) {
      const it = group[0]
      positions.set(it.id, [it.origin.lat, it.origin.lng])
      continue
    }
    group.forEach((it, i) => {
      const angle = (2 * Math.PI * i) / group.length
      positions.set(it.id, [
        it.origin.lat + RING_DEG * Math.sin(angle),
        it.origin.lng + RING_DEG * Math.cos(angle),
      ])
    })
  }
  return positions
}

function render(items: ProduceItem[]) {
  if (!map || !cluster) return
  cluster.clearLayers()
  markerById.clear()
  const positions = markerPositions(items)
  for (const item of items) {
    const icon = L.divIcon({
      html: buildMarkerHtml(item),
      className: 'marker-wrap',
      iconSize: [MARKER_SIZE, MARKER_SIZE],
      iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
    })
    const marker = L.marker(positions.get(item.id)!, { icon }) as L.Marker & {
      item: ProduceItem
    }
    // Stash the item so the cluster icon builder can collage child images.
    marker.item = item
    marker.on('click', () => emit('select', item))
    markerById.set(item.id, marker)
    cluster.addLayer(marker)
  }
}

onMounted(() => {
  if (!el.value) return
  map = L.map(el.value, { worldCopyJump: true, minZoom: 2, maxZoom: MAX_ZOOM }).setView([20, 10], 2)
  // Label-free CARTO basemap: keeps faint land/sea shapes but drops roads,
  // terrain, and place labels so the produce markers stand alone.
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors © CARTO',
    maxZoom: MAX_ZOOM,
  }).addTo(map)
  // Cluster only when badges would actually overlap: the radius matches the
  // marker diameter, so markers group up solely when there isn't room to
  // spread them out, and otherwise stay as individual images.
  cluster = L.markerClusterGroup({
    maxClusterRadius: MARKER_SIZE,
    // At the deepest zoom, break every cluster apart so each doubled-size
    // marker image is visible individually.
    disableClusteringAtZoom: MAX_ZOOM,
    // Clicking a cluster whose markers share (near-)identical points can't be
    // resolved by zooming, so fan them out instead. The wider multiplier keeps
    // the doubled 80px markers from overlapping once spiderfied.
    spiderfyOnMaxZoom: true,
    spiderfyDistanceMultiplier: 2.5,
    iconCreateFunction: (c) => {
      const items = (c.getAllChildMarkers() as (L.Marker & { item: ProduceItem })[]).map(
        (m) => m.item,
      )
      const size = items.length <= 4 ? MARKER_SIZE : 56
      return L.divIcon({
        html: buildClusterHtml(items),
        className: 'cluster-wrap',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      })
    },
  })
  map.addLayer(cluster)
  render(props.items)
  // The grid resizes the map when a sidebar opens or closes; Leaflet only
  // notices container size changes when told.
  resizeObserver = new ResizeObserver(() => map?.invalidateSize())
  resizeObserver.observe(el.value)
})

watch(
  () => props.items,
  (items) => render(items),
)
watch(
  () => props.selectedId,
  (id) => {
    if (!map) return
    if (!id) {
      clearArea()
      return
    }
    const item = props.items.find((it) => it.id === id)
    if (item) showArea(item)
    const m = markerById.get(id)
    if (m) map.panTo(m.getLatLng(), { animate: true })
  },
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  clearArea()
  map?.remove()
  map = null
})
</script>

<template>
  <div ref="el" class="world-map" role="application" aria-label="World map of food origins"></div>
</template>

<style>
/* Sized by its grid track in the app shell. */
.world-map { position: relative; min-height: 0; min-width: 0; }

/* Every label on the map — cluster counts — is bold white with a crisp
   black outline so it stays legible over the produce photos beneath it. */
.cluster-count {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 20px; color: #fff;
  text-shadow:
    -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000,
    0 2px 2px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

.marker-badge {
  width: 80px; height: 80px; border-radius: 50%; border: 3px solid;
  overflow: hidden; background: #fff; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}
.marker-badge img,
.cluster-cell img { width: 100%; height: 100%; object-fit: cover; display: block; }
.marker-fallback {
  width: 100%; height: 100%; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 28px; display: none;
}

/* Small clusters: collage the child images inside the disc, count overlaid.
   2 → split vertically into halves, 3 → radial thirds, 4 → 2×2 grid. */
.cluster-collage {
  position: relative; width: 80px; height: 80px; border-radius: 50%;
  overflow: hidden; background: #fff; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}
.cluster-cell { position: relative; overflow: hidden; }
.cluster-cell .marker-fallback { font-size: 18px; }

/* 1: single image fills the disc. */
.collage-1 { display: grid; }

/* 2: a vertical divide into left and right halves. */
.collage-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; }

/* 4: a 2×2 grid. */
.collage-4 { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 1px; }

/* 3: three radial wedges meeting at the centre (a Mercedes-style split).
   Each cell fills the disc and is clipped to a 120° sector. */
.collage-3 .cluster-cell { position: absolute; inset: 0; }
.collage-3 .cluster-cell:nth-child(1) { clip-path: polygon(50% 50%, 50% 0, 100% 0, 100% 79%); }
.collage-3 .cluster-cell:nth-child(2) { clip-path: polygon(50% 50%, 100% 79%, 100% 100%, 0 100%, 0 79%); }
.collage-3 .cluster-cell:nth-child(3) { clip-path: polygon(50% 50%, 0 79%, 0 0, 50% 0); }

/* Large clusters keep a single tinted disc. */
.cluster-solid {
  position: relative; width: 56px; height: 56px; border-radius: 50%;
  background: rgba(51, 51, 51, 0.9); box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}
</style>
