<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import WorldMap from './components/WorldMap.vue'
import SidePanel from './components/SidePanel.vue'
import SearchView from './components/SearchView.vue'
import FilterChips from './components/FilterChips.vue'
import { produce } from './data/produce'
import type { ProduceItem, Category } from './data/types'

const selected = ref<ProduceItem | null>(null)
const activeFilter = ref<Category | 'all'>('all')
const searchOpen = ref(false)

const filteredItems = computed(() =>
  activeFilter.value === 'all' ? produce : produce.filter((p) => p.category === activeFilter.value),
)

const onSearchSelect = (item: ProduceItem) => {
  selected.value = item
}

// GitHub's new-issue form pre-filled with the current app state.
// A static client can't create issues directly without exposing a token,
// so the user confirms with one click on GitHub.
const ISSUES_URL = 'https://github.com/cnotv/food-origins-map/issues/new'
const bugReportUrl = computed(() => {
  const body = [
    '**Describe the bug**',
    '',
    '',
    '---',
    '_App state when reported:_',
    `- Filter: ${activeFilter.value}`,
    `- Selected item: ${selected.value?.name ?? 'none'}`,
    `- Search open: ${searchOpen.value}`,
    `- User agent: ${navigator.userAgent}`,
  ].join('\n')
  const params = new URLSearchParams({ title: '[Bug] ', labels: 'bug', body })
  return `${ISSUES_URL}?${params}`
})

const onKey = (e: KeyboardEvent) => {
  if (e.key !== 'Escape') return
  // Close the topmost overlay first: detail panel, then search.
  if (selected.value) selected.value = null
  else if (searchOpen.value) searchOpen.value = false
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>
<template>
  <div class="app-shell">
    <header class="topbar">
      <h1>Food Origins Map</h1>
      <FilterChips :active="activeFilter" @change="activeFilter = $event" />
      <button
        class="search-toggle"
        :class="{ active: searchOpen }"
        :aria-pressed="searchOpen"
        @click="searchOpen = !searchOpen"
      >
        🔍 Search
      </button>
      <a class="bug-link" :href="bugReportUrl" target="_blank" rel="noopener">bugs?</a>
    </header>
    <WorldMap
      :items="filteredItems"
      :selected-id="selected?.id ?? null"
      @select="selected = $event"
    />
    <SearchView
      v-if="searchOpen"
      :items="produce"
      :selected-id="selected?.id ?? null"
      @select="onSearchSelect"
      @close="searchOpen = false"
    />
    <SidePanel :item="selected" @close="selected = null" />
  </div>
</template>
<style scoped>
.app-shell {
  position: absolute; inset: 0;
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: auto 1fr auto;
  grid-template-areas:
    'header header header'
    'search map    panel';
}
/* Scoped styles reach each child component's root element, so the whole
   shell layout is assigned here in one place. */
.topbar { grid-area: header; }
.app-shell :deep(.search-view) { grid-area: search; }
.app-shell :deep(.world-map) { grid-area: map; }
.app-shell :deep(.side-panel) { grid-area: panel; }
.topbar {
  z-index: 900;
  display: flex; align-items: center; gap: 16px; padding: 10px 16px;
  background: #fff; box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
}
.topbar h1 { font-size: 18px; margin: 0; white-space: nowrap; }
.search-toggle {
  margin-left: auto; border: 1px solid #ccc; background: #fff;
  border-radius: 16px; padding: 6px 14px; font-size: 13px; cursor: pointer;
  white-space: nowrap;
}
.search-toggle.active { background: #333; color: #fff; border-color: #333; }
.bug-link { flex: none; font-size: 13px; color: #666; }
.bug-link:hover { color: #333; }
@media (max-width: 640px) {
  /* Phones cannot fit sidebars next to the map: search swaps into the map
     slot, and the detail panel becomes a bottom row that pushes the map up. */
  .app-shell {
    grid-template-rows: auto 1fr auto;
    grid-template-columns: 1fr;
    grid-template-areas: 'header' 'map' 'panel';
  }
  .app-shell :deep(.search-view) { grid-area: map; z-index: 2; }
  .topbar { flex-wrap: wrap; gap: 8px; }
  .topbar h1 { flex: 1; }
  .bug-link { order: 2; }
  /* Scoped styles reach the FilterChips root element. */
  .topbar .chips-row { order: 3; flex-basis: 100%; }
  .search-toggle { margin-left: 0; order: 4; flex-basis: 100%; }
}
</style>
