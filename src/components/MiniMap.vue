<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import L from 'leaflet'
import type { ProduceItem } from '../data/types'
import { categoryColor } from './WorldMap.vue'
import { addBasemap } from '../composables/basemap'
import { regionBounds } from '../data/regions'

const props = defineProps<{ item: ProduceItem }>()

const el = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let resizeObserver: ResizeObserver | null = null
let cleanupBasemap: (() => void) | null = null
const layerGroup = L.layerGroup()

// A non-interactive locator: shows where in the world the item comes from, with
// its approximate growing region, so it can be found even when the main map is
// hidden (e.g. the full-page mobile detail view).
function draw(item: ProduceItem) {
  if (!map) return
  const { lat, lng } = item.origin
  const color = categoryColor(item.category)
  layerGroup.clearLayers()

  // When the origin text names broad regions (e.g. "Europe & western Asia"),
  // shade and frame that whole area so the map actually shows it — not just a
  // radius around the single origin point.
  const bounds = regionBounds(item.origin.region, item.origin)
  if (bounds) {
    const [s, w, n, e] = bounds
    L.rectangle(
      [
        [s, w],
        [n, e],
      ],
      { color, weight: 1, fillColor: color, fillOpacity: 0.12 },
    ).addTo(layerGroup)
    map.fitBounds(
      [
        [s, w],
        [n, e],
      ],
      { padding: [12, 12] },
    )
  } else {
    // No recognised region: fall back to a radius around the origin.
    L.circle([lat, lng], {
      radius: 750_000,
      color,
      weight: 1.5,
      fillColor: color,
      fillOpacity: 0.15,
    }).addTo(layerGroup)
    map.setView([lat, lng], 3)
  }

  L.circleMarker([lat, lng], {
    radius: 5,
    color: '#fff',
    weight: 2,
    fillColor: color,
    fillOpacity: 1,
  }).addTo(layerGroup)
  nextTick(() => map?.invalidateSize())
}

onMounted(() => {
  if (!el.value) return
  map = L.map(el.value, {
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    touchZoom: false,
  })
  cleanupBasemap = addBasemap(map, { maxZoom: 12 })
  layerGroup.addTo(map)
  draw(props.item)
  // The panel/tab it lives in can be hidden then shown; keep the map sized.
  resizeObserver = new ResizeObserver(() => map?.invalidateSize())
  resizeObserver.observe(el.value)
})
watch(
  () => props.item.id,
  () => draw(props.item),
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
  <div class="mini-map-wrap">
    <div ref="el" class="mini-map" role="img" :aria-label="`Locator map for ${item.name}`"></div>
    <span class="mini-cap">Approximate growing region</span>
  </div>
</template>
<style scoped>
.mini-map-wrap { margin: 0 0 4px; }
.mini-map {
  width: 100%; height: 170px; border-radius: 10px; overflow: hidden;
  border: 1px solid var(--border); background: var(--surface-2);
}
.mini-cap { display: block; margin-top: 4px; font-size: 11px; color: var(--text-faint); }
</style>
