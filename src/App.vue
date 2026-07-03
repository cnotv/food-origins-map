<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import WorldMap from './components/WorldMap.vue'
import SidePanel from './components/SidePanel.vue'
import FilterChips from './components/FilterChips.vue'
import { produce } from './data/produce'
import type { ProduceItem, Category } from './data/types'

const selected = ref<ProduceItem | null>(null)
const activeFilter = ref<Category | 'all'>('all')

const filteredItems = computed(() =>
  activeFilter.value === 'all' ? produce : produce.filter((p) => p.category === activeFilter.value),
)

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') selected.value = null
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>
<template>
  <div class="app-shell">
    <header class="topbar">
      <h1>Food Origins Map</h1>
      <FilterChips :active="activeFilter" @change="activeFilter = $event" />
    </header>
    <WorldMap
      :items="filteredItems"
      :selected-id="selected?.id ?? null"
      @select="selected = $event"
    />
    <SidePanel :item="selected" @close="selected = null" />
  </div>
</template>
<style scoped>
.app-shell { position: absolute; inset: 0; }
.topbar {
  position: absolute; top: 0; left: 0; right: 0; z-index: 900;
  display: flex; align-items: center; gap: 16px; padding: 10px 16px;
  background: rgba(255, 255, 255, 0.92); box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
}
.topbar h1 { font-size: 18px; margin: 0; white-space: nowrap; }
@media (max-width: 640px) {
  .topbar { flex-direction: column; align-items: stretch; gap: 8px; }
}
</style>
