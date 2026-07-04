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

export function buildMarkerHtml(item: ProduceItem): string {
  const initial = item.name.charAt(0).toUpperCase()
  const color = COLORS[item.category]
  return `<div class="marker-badge" style="border-color:${color}" title="${item.name}">
    <img src="${badgeImagePath(item.id)}" alt="${item.name}"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
    <span class="marker-fallback" style="background:${color};display:none">${initial}</span>
  </div>`
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

const el = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let cluster: L.MarkerClusterGroup | null = null
const markerById = new Map<string, L.Marker>()

function render(items: ProduceItem[]) {
  if (!map || !cluster) return
  cluster.clearLayers()
  markerById.clear()
  for (const item of items) {
    const icon = L.divIcon({
      html: buildMarkerHtml(item),
      className: 'marker-wrap',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    })
    const marker = L.marker([item.origin.lat, item.origin.lng], { icon })
    marker.on('click', () => emit('select', item))
    markerById.set(item.id, marker)
    cluster.addLayer(marker)
  }
}

onMounted(() => {
  if (!el.value) return
  map = L.map(el.value, { worldCopyJump: true, minZoom: 2 }).setView([20, 10], 2)
  // Label-free CARTO basemap: keeps faint land/sea shapes but drops roads,
  // terrain, and place labels so the produce markers stand alone.
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors © CARTO',
    maxZoom: 12,
  }).addTo(map)
  // Cluster only when badges would actually overlap: the radius matches the
  // 40px marker diameter, so markers group up solely when there isn't room to
  // spread them out, and otherwise stay as individual images.
  cluster = L.markerClusterGroup({ maxClusterRadius: 40 })
  map.addLayer(cluster)
  render(props.items)
})

watch(
  () => props.items,
  (items) => render(items),
)
watch(
  () => props.selectedId,
  (id) => {
    if (!map || !id) return
    const m = markerById.get(id)
    if (m) map.panTo(m.getLatLng(), { animate: true })
  },
)

onBeforeUnmount(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div ref="el" class="world-map" role="application" aria-label="World map of food origins"></div>
</template>

<style>
.world-map { position: absolute; inset: 0; }
/* Push Leaflet's top-left zoom control clear of the fixed topbar. */
.leaflet-top .leaflet-control { margin-top: 60px; }
.marker-badge {
  width: 40px; height: 40px; border-radius: 50%; border: 3px solid;
  overflow: hidden; background: #fff; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}
.marker-badge img { width: 100%; height: 100%; object-fit: cover; display: block; }
.marker-fallback {
  width: 100%; height: 100%; align-items: center; justify-content: center;
  color: #fff; font-weight: 700;
}
</style>
