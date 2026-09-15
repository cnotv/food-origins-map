<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import WorldMap, { type MarkerEntry } from './components/WorldMap.vue'
import SidePanel from './components/SidePanel.vue'
import SearchView from './components/SearchView.vue'
import ForageView from './components/ForageView.vue'
import FilterChips from './components/FilterChips.vue'
import Icon from './components/Icon.vue'
import { produce } from './data/produce'
import { CATEGORIES } from './data/types'
import type { ProduceItem, Category } from './data/types'
import { listSavedPoints, removeSavedPoint, type SavedPoint } from './composables/savedPoints'

const selected = ref<ProduceItem | null>(null)
const activeFilter = ref<Category | 'all'>('all')
const searchOpen = ref(false)
// The forage *search* panel (city search, use-my-location, tap-to-add, and
// the inline food picker for whichever point is active) — a dropdown like
// SearchView's, opened by its own button. Distinct from forageMode below:
// opening this panel is not what puts the map into forage mode, though it
// does so as a convenience (see the watcher further down) — you can also
// just flip the mode toggle on its own, with no panel involved.
const forageSearchOpen = ref(false)
// The map's marker mode: false = normal per-food origin markers, true =
// forage dots for saved points. A plain toggle switch, independent of any
// panel — flipping it never opens a dropdown.
const forageMode = ref(false)
// Mobile only: the compact filter popover under the toolbar's filter icon
// (desktop shows FilterChips inline in the topbar instead — see template).
const filterOpen = ref(false)
const mapFocus = ref<{ lat: number; lng: number } | null>(null)
// Saved points live here, not inside ForageView, so they (and the dots they
// produce below) stay correct even while ForageView is unmounted — forageMode
// can be on with the panel closed, and the map popup's Edit/Delete can change
// them without the panel open at all.
const points = ref<SavedPoint[]>(listSavedPoints())
function refreshPoints() {
  points.value = listSavedPoints()
}
// Every picked food across every saved point, positioned at that point — the
// markers WorldMap draws as forage dots while forageMode is on. Independent
// of any category filter: a food the visitor picked shouldn't vanish off the
// map just because they later narrowed the food-picker's own search.
const forageMarkers = computed<MarkerEntry[]>(() =>
  points.value.flatMap((point) =>
    point.visibleFoodIds
      .map((id) => produce.find((it) => it.id === id))
      .filter((it): it is ProduceItem => !!it)
      .map((item) => ({ id: `${point.id}:${item.id}`, lat: point.lat, lng: point.lng, item, pointId: point.id })),
  ),
)
// A click on the map, relayed down to ForageView so it can drop a point
// there while its own "tap the map" pick mode is armed. A fresh object each
// time (via the nonce) so the watcher fires even for two clicks at one spot.
const mapClickSignal = ref<{ lat: number; lng: number; nonce: number } | null>(null)
let mapClickNonce = 0
function onMapClick(point: { lat: number; lng: number }) {
  mapClickNonce++
  mapClickSignal.value = { ...point, nonce: mapClickNonce }
}
// "Edit" on a forage dot's popup: make sure the panel is open, then tell
// ForageView which point to open its food-picker for (nonce so re-clicking
// the same point's Edit still re-fires the watcher).
const editPointSignal = ref<{ id: string; nonce: number } | null>(null)
let editPointNonce = 0
function onEditForagePoint(id: string) {
  forageSearchOpen.value = true
  editPointNonce++
  editPointSignal.value = { id, nonce: editPointNonce }
}
// "Delete" on a forage dot's popup: works whether or not the panel is open,
// since it only touches the composable + this component's own points ref.
function onDeleteForagePoint(ids: string[]) {
  for (const id of ids) removeSavedPoint(id)
  refreshPoints()
}

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

// Search, forage-search and the filter popover share the same dropdown slot,
// so only one is open at a time. forageMode is not an overlay — it's a
// standing display mode — so it's untouched here.
function closeOverlays() {
  searchOpen.value = false
  forageSearchOpen.value = false
  filterOpen.value = false
}
function toggleSearch() {
  const next = !searchOpen.value
  closeOverlays()
  searchOpen.value = next
}
function toggleForageSearch() {
  const next = !forageSearchOpen.value
  closeOverlays()
  forageSearchOpen.value = next
}
function toggleFilter() {
  const next = !filterOpen.value
  closeOverlays()
  filterOpen.value = next
}
function onMobileFilterChange(value: Category | 'all') {
  activeFilter.value = value
  filterOpen.value = false
}

// Opening the forage-search panel is a convenient way into forage mode, but
// the mode toggle stays independently flippable — closing the panel doesn't
// turn it back off.
watch(forageSearchOpen, (open) => {
  if (open) forageMode.value = true
})

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
// shareable and bookmarkable.
function buildQueryString(): string {
  const p = new URLSearchParams()
  if (searchOpen.value) p.set('view', 'search')
  else if (forageSearchOpen.value) p.set('view', 'forage')
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
  forageSearchOpen.value = view === 'forage'
  const filter = p.get('filter') as Category | null
  activeFilter.value = filter && CATEGORIES.includes(filter) ? filter : 'all'
  const id = p.get('item')
  selected.value = (id && produce.find((it) => it.id === id)) || null
  const tab = p.get('tab')
  detailTab.value = (tab && SLUG_TABS[tab]) || 'About'
}

let syncing = false
watch(
  [searchOpen, forageSearchOpen, activeFilter, selected, detailTab],
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
  // Close the topmost overlay first: detail panel, then search/forage/filter.
  if (selected.value) selected.value = null
  else if (searchOpen.value) searchOpen.value = false
  else if (forageSearchOpen.value) forageSearchOpen.value = false
  else if (filterOpen.value) filterOpen.value = false
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
    <!-- Desktop: a conventional header bar above the map. -->
    <header class="topbar">
      <h1>Food Origins Map</h1>
      <FilterChips :active="activeFilter" @change="activeFilter = $event" />
      <button
        type="button"
        class="mode-toggle"
        role="switch"
        :aria-checked="forageMode"
        aria-label="Show forage points on the map instead of food origins"
        :class="{ on: forageMode }"
        @click="forageMode = !forageMode"
      >
        <Icon name="map-pin" class="toggle-icon off-icon" />
        <span class="toggle-knob"></span>
        <Icon name="leaf" class="toggle-icon on-icon" />
      </button>
      <button
        class="forage-toggle"
        :class="{ active: forageSearchOpen }"
        :aria-pressed="forageSearchOpen"
        @click="toggleForageSearch"
      >
        <Icon name="leaf" /> Forage search
      </button>
      <button
        class="search-toggle"
        :class="{ active: searchOpen }"
        :aria-pressed="searchOpen"
        @click="toggleSearch"
      >
        <Icon name="search" /> Search
      </button>
      <a class="bug-link" :href="bugReportUrl" target="_blank" rel="noopener">bugs?</a>
    </header>

    <!-- Mobile: the map fills the screen; these float over it in a corner
         instead of pushing it out of view (see .mobile-toolbar below). -->
    <div class="mobile-toolbar">
      <button
        class="mt-btn"
        :class="{ active: searchOpen }"
        :aria-pressed="searchOpen"
        aria-label="Search foods"
        @click="toggleSearch"
      >
        <Icon name="search" />
      </button>
      <button
        class="mt-btn"
        :class="{ active: filterOpen }"
        :aria-pressed="filterOpen"
        aria-label="Filter by type"
        @click="toggleFilter"
      >
        <Icon name="filter" />
      </button>
      <button
        class="mt-btn"
        :class="{ active: forageSearchOpen }"
        :aria-pressed="forageSearchOpen"
        aria-label="Search foraging spots"
        @click="toggleForageSearch"
      >
        <Icon name="leaf" />
      </button>
      <button
        type="button"
        class="mode-toggle"
        role="switch"
        :aria-checked="forageMode"
        aria-label="Show forage points on the map instead of food origins"
        :class="{ on: forageMode }"
        @click="forageMode = !forageMode"
      >
        <Icon name="map-pin" class="toggle-icon off-icon" />
        <span class="toggle-knob"></span>
        <Icon name="leaf" class="toggle-icon on-icon" />
      </button>
    </div>
    <div v-if="filterOpen" class="mobile-filter-pop">
      <FilterChips :active="activeFilter" @change="onMobileFilterChange" />
    </div>

    <WorldMap
      :items="filteredItems"
      :selected-id="selected?.id ?? null"
      :focus="mapFocus"
      :origin-markers-visible="!forageMode"
      :forage-markers="forageMarkers"
      @select="selected = $event"
      @map-click="onMapClick"
      @edit-forage-point="onEditForagePoint"
      @delete-forage-point="onDeleteForagePoint"
    />
    <SearchView
      v-if="searchOpen"
      :items="produce"
      :selected-id="selected?.id ?? null"
      @select="onSearchSelect"
      @close="searchOpen = false"
    />
    <ForageView
      v-if="forageSearchOpen"
      :items="produce"
      :selected-id="selected?.id ?? null"
      :map-click="mapClickSignal"
      :edit-point="editPointSignal"
      @select="onSearchSelect"
      @close="forageSearchOpen = false"
      @focus="mapFocus = $event"
      @points-changed="refreshPoints"
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
.app-shell :deep(.forage-view) { grid-area: search; }
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
.search-toggle, .forage-toggle {
  display: flex; align-items: center; gap: 6px;
  border: 1px solid var(--border-strong); background: var(--surface);
  color: var(--text); border-radius: 16px; padding: 6px 14px; font-size: 13px;
  cursor: pointer; white-space: nowrap;
}
.mode-toggle { margin-left: auto; }
.search-toggle.active, .forage-toggle.active {
  background: var(--accent); color: var(--on-accent); border-color: var(--accent);
}
.bug-link { flex: none; font-size: 13px; color: var(--text-muted); }
.bug-link:hover { color: var(--text); }

/* The map/forage mode switch: a plain two-position toggle, not a button that
   opens anything — flipping it only ever changes which markers WorldMap
   shows (see origin-markers-visible on <WorldMap>). */
.mode-toggle {
  position: relative; flex: none; display: flex; align-items: center; justify-content: space-between;
  width: 56px; height: 30px; padding: 0 6px; border-radius: 15px;
  border: 1px solid var(--border-strong); background: var(--surface); cursor: pointer;
}
.mode-toggle .toggle-icon {
  position: relative; z-index: 1; font-size: 13px; color: var(--text-faint);
}
.mode-toggle:not(.on) .off-icon { color: var(--text); }
.mode-toggle.on .on-icon { color: var(--on-accent); }
.toggle-knob {
  position: absolute; top: 2px; left: 2px; width: 24px; height: 24px; border-radius: 50%;
  background: var(--border-strong); transition: transform 150ms ease, background 150ms ease;
}
.mode-toggle.on .toggle-knob { transform: translateX(26px); background: var(--accent); }

/* Mobile toolbar + filter popover: hidden on desktop, where the topbar above
   already carries these controls inline. */
.mobile-toolbar, .mobile-filter-pop { display: none; }

@media (max-width: 640px) {
  /* The map is the persistent base layer on phones — no sidebar, no full-
     screen takeover. The topbar is replaced by a small floating toolbar
     (below) that sits on top of the map in a corner; only the detail panel
     still claims a grid row of its own, as a bottom sheet when a food is
     selected. */
  .app-shell {
    grid-template-rows: 1fr auto;
    grid-template-columns: 1fr;
    grid-template-areas: 'map' 'panel';
  }
  .topbar { display: none; }

  .mobile-toolbar {
    display: flex; align-items: center; gap: 8px;
    position: fixed; top: 12px; right: 12px; z-index: 600;
  }
  .mt-btn {
    width: 42px; height: 42px; border-radius: 50%; font-size: 18px;
    border: 1px solid var(--border-strong); background: var(--surface);
    color: var(--text); box-shadow: 0 2px 8px var(--shadow);
    display: flex; align-items: center; justify-content: center; cursor: pointer;
  }
  .mt-btn.active {
    background: var(--accent); color: var(--on-accent); border-color: var(--accent);
  }
  .mobile-toolbar .mode-toggle {
    width: 60px; height: 34px; box-shadow: 0 2px 8px var(--shadow);
  }
  .mobile-toolbar .mode-toggle .toggle-icon { font-size: 15px; }
  .mobile-toolbar .mode-toggle .toggle-knob { width: 26px; height: 26px; }
  .mobile-toolbar .mode-toggle.on .toggle-knob { transform: translateX(26px); }
  .mobile-filter-pop {
    display: block;
    position: fixed; top: 60px; right: 12px; z-index: 600;
    max-width: calc(100vw - 24px);
    background: var(--surface); border-radius: 12px; box-shadow: 0 4px 16px var(--shadow-strong);
    padding: 8px;
  }

  /* Search/Forage float above the map as a capped-height card instead of
     replacing it (each is position:fixed in its own mobile media query, so
     it takes no grid track — see SearchView.vue / ForageView.vue). */
}
</style>
