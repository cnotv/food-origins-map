<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ProduceItem } from '../data/types'
import { badgeImagePath } from '../data/validators'
import { categoryColor } from './WorldMap.vue'
import {
  foragableNow,
  currentSeasonForLat,
  hemisphere,
  classifyRealm,
  REALM_LABEL,
  type Season,
} from '../data/season'

const props = defineProps<{ items: ProduceItem[]; selectedId: string | null }>()
const emit = defineEmits<{ select: [item: ProduceItem]; close: [] }>()

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
const loading = ref(false)
const error = ref('')
// The resolved place, or null until the user picks a location.
const place = ref<{ name: string; lat: number; lng: number } | null>(null)

const season = computed(() => (place.value ? currentSeasonForLat(place.value.lat) : null))
const realm = computed(() =>
  place.value ? classifyRealm(place.value.lat, place.value.lng) : null,
)
const results = computed(() =>
  place.value ? foragableNow(props.items, place.value.lat, place.value.lng) : [],
)

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
      place.value = null
      return
    }
    place.value = {
      name: [hit.name, hit.country].filter(Boolean).join(', '),
      lat: hit.latitude,
      lng: hit.longitude,
    }
  } catch {
    error.value = 'Location lookup failed — check your connection (or an ad/privacy blocker) and try again.'
  } finally {
    loading.value = false
  }
}

function useMyLocation() {
  if (!navigator.geolocation) {
    error.value = 'Your browser does not support location access.'
    return
  }
  loading.value = true
  error.value = ''
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords
      let name = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
      try {
        const d = await fetchJson(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
        )
        const label = d.city || d.locality || d.principalSubdivision
        if (label) name = [label, d.countryName].filter(Boolean).join(', ')
      } catch {
        // keep the coordinate label
      }
      place.value = { name, lat: latitude, lng: longitude }
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
</script>

<template>
  <aside class="forage-view" role="dialog" aria-label="Forage near a location">
    <header class="forage-head">
      <div class="row">
        <h2>Forage now</h2>
        <button class="close" aria-label="Close" @click="emit('close')">✕</button>
      </div>
      <p class="lede">Find wild foods in season near a place, right now.</p>
      <form class="loc-form" @submit.prevent="geocodeCity">
        <input
          v-model="query"
          class="loc-input"
          type="text"
          placeholder="Enter a city…"
          aria-label="City name"
        />
        <button type="submit" class="go" :disabled="loading">Go</button>
      </form>
      <button class="use-loc" :disabled="loading" @click="useMyLocation">
        Use my location
      </button>

      <p v-if="loading" class="status">Locating…</p>
      <p v-else-if="error" class="status err">{{ error }}</p>
      <p v-else-if="place && season && realm" class="status ok">
        <strong>{{ place.name }}</strong> — {{ SEASON_LABEL[season] }},
        {{ hemisphere(place.lat) }} Hemisphere.
        <span class="region-note">Region: {{ REALM_LABEL[realm] }}.</span>
        <span class="count">{{ results.length }} wild {{ results.length === 1 ? 'food' : 'foods' }} in season</span>
      </p>
    </header>

    <ul v-if="place" class="results">
      <li v-if="results.length === 0" class="empty">
        No documented wild foods are in season here right now.
      </li>
      <li
        v-for="item in results"
        :key="item.id"
        class="result"
        :class="{ active: item.id === selectedId }"
        @click="emit('select', item)"
      >
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
      </li>
    </ul>
    <p v-else class="hint">
      Foods are matched to your region (by biogeographic realm) and the current season — a starting
      point for what to look for, not a guarantee it grows at your exact spot.
    </p>
  </aside>
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
}
.lede { margin: 6px 0 10px; font-size: 13px; color: var(--text-muted); }
.loc-form { display: flex; gap: 8px; }
.loc-input {
  flex: 1; min-width: 0; padding: 10px 12px; font-size: 14px;
  border: 1px solid var(--border-strong); border-radius: 8px;
  background: var(--surface); color: var(--text);
}
.go, .use-loc {
  border: 1px solid var(--border-strong); background: var(--surface); color: var(--text);
  border-radius: 8px; padding: 8px 14px; font-size: 13px; cursor: pointer;
}
.go { flex: none; }
.use-loc { margin-top: 8px; width: 100%; }
.go:disabled, .use-loc:disabled { opacity: 0.5; cursor: default; }
.status { margin: 10px 0 2px; font-size: 13px; line-height: 1.4; }
.status.err { color: var(--warn-text); }
.status.ok { color: var(--text); }
.region-note { display: block; margin-top: 2px; color: var(--text-muted); }
.count { display: block; margin-top: 2px; color: var(--text-faint); }
.hint { padding: 16px; color: var(--text-faint); font-size: 13px; line-height: 1.5; }
.results { list-style: none; margin: 0; padding: 4px 0; overflow-y: auto; flex: 1; }
.empty { padding: 24px 16px; color: var(--text-faint); text-align: center; }
.result {
  display: flex; align-items: center; gap: 12px; padding: 8px 16px;
  cursor: pointer; border-left: 3px solid transparent;
}
.result:hover { background: var(--surface-hover); }
.result.active { background: var(--surface-2); border-left-color: var(--accent); }
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
@media (max-width: 640px) {
  .forage-view { width: 100%; }
}
</style>
