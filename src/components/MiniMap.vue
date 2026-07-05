<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import L from 'leaflet'
import type { ProduceItem } from '../data/types'
import { categoryColor } from './WorldMap.vue'

const props = defineProps<{ item: ProduceItem }>()

const el = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let resizeObserver: ResizeObserver | null = null
const layerGroup = L.layerGroup()

// A non-interactive locator: shows where in the world the item comes from, with
// its approximate growing region, so it can be found even when the main map is
// hidden (e.g. the full-page mobile detail view).
function draw(item: ProduceItem) {
  if (!map) return
  const { lat, lng } = item.origin
  const color = categoryColor(item.category)
  layerGroup.clearLayers()
  L.circle([lat, lng], {
    radius: 750_000,
    color,
    weight: 1.5,
    fillColor: color,
    fillOpacity: 0.15,
  }).addTo(layerGroup)
  L.circleMarker([lat, lng], {
    radius: 5,
    color: '#fff',
    weight: 2,
    fillColor: color,
    fillOpacity: 1,
  }).addTo(layerGroup)
  map.setView([lat, lng], 3)
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
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    maxZoom: 12,
  }).addTo(map)
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
  border: 1px solid #eee; background: #eef1f2;
}
.mini-cap { display: block; margin-top: 4px; font-size: 11px; color: #999; }
</style>
