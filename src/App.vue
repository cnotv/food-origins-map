<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import WorldMap from './components/WorldMap.vue'
import SidePanel from './components/SidePanel.vue'
import SearchView from './components/SearchView.vue'
import ForageView from './components/ForageView.vue'
import MapsView from './components/MapsView.vue'
import FilterChips from './components/FilterChips.vue'
import { produce } from './data/produce'
import { CATEGORIES } from './data/types'
import type { ProduceItem, Category } from './data/types'

const selected = ref<ProduceItem | null>(null)
const activeFilter = ref<Category | 'all'>('all')
const searchOpen = ref(false)
const forageOpen = ref(false)
const mapsOpen = ref(false)
const mapFocus = ref<{ lat: number; lng: number } | null>(null)

// Detail-panel tab, kept here so it can be reflected in the URL.
const TAB_SLUGS = {
  About: 'about',
  'Field guide': 'field-guide',
  Recipes: 'recipes',
  Varieties: 'varieties',
} as const
type Tab = keyof typeof TAB_SLUGS
const SLUG_TABS = Object.fromEntries(Object.entries(TAB_SLUGS).map(([k, v]) => [v, k])) as Record<
  string,
  Tab
>
const detailTab = ref<Tab>('About')

// Search, Forage and Maps share the same left slot, so only one is open at a time.
function closeOverlays() {
  searchOpen.value = false
  forageOpen.value = false
  mapsOpen.value = false
}
function toggleSearch() {
  const next = !searchOpen.value
  closeOverlays()
  searchOpen.value = next
}
function toggleForage() {
  const next = !forageOpen.value
  closeOverlays()
  forageOpen.value = next
}
function toggleMaps() {
  const next = !mapsOpen.value
  closeOverlays()
  mapsOpen.value = next
}

const filteredItems = computed(() =>
  activeFilter.value === 'all' ? produce : produce.filter((p) => p.category === activeFilter.value),
)

const onSearchSelect = (item: ProduceItem) => {
  selected.value = item
  detailTab.value = 'About'
}

// --- URL query-parameter sync ---------------------------------------------
// Restore state from the URL on load, and keep the URL in step with the open
// panel (?view=search|forage), the selected item (?item=<id>), its active tab
// (?tab=<slug>) and the category filter (?filter=<category>), so views are
// shareable, bookmarkable, and reusable as the payload for a saved map (see
// MapsView, which stores this same query string under a name).
function buildQueryString(): string {
  const p = new URLSearchParams()
  if (searchOpen.value) p.set('view', 'search')
  else if (forageOpen.value) p.set('view', 'forage')
  if (activeFilter.value !== 'all') p.set('filter', activeFilter.value)
  if (selected.value) {
    p.set('item', selected.value.id)
    if (detailTab.value !== 'About') p.set('tab', TAB_SLUGS[detailTab.value])
  }
  return p.toString()
}

function applyUrl() {
  const p = new URLSearchParams(location.search)
  const view = p.get('view')
  searchOpen.value = view === 'search'
  forageOpen.value = view === 'forage'
  mapsOpen.value = false
  const filter = p.get('filter') as Category | null
  activeFilter.value = filter && CATEGORIES.includes(filter) ? filter : 'all'
  const id = p.get('item')
  selected.value = (id && produce.find((it) => it.id === id)) || null
  const tab = p.get('tab')
  detailTab.value = (tab && SLUG_TABS[tab]) || 'About'
}

let syncing = false
watch(
  [searchOpen, forageOpen, activeFilter, selected, detailTab],
  () => {
    if (syncing) return
    const qs = buildQueryString()
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname)
  },
  { deep: false },
)

function onPopState() {
  syncing = true
  applyUrl()
  syncing = false
}

// Loading a saved map (MapsView) replays it the same way as following a
// bookmarked URL: rewrite the query string, then re-derive state from it.
function onLoadMap(query: string) {
  syncing = true
  history.replaceState(null, '', query ? `?${query}` : location.pathname)
  applyUrl()
  syncing = false
  mapsOpen.value = false
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
  // Close the topmost overlay first: detail panel, then search/forage.
  if (selected.value) selected.value = null
  else if (searchOpen.value) searchOpen.value = false
  else if (forageOpen.value) forageOpen.value = false
  else if (mapsOpen.value) mapsOpen.value = false
}
onMounted(() => {
  applyUrl()
  window.addEventListener('keydown', onKey)
  window.addEventListener('popstate', onPopState)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('popstate', onPopState)
})
</script>
<template>
  <div class="app-shell">
    <header class="topbar">
      <h1>Food Origins Map</h1>
      <FilterChips :active="activeFilter" @change="activeFilter = $event" />
      <button
        class="forage-toggle"
        :class="{ active: forageOpen }"
        :aria-pressed="forageOpen"
        @click="toggleForage"
      >
        Forage
      </button>
      <button
        class="search-toggle"
        :class="{ active: searchOpen }"
        :aria-pressed="searchOpen"
        @click="toggleSearch"
      >
        Search
      </button>
      <button
        class="maps-toggle"
        :class="{ active: mapsOpen }"
        :aria-pressed="mapsOpen"
        @click="toggleMaps"
      >
        Maps
      </button>
      <a class="bug-link" :href="bugReportUrl" target="_blank" rel="noopener">bugs?</a>
    </header>
    <WorldMap
      :items="filteredItems"
      :selected-id="selected?.id ?? null"
      :focus="mapFocus"
      @select="selected = $event"
    />
    <SearchView
      v-if="searchOpen"
      :items="produce"
      :selected-id="selected?.id ?? null"
      @select="onSearchSelect"
      @close="searchOpen = false"
    />
    <ForageView
      v-if="forageOpen"
      :items="produce"
      :selected-id="selected?.id ?? null"
      @select="onSearchSelect"
      @close="forageOpen = false"
      @focus="mapFocus = $event"
    />
    <MapsView
      v-if="mapsOpen"
      :current-query="buildQueryString()"
      @load="onLoadMap"
      @close="mapsOpen = false"
    />
    <SidePanel
      :item="selected"
      :tab="detailTab"
      @update:tab="detailTab = $event"
      @close="selected = null"
    />
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
.app-shell :deep(.search-view),
.app-shell :deep(.forage-view),
.app-shell :deep(.maps-view) { grid-area: search; }
.app-shell :deep(.world-map) { grid-area: map; }
.app-shell :deep(.side-panel) { grid-area: panel; }
.topbar {
  z-index: 900;
  display: flex; align-items: center; gap: 16px; padding: 10px 16px;
  background: var(--surface); color: var(--text); box-shadow: 0 1px 6px var(--shadow);
  /* Let the header shrink to its grid track instead of being forced wider by
     the chip row's content (which would overflow the page horizontally). */
  min-width: 0;
}
.topbar h1 { font-size: 18px; margin: 0; white-space: nowrap; }
.search-toggle, .forage-toggle, .maps-toggle {
  border: 1px solid var(--border-strong); background: var(--surface);
  color: var(--text); border-radius: 16px; padding: 6px 14px; font-size: 13px;
  cursor: pointer; white-space: nowrap;
}
.forage-toggle { margin-left: auto; }
.search-toggle.active, .forage-toggle.active, .maps-toggle.active {
  background: var(--accent); color: var(--on-accent); border-color: var(--accent);
}
.bug-link { flex: none; font-size: 13px; color: var(--text-muted); }
.bug-link:hover { color: var(--text); }
@media (max-width: 640px) {
  /* Phones cannot fit sidebars next to the map: search swaps into the map
     slot, and the detail panel becomes a bottom row that pushes the map up. */
  .app-shell {
    grid-template-rows: auto 1fr auto;
    grid-template-columns: 1fr;
    grid-template-areas: 'header' 'map' 'panel';
  }
  .app-shell :deep(.search-view),
  .app-shell :deep(.forage-view),
  .app-shell :deep(.maps-view) {
    grid-area: map; z-index: 2; position: relative; min-width: 0;
  }
  .topbar { flex-wrap: wrap; gap: 8px; }
  .topbar h1 { flex: 1; }
  .bug-link { order: 2; }
  /* Scoped styles reach the FilterChips root element. */
  .topbar .chips-row { order: 3; flex-basis: 100%; }
  /* Forage + Search + Maps share the next row, side by side. */
  .forage-toggle { margin-left: 0; order: 4; flex: 1; }
  .search-toggle { margin-left: 0; order: 5; flex: 1; }
  .maps-toggle { margin-left: 0; order: 6; flex: 1; }
}
</style>
