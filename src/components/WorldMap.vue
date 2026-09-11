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
// Forage dot: the icon box is bigger than the dot itself (see .forage-dot in
// <style>) to leave room for the count badge in the corner.
const DOT_BOX = 28

// One marker to place: `id` is the DOM/cluster key (must be unique across the
// active set — see spreadPositions), `lat`/`lng` is where it goes, and `item`
// supplies the badge image/color. In origin mode this is each item's own
// domestication point; in forage mode it's a saved point's coordinates, so
// the same food can appear at more than one place.
export interface MarkerEntry {
  id: string
  lat: number
  lng: number
  item: ProduceItem
}

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

// Forage-mode marker: a small colored dot at the exact saved point, rather
// than a photo badge — one dot per point, however many foods were picked
// there, since it's a click target for the popup below rather than an image
// in its own right. `count` shows a small badge when more than one food
// shares the point; `color` is the first food's category (a mixed-category
// point still needs one color to draw).
export function buildDotHtml(color: string, count = 1): string {
  const badge = count > 1 ? `<span class="forage-dot-count">${count}</span>` : ''
  return `<span class="forage-dot" style="background:${color}"></span>${badge}`
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
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { addBasemap } from '../composables/basemap'

defineOptions({ name: 'WorldMap' })

const props = defineProps<{
  items: ProduceItem[]
  selectedId: string | null
  focus?: { lat: number; lng: number } | null
  // false while Forage is open: swaps the origin markers below for
  // forageMarkers instead of showing both at once.
  originMarkersVisible?: boolean
  forageMarkers?: MarkerEntry[]
}>()
const emit = defineEmits<{
  select: [item: ProduceItem]
  mapClick: [point: { lat: number; lng: number }]
}>()

// Deepest zoom; clustering is switched off here so all markers explode apart.
const MAX_ZOOM = 12
// A "city" zoom: close enough to read the surrounding area, not so close that
// a whole metro area's worth of foods falls outside the viewport.
const FOCUS_ZOOM = 10

const el = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let cluster: L.MarkerClusterGroup | null = null
// Forage-mode dots skip clustering entirely: they're small, few, and their
// whole point is to sit at the exact saved-point location rather than be
// swept into a collage like the origin badges.
let forageDots: L.LayerGroup | null = null
let resizeObserver: ResizeObserver | null = null
let cleanupBasemap: (() => void) | null = null
const markerById = new Map<string, L.Marker>()

const activeEntries = computed<MarkerEntry[]>(() =>
  props.originMarkersVisible === false
    ? (props.forageMarkers ?? [])
    : props.items.map((it) => ({ id: it.id, lat: it.origin.lat, lng: it.origin.lng, item: it })),
)

// Entries sharing an identical point can never be separated by zooming, so
// they would stay clustered (or stack) forever. Spread each such group onto a
// tiny ring around the shared point; the offset is geographically negligible
// but lets zoom pull them apart automatically, no click needed.
function spreadPositions(entries: MarkerEntry[]): Map<string, [number, number]> {
  const groups = new Map<string, MarkerEntry[]>()
  for (const e of entries) {
    const key = `${e.lat.toFixed(3)},${e.lng.toFixed(3)}`
    const g = groups.get(key)
    if (g) g.push(e)
    else groups.set(key, [e])
  }
  const positions = new Map<string, [number, number]>()
  const RING_DEG = 0.12
  for (const group of groups.values()) {
    if (group.length === 1) {
      positions.set(group[0].id, [group[0].lat, group[0].lng])
      continue
    }
    group.forEach((e, i) => {
      const angle = (2 * Math.PI * i) / group.length
      positions.set(e.id, [e.lat + RING_DEG * Math.sin(angle), e.lng + RING_DEG * Math.cos(angle)])
    })
  }
  return positions
}

// The popup a forage dot opens on click: every food picked at that exact
// point, each just an image + name, since the dot itself already told the
// visitor "something's here" — the popup's job is only to say what, with a
// click through to the full side panel for whichever one they want.
function buildForagePopup(items: ProduceItem[]): HTMLElement {
  const el = document.createElement('div')
  el.className = 'forage-popup-body'
  el.innerHTML = items
    .map(
      (item) => `
        <button type="button" class="forage-popup-item">
          <img src="${badgeImagePath(item.id)}" alt="" onerror="this.style.display='none'" />
          <span>${item.name}</span>
        </button>`,
    )
    .join('')
  el.querySelectorAll<HTMLButtonElement>('.forage-popup-item').forEach((btn, i) => {
    btn.addEventListener('click', () => emit('select', items[i]))
  })
  return el
}

// One dot per saved point, however many foods were picked there — grouping
// by the exact coordinates means there's never more than one marker sitting
// on a given spot, however many foods it opens a popup onto.
function renderForageDots(entries: MarkerEntry[]) {
  if (!map || !forageDots) return
  forageDots.clearLayers()
  const groups = new Map<string, MarkerEntry[]>()
  for (const e of entries) {
    const key = `${e.lat},${e.lng}`
    const g = groups.get(key)
    if (g) g.push(e)
    else groups.set(key, [e])
  }
  for (const group of groups.values()) {
    const items = group.map((e) => e.item)
    const icon = L.divIcon({
      html: buildDotHtml(categoryColor(items[0].category), items.length),
      className: 'forage-dot-wrap',
      iconSize: [DOT_BOX, DOT_BOX],
      iconAnchor: [DOT_BOX / 2, DOT_BOX / 2],
    })
    const marker = L.marker([group[0].lat, group[0].lng], { icon })
    marker.bindPopup(buildForagePopup(items), { className: 'forage-popup' })
    forageDots.addLayer(marker)
  }
}

function render(entries: MarkerEntry[]) {
  if (!map || !cluster || !forageDots) return
  if (props.originMarkersVisible === false) {
    cluster.clearLayers()
    markerById.clear()
    renderForageDots(entries)
    return
  }
  forageDots.clearLayers()
  cluster.clearLayers()
  markerById.clear()
  const positions = spreadPositions(entries)
  for (const entry of entries) {
    const icon = L.divIcon({
      html: buildMarkerHtml(entry.item),
      className: 'marker-wrap',
      iconSize: [MARKER_SIZE, MARKER_SIZE],
      iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
    })
    const marker = L.marker(positions.get(entry.id)!, { icon }) as L.Marker & {
      item: ProduceItem
    }
    // Stash the item so the cluster icon builder can collage child images.
    marker.item = entry.item
    marker.on('click', () => emit('select', entry.item))
    markerById.set(entry.id, marker)
    cluster.addLayer(marker)
  }
}

onMounted(() => {
  if (!el.value) return
  map = L.map(el.value, { worldCopyJump: true, minZoom: 2, maxZoom: MAX_ZOOM }).setView([20, 10], 2)
  // Basemap follows the OS light/dark setting.
  cleanupBasemap = addBasemap(map, {
    attribution: '© OpenStreetMap contributors © CARTO',
    maxZoom: MAX_ZOOM,
  })
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
  forageDots = L.layerGroup()
  map.addLayer(forageDots)
  render(activeEntries.value)
  map.on('click', (e: L.LeafletMouseEvent) => {
    // Leaflet marker/cluster icons bubble their click up to the map's own
    // 'click' event; without this guard, clicking a marker while "add a
    // point by tapping the map" is armed would also register a stray point
    // at the marker's on-screen position.
    const target = e.originalEvent.target
    if (target instanceof Element && target.closest('.leaflet-marker-icon')) return
    emit('mapClick', { lat: e.latlng.lat, lng: e.latlng.lng })
  })
  // The grid resizes the map when a sidebar opens or closes; Leaflet only
  // notices container size changes when told.
  resizeObserver = new ResizeObserver(() => map?.invalidateSize())
  resizeObserver.observe(el.value)
})

watch(activeEntries, (entries) => render(entries))
watch(
  () => props.selectedId,
  (id) => {
    if (!map || !id) return
    const m = markerById.get(id)
    if (m) map.panTo(m.getLatLng(), { animate: true })
  },
)
watch(
  () => props.focus,
  (point) => {
    if (!map || !point) return
    map.setView([point.lat, point.lng], FOCUS_ZOOM, { animate: true })
  },
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  cleanupBasemap?.()
  cleanupBasemap = null
  map?.remove()
  map = null
})
</script>

<template>
  <div ref="el" class="world-map" role="application" aria-label="World map of food origins"></div>
</template>

<style>
/* Sized by its grid track in the app shell. z-index:0 gives it a stacking
   context so Leaflet's high z-index panes stay contained — otherwise they
   paint over the search panel that shares the map cell on mobile. */
.world-map { position: relative; min-height: 0; min-width: 0; z-index: 0; }

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

/* Forage dots: one plain colored disc at the exact saved point, however many
   foods were picked there (see renderForageDots) — the icon box is bigger
   than the dot itself so the small count badge has a corner to sit in. */
.forage-dot-wrap { position: relative; background: transparent; border: none; }
.forage-dot {
  position: absolute; top: 50%; left: 50%; width: 14px; height: 14px;
  margin: -7px 0 0 -7px; border-radius: 50%; border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}
.forage-dot-count {
  position: absolute; top: 2px; right: 2px; min-width: 14px; height: 14px;
  padding: 0 2px; border-radius: 7px; background: #222; color: #fff;
  font-size: 9px; font-weight: 700; line-height: 14px; text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

/* The popup a forage dot opens: every food at that point as an image + name
   row, each a link through to the full side panel, with a little bounce on
   the way in. */
.forage-popup .leaflet-popup-content-wrapper {
  animation: forage-pop-in 260ms cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 10px;
}
.forage-popup .leaflet-popup-content { margin: 8px 10px; }
@keyframes forage-pop-in {
  0% { transform: scale(0.55); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.forage-popup-body {
  display: flex; flex-direction: column; gap: 2px; min-width: 140px; max-height: 220px;
  overflow-y: auto;
}
.forage-popup-item {
  display: flex; align-items: center; gap: 8px; border: none; background: none;
  padding: 4px 2px; border-radius: 6px; cursor: pointer; text-align: left; font: inherit;
  color: #2a6fdb;
}
.forage-popup-item:hover { background: rgba(42, 111, 219, 0.1); }
.forage-popup-item img {
  flex: none; width: 28px; height: 28px; border-radius: 50%; object-fit: cover;
}
.forage-popup-item span { font-size: 13px; }
</style>
