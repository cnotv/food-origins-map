<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { ProduceItem, Category } from '../data/types'
import { badgeImagePath } from '../data/validators'
import { categoryColor, type MarkerEntry } from './WorldMap.vue'
import FilterChips from './FilterChips.vue'
import {
  foragableNow,
  currentSeasonForLat,
  hemisphere,
  classifyRealm,
  REALM_LABEL,
  type Season,
} from '../data/season'
import {
  addSavedPoint,
  listSavedPoints,
  removeSavedPoint,
  toggleFoodVisibility,
  type SavedPoint,
} from '../composables/savedPoints'
import { listRecentFoods, pushRecentFood, removeRecentFood } from '../composables/recentFoods'
import Icon from './Icon.vue'

const props = defineProps<{
  items: ProduceItem[]
  selectedId: string | null
  // A click relayed from WorldMap; only acted on while pickMode is armed. A
  // fresh object on every click (App.vue) is what makes the watcher below
  // fire even for two clicks at the same spot.
  mapClick: { lat: number; lng: number; nonce: number } | null
}>()
const emit = defineEmits<{
  select: [item: ProduceItem]
  close: []
  focus: [point: { lat: number; lng: number }]
  markers: [entries: MarkerEntry[]]
}>()

const CATEGORY_LABEL: Record<string, string> = {
  fruit: 'Fruit',
  vegetable: 'Vegetable',
  legume: 'Legume',
  'herb-spice': 'Herb / Spice',
}
const SEASON_LABEL: Record<Season, string> = {
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
}

const query = ref('')
const category = ref<Category | 'all'>('all')
const loading = ref(false)
const error = ref('')
// Arms map-click picking: the next click relayed from WorldMap adds a point.
const pickMode = ref(false)

// Saved points are never listed in the UI — they only ever show up as dots on
// the map (`mapMarkers` below) — but this component still needs to know them
// to compute those dots and to drive the food-picker dialog.
const points = ref<SavedPoint[]>(listSavedPoints())

// The point just created (by tap or city search) whose food-picker dialog is
// open. There's no way back to it once closed — saved points live only on
// the map, not in a list to revisit — so re-picking foods for a spot means
// defining it again (tap/search it a second time; same-location points merge
// into one dot on the map regardless).
const activePointId = ref<string | null>(null)
const activePoint = computed(() => points.value.find((p) => p.id === activePointId.value) ?? null)
const foodQuery = ref('')

// Small screens get a shorter, search-driven picker instead of a long
// scrollable list — tracked live so rotating/resizing updates it.
const isMobile = ref(false)
let mobileMq: MediaQueryList | null = null
function onMobileChange() {
  if (mobileMq) isMobile.value = mobileMq.matches
}
onMounted(() => {
  mobileMq = window.matchMedia('(max-width: 640px)')
  isMobile.value = mobileMq.matches
  mobileMq.addEventListener('change', onMobileChange)
})
onUnmounted(() => {
  mobileMq?.removeEventListener('change', onMobileChange)
})

function addPoint(label: string, lat: number, lng: number) {
  const point = addSavedPoint(label, lat, lng)
  points.value = listSavedPoints()
  // Centers/zooms the map on the new point instead of leaving the visitor to
  // pan or scroll to find it.
  emit('focus', { lat, lng })
  foodQuery.value = ''
  activePointId.value = point.id
}

watch(
  () => props.mapClick,
  (click) => {
    if (!click || !pickMode.value) return
    pickMode.value = false
    addPoint(`Tapped point (${click.lat.toFixed(2)}, ${click.lng.toFixed(2)})`, click.lat, click.lng)
  },
)

// Closing the dialog without picking anything discards the point — nothing
// worth keeping (or showing on the map) came of it, and there's no list to
// leave an empty entry sitting in.
function closeDialog() {
  const point = activePoint.value
  activePointId.value = null
  if (point && point.visibleFoodIds.length === 0) {
    removeSavedPoint(point.id)
    points.value = points.value.filter((p) => p.id !== point.id)
  }
}

// A global "last used" shortlist (across all points), pinned above the
// dialog's own filtered results so re-picking a favorite at a new point
// doesn't mean re-searching from scratch.
const recentIds = ref<string[]>(listRecentFoods())
const recentItems = computed(() =>
  recentIds.value
    .map((id) => props.items.find((it) => it.id === id))
    .filter((it): it is ProduceItem => !!it),
)

function toggleFood(pointId: string, foodId: string) {
  const point = points.value.find((p) => p.id === pointId)
  const turningOn = !point?.visibleFoodIds.includes(foodId)
  toggleFoodVisibility(pointId, foodId)
  points.value = listSavedPoints()
  if (turningOn) {
    pushRecentFood(foodId)
    recentIds.value = listRecentFoods()
  }
}

function removeRecent(id: string) {
  removeRecentFood(id)
  recentIds.value = listRecentFoods()
}

const seasonFor = (point: SavedPoint) => currentSeasonForLat(point.lat)
const realmFor = (point: SavedPoint) => classifyRealm(point.lat, point.lng)
const resultsFor = (point: SavedPoint) => foragableNow(props.items, point.lat, point.lng)
// Narrow the in-season results by category (fruit, vegetable, …) — this also
// gates what's drawn on the map (`mapMarkers` below), so switching category
// here hides non-matching picks from the map too, same as before.
const filteredFor = (point: SavedPoint) => {
  const results = resultsFor(point)
  return category.value === 'all' ? results : results.filter((it) => it.category === category.value)
}

// The dialog's own results: category-filtered, then narrowed further by the
// free-text search (name or region) — the "autocomplete" for finding a food
// to pick without scrolling a long list.
const dialogResults = computed(() => {
  if (!activePoint.value) return []
  const q = foodQuery.value.trim().toLowerCase()
  const base = filteredFor(activePoint.value)
  return q
    ? base.filter((it) => it.name.toLowerCase().includes(q) || it.origin.region.toLowerCase().includes(q))
    : base
})
// On mobile, only show the first few matches — search to narrow further
// instead of scrolling a long list.
const visibleResults = computed(() => {
  if (!isMobile.value) return dialogResults.value
  return dialogResults.value.slice(0, 3)
})
const hiddenResultCount = computed(() => dialogResults.value.length - visibleResults.value.length)

// What actually renders on the map: only the foods explicitly picked on at
// each point (of its filtered results), positioned at that point rather than
// the food's own domestication origin.
const mapMarkers = computed<MarkerEntry[]>(() =>
  points.value.flatMap((point) =>
    filteredFor(point)
      .filter((item) => point.visibleFoodIds.includes(item.id))
      .map((item) => ({ id: `${point.id}:${item.id}`, lat: point.lat, lng: point.lng, item })),
  ),
)
watch(mapMarkers, (m) => emit('markers', m), { immediate: true })

// Fetch JSON with a hard timeout so a stalled or blocked request surfaces an
// error instead of leaving the UI stuck on "Locating…".
async function fetchJson(url: string, ms = 8000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

async function geocodeCity() {
  const q = query.value.trim()
  if (!q) return
  loading.value = true
  error.value = ''
  try {
    const data = await fetchJson(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1`,
    )
    const hit = data.results?.[0]
    if (!hit) {
      error.value = `Couldn't find "${q}".`
      return
    }
    addPoint([hit.name, hit.country].filter(Boolean).join(', '), hit.latitude, hit.longitude)
    query.value = ''
  } catch {
    error.value = 'Location lookup failed — check your connection (or an ad/privacy blocker) and try again.'
  } finally {
    loading.value = false
  }
}

// Just centers the map on the visitor's location to look around — it does
// not save a point. Only a map tap (or a city search) saves one.
function useMyLocation() {
  if (!navigator.geolocation) {
    error.value = 'Your browser does not support location access.'
    return
  }
  loading.value = true
  error.value = ''
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      emit('focus', { lat: pos.coords.latitude, lng: pos.coords.longitude })
      loading.value = false
    },
    (err) => {
      error.value =
        err.code === err.PERMISSION_DENIED
          ? 'Location permission denied.'
          : 'Could not get your location.'
      loading.value = false
    },
    { timeout: 10000, maximumAge: 60000 },
  )
}

const onThumbError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
  const fallback = img.nextElementSibling as HTMLElement | null
  if (fallback) fallback.style.display = 'flex'
}
// The compact "last used" chips have no fallback-initial sibling to swap in
// (there's no room for it at that size) — just hide a broken thumbnail.
const onChipThumbError = (e: Event) => {
  ;(e.target as HTMLImageElement).style.display = 'none'
}
</script>

<template>
  <!-- While pick mode is armed, the floating card (mobile) hides itself so
       the whole map is tappable instead of just the sliver around it — this
       banner is the only thing that stays up, as a cancelable reminder. -->
  <div v-if="pickMode" class="picking-banner">
    <span>Tap the map to place your point…</span>
    <button type="button" aria-label="Cancel adding a point" @click="pickMode = false"><Icon name="close" /></button>
  </div>
  <aside class="forage-view" :class="{ picking: pickMode }" role="dialog" aria-label="Forage near a location">
    <header class="forage-head">
      <div class="row">
        <h2>Forage now</h2>
        <button class="close" aria-label="Close" @click="emit('close')"><Icon name="close" /></button>
      </div>
      <p class="lede">
        Save a spot to see what's in season there right now — it shows up as a dot on the map.
      </p>
      <form class="loc-form" @submit.prevent="geocodeCity">
        <input
          v-model="query"
          class="loc-input"
          type="text"
          placeholder="Enter a city…"
          aria-label="City name"
          :disabled="loading"
        />
        <button type="submit" class="go" :disabled="loading">Go</button>
      </form>
      <button class="use-loc" :disabled="loading" @click="useMyLocation">Use my location</button>
      <button
        class="pick-toggle"
        :class="{ active: pickMode }"
        :aria-pressed="pickMode"
        @click="pickMode = !pickMode"
      >
        {{ pickMode ? 'Tap the map to place your point…' : 'Add a point by tapping the map' }}
      </button>

      <p v-if="loading" class="status">Locating…</p>
      <p v-else-if="error" class="status err">{{ error }}</p>
    </header>

    <p class="hint">
      Search a city, use your location to look around, or tap the map to drop a point, then pick
      what to mark there. Foods are matched to your region (by biogeographic realm) and the
      current season — a starting point for what to look for, not a guarantee it grows at your
      exact spot.
    </p>
  </aside>

  <!-- Opens right after a point is created (tap or city search), with the map
       already centered on it behind this — replaces the old pan-then-scroll
       flow. There's no saved-points list to come back to afterwards. -->
  <div v-if="activePoint" class="food-dialog-backdrop" @click.self="closeDialog">
    <div class="food-dialog" role="dialog" aria-label="Pick foods to save here">
      <div class="row">
        <div class="point-title">
          <strong>{{ activePoint.label }}</strong>
          <span class="point-meta">
            {{ SEASON_LABEL[seasonFor(activePoint)] }}, {{ hemisphere(activePoint.lat) }} Hemisphere ·
            {{ REALM_LABEL[realmFor(activePoint)] }}
          </span>
        </div>
        <button class="close" aria-label="Done" @click="closeDialog"><Icon name="close" /></button>
      </div>

      <div v-if="recentItems.length" class="recent">
        <span class="recent-label">Last used</span>
        <div class="recent-row">
          <span v-for="item in recentItems" :key="item.id" class="recent-chip">
            <button
              type="button"
              class="recent-pick"
              :class="{ picked: activePoint.visibleFoodIds.includes(item.id) }"
              :title="`Show ${item.name} on the map here`"
              @click="toggleFood(activePoint.id, item.id)"
            >
              <img :src="badgeImagePath(item.id)" :alt="item.name" @error="onChipThumbError" />
              {{ item.name }}
            </button>
            <button
              type="button"
              class="recent-x"
              aria-label="Remove from last used"
              @click="removeRecent(item.id)"
            >
              <Icon name="close" />
            </button>
          </span>
        </div>
      </div>

      <input
        v-model="foodQuery"
        class="food-search"
        type="text"
        placeholder="Search foods…"
        aria-label="Search foods to pick"
      />
      <FilterChips :active="category" @change="category = $event" />

      <ul class="results">
        <li v-if="dialogResults.length === 0" class="empty">
          Nothing matches{{ category !== 'all' || foodQuery ? ' this search' : ' in season here' }} right now.
        </li>
        <li
          v-for="item in visibleResults"
          :key="item.id"
          class="result"
          :class="{ active: item.id === selectedId }"
        >
          <label
            class="toggle"
            :title="activePoint.visibleFoodIds.includes(item.id) ? 'Hide from map' : 'Show on map'"
          >
            <input
              type="checkbox"
              :checked="activePoint.visibleFoodIds.includes(item.id)"
              @change="toggleFood(activePoint.id, item.id)"
            />
          </label>
          <span class="result-body" @click="emit('select', item)">
            <span class="thumb" :style="{ borderColor: categoryColor(item.category) }">
              <img :src="badgeImagePath(item.id)" :alt="item.name" @error="onThumbError" />
              <span
                class="thumb-fallback"
                :style="{ background: categoryColor(item.category), display: 'none' }"
              >
                {{ item.name.charAt(0).toUpperCase() }}
              </span>
            </span>
            <span class="meta">
              <span class="name">{{ item.name }}</span>
              <span class="region">{{ item.origin.region }}</span>
            </span>
            <span class="cat" :style="{ color: categoryColor(item.category) }">
              {{ CATEGORY_LABEL[item.category] }}
            </span>
          </span>
        </li>
      </ul>
      <p v-if="hiddenResultCount > 0" class="more-hint">
        {{ hiddenResultCount }} more match{{ hiddenResultCount === 1 ? '' : 'es' }} — search to narrow it down.
      </p>

      <button type="button" class="done" @click="closeDialog">Done</button>
    </div>
  </div>
</template>

<style scoped>
.forage-view {
  width: 360px; min-height: 0;
  background: var(--surface); color: var(--text); box-shadow: 2px 0 12px var(--shadow);
  display: flex; flex-direction: column;
}
.forage-head { padding: 14px 16px 10px; border-bottom: 1px solid var(--border); }
.row { display: flex; align-items: center; justify-content: space-between; }
.row h2 { margin: 0; font-size: 18px; }
.close {
  border: none; background: var(--surface-2); color: var(--text); border-radius: 50%;
  width: 30px; height: 30px; font-size: 15px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.lede { margin: 6px 0 10px; font-size: 13px; color: var(--text-muted); }
.loc-form { display: flex; gap: 8px; }
.loc-input {
  flex: 1; min-width: 0; padding: 10px 12px; font-size: 14px;
  border: 1px solid var(--border-strong); border-radius: 8px;
  background: var(--surface); color: var(--text);
}
.go, .use-loc, .pick-toggle {
  border: 1px solid var(--border-strong); background: var(--surface); color: var(--text);
  border-radius: 8px; padding: 8px 14px; font-size: 13px; cursor: pointer;
}
.go { flex: none; }
.use-loc, .pick-toggle { margin-top: 8px; width: 100%; }
.pick-toggle.active { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
.go:disabled, .use-loc:disabled { opacity: 0.5; cursor: default; }
.status { margin: 10px 0 2px; font-size: 13px; line-height: 1.4; }
.status.err { color: var(--warn-text); }
.hint { padding: 16px; color: var(--text-faint); font-size: 13px; line-height: 1.5; }

.point-title { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.point-title strong {
  font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.point-meta { font-size: 11px; color: var(--text-faint); }

.recent { padding: 8px 16px; border-bottom: 1px solid var(--border); }
.recent-label {
  display: block; margin-bottom: 6px; font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-faint);
}
.recent-row { display: flex; flex-wrap: wrap; gap: 6px; }
.recent-chip {
  display: flex; align-items: stretch; border: 1px solid var(--border-strong);
  border-radius: 14px; overflow: hidden;
}
.recent-pick {
  display: flex; align-items: center; gap: 6px; border: none; background: var(--surface);
  color: var(--text); padding: 4px 10px 4px 4px; font-size: 12px; cursor: pointer;
}
.recent-pick.picked { background: var(--accent); color: var(--on-accent); }
.recent-pick img { width: 20px; height: 20px; border-radius: 50%; object-fit: cover; }
.recent-x {
  flex: none; border: none; border-left: 1px solid var(--border-strong); background: var(--surface-2);
  color: var(--text-faint); width: 22px; font-size: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.recent-x:hover { color: var(--warn-text); }

.results { list-style: none; margin: 0; padding: 4px 0; }
.empty { padding: 16px; color: var(--text-faint); text-align: center; font-size: 13px; }
.result {
  display: flex; align-items: center; gap: 8px; padding: 6px 16px 6px 12px;
  border-left: 3px solid transparent;
}
.result:hover { background: var(--surface-hover); }
.result.active { background: var(--surface-2); border-left-color: var(--accent); }
.toggle { flex: none; display: flex; align-items: center; }
.toggle input { cursor: pointer; width: 16px; height: 16px; }
.result-body { flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; cursor: pointer; }
.thumb {
  flex: none; width: 36px; height: 36px; border-radius: 50%; border: 2px solid;
  overflow: hidden; background: var(--surface);
}
.thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.thumb-fallback {
  width: 100%; height: 100%; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 15px;
}
.meta { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.name { font-weight: 600; font-size: 14px; }
.region {
  font-size: 12px; color: var(--text-faint);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cat { flex: none; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; }

.picking-banner { display: none; }

/* The food-picker dialog: a modal over the map (and the forage panel behind
   it), so the freshly centered point stays visible while picking. */
.food-dialog-backdrop {
  position: fixed; inset: 0; z-index: 800;
  background: rgba(0, 0, 0, 0.4);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.food-dialog {
  width: 360px; max-width: 100%; max-height: 80vh;
  background: var(--surface); color: var(--text); border-radius: 16px;
  box-shadow: 0 8px 24px var(--shadow-strong);
  display: flex; flex-direction: column; overflow: hidden;
}
.food-dialog .row { padding: 14px 16px 10px; border-bottom: 1px solid var(--border); align-items: flex-start; }
.food-dialog .results { overflow-y: auto; flex: 1; }
.food-search {
  margin: 10px 16px 0; padding: 10px 12px; font-size: 14px;
  border: 1px solid var(--border-strong); border-radius: 8px;
  background: var(--surface); color: var(--text);
}
.food-dialog :deep(.chips-row) { margin: 10px 16px 0; }
.more-hint { padding: 6px 16px 0; font-size: 12px; color: var(--text-faint); }
.done {
  flex: none; margin: 10px 16px 16px; padding: 10px; border: none; border-radius: 8px;
  background: var(--accent); color: var(--on-accent); font-size: 14px; font-weight: 600; cursor: pointer;
}

@media (max-width: 640px) {
  /* A floating dropdown over the map, same treatment as SearchView — see the
     comment there. */
  .forage-view {
    position: fixed; top: 64px; left: 12px; right: 12px; width: auto;
    max-height: 70vh; border-radius: 16px; overflow: hidden;
    box-shadow: 0 8px 24px var(--shadow-strong); z-index: 500;
  }
  /* Armed to place a point: get out of the way entirely so the whole map is
     tappable, not just the sliver around this card. */
  .forage-view.picking { display: none; }
  .picking-banner {
    display: flex; align-items: center; gap: 8px;
    position: fixed; top: 64px; left: 50%; transform: translateX(-50%); z-index: 700;
    background: var(--accent); color: var(--on-accent); border-radius: 20px;
    padding: 8px 8px 8px 16px; font-size: 13px; white-space: nowrap;
    box-shadow: 0 4px 16px var(--shadow-strong);
  }
  .picking-banner button {
    flex: none; border: none; background: rgba(255, 255, 255, 0.25); color: inherit;
    border-radius: 50%; width: 22px; height: 22px; font-size: 11px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }
  .food-dialog-backdrop { align-items: flex-start; padding-top: 64px; }
}
</style>
