<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { isFirebaseConfigured } from '../lib/firebase'
import { useGoogleAuth } from '../composables/useGoogleAuth'
import { addLocalMap, listLocalMaps, removeLocalMap, type SavedMap } from '../composables/savedMaps'
import { addCloudMap, listCloudMaps, removeCloudMap } from '../composables/cloudMaps'

// The query string that captures "what's currently on screen" (filter,
// selection, detail tab — see App.vue's buildQueryString). Saving just
// stores this string under a name; loading re-applies it like a bookmark.
const props = defineProps<{ currentQuery: string }>()
const emit = defineEmits<{ load: [query: string]; close: [] }>()

const { user, busy: authBusy, error: authError, signIn, signOut } = useGoogleAuth()

const name = ref('')
const saveBusy = ref(false)
const saveError = ref('')

const localMaps = ref<SavedMap[]>(listLocalMaps())
const cloudMaps = ref<SavedMap[]>([])
const cloudLoading = ref(false)
const cloudError = ref('')

const maps = computed(() => (user.value ? cloudMaps.value : localMaps.value))
const usingCloud = computed(() => user.value !== null)

watch(
  user,
  async (u) => {
    cloudError.value = ''
    if (!u) {
      cloudMaps.value = []
      return
    }
    cloudLoading.value = true
    try {
      cloudMaps.value = await listCloudMaps(u.uid)
    } catch {
      cloudError.value = 'Could not load your saved maps.'
    } finally {
      cloudLoading.value = false
    }
  },
  { immediate: true },
)

async function save() {
  const trimmed = name.value.trim()
  if (!trimmed) return
  saveError.value = ''
  saveBusy.value = true
  try {
    if (user.value) {
      const map = await addCloudMap(user.value.uid, trimmed, props.currentQuery)
      cloudMaps.value = [map, ...cloudMaps.value]
    } else {
      const map = addLocalMap(trimmed, props.currentQuery)
      localMaps.value = [map, ...localMaps.value]
    }
    name.value = ''
  } catch {
    saveError.value = 'Could not save. Please try again.'
  } finally {
    saveBusy.value = false
  }
}

async function remove(map: SavedMap) {
  if (user.value) {
    cloudMaps.value = cloudMaps.value.filter((m) => m.id !== map.id)
    try {
      await removeCloudMap(user.value.uid, map.id)
    } catch {
      cloudError.value = 'Could not delete that map. Please try again.'
      cloudMaps.value = await listCloudMaps(user.value.uid).catch(() => cloudMaps.value)
    }
  } else {
    removeLocalMap(map.id)
    localMaps.value = localMaps.value.filter((m) => m.id !== map.id)
  }
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
function formatDate(ts: number) {
  return dateFormatter.format(new Date(ts))
}
</script>

<template>
  <aside class="maps-view" role="dialog" aria-label="Saved maps">
    <header class="maps-head">
      <div class="row">
        <h2>Saved maps</h2>
        <button class="close" aria-label="Close" @click="emit('close')">✕</button>
      </div>
      <p class="lede">Save the current filter, selection and tab, and come back to it later.</p>

      <form class="save-form" @submit.prevent="save">
        <input
          v-model="name"
          class="save-input"
          type="text"
          placeholder="Name this view…"
          aria-label="Map name"
          :disabled="saveBusy"
        />
        <button type="submit" class="save-btn" :disabled="saveBusy || !name.trim()">Save</button>
      </form>
      <p v-if="saveError" class="status err">{{ saveError }}</p>

      <div class="account">
        <template v-if="!isFirebaseConfigured">
          <p class="hint small">
            Saved maps are stored in this browser only. Cloud sync isn't configured for this
            deployment.
          </p>
        </template>
        <template v-else-if="user">
          <div class="who">
            <img v-if="user.photoURL" class="avatar" :src="user.photoURL" :alt="user.displayName ?? ''" />
            <span class="who-name">{{ user.displayName ?? user.email ?? 'Signed in' }}</span>
          </div>
          <button class="signout" @click="signOut">Sign out</button>
        </template>
        <template v-else>
          <button class="signin" :disabled="authBusy" @click="signIn">
            {{ authBusy ? 'Signing in…' : 'Sign in with Google to sync across devices' }}
          </button>
          <p v-if="authError" class="status err">{{ authError }}</p>
        </template>
      </div>
    </header>

    <p v-if="cloudLoading" class="status">Loading your saved maps…</p>
    <p v-else-if="cloudError" class="status err">{{ cloudError }}</p>
    <ul v-else class="maps">
      <li v-if="maps.length === 0" class="empty">
        No saved maps yet{{ usingCloud ? ' in your account' : '' }}. Save the current view above.
      </li>
      <li v-for="map in maps" :key="map.id" class="map-row">
        <button class="load" @click="emit('load', map.query)">
          <span class="name">{{ map.name }}</span>
          <span class="when">{{ formatDate(map.createdAt) }}</span>
        </button>
        <button class="delete" aria-label="Delete saved map" @click="remove(map)">✕</button>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.maps-view {
  width: 360px; min-height: 0;
  background: var(--surface); color: var(--text); box-shadow: 2px 0 12px var(--shadow);
  display: flex; flex-direction: column;
}
.maps-head { padding: 14px 16px 10px; border-bottom: 1px solid var(--border); }
.row { display: flex; align-items: center; justify-content: space-between; }
.row h2 { margin: 0; font-size: 18px; }
.close {
  border: none; background: var(--surface-2); color: var(--text); border-radius: 50%;
  width: 30px; height: 30px; font-size: 15px; cursor: pointer;
}
.lede { margin: 6px 0 10px; font-size: 13px; color: var(--text-muted); }
.save-form { display: flex; gap: 8px; }
.save-input {
  flex: 1; min-width: 0; padding: 10px 12px; font-size: 14px;
  border: 1px solid var(--border-strong); border-radius: 8px;
  background: var(--surface); color: var(--text);
}
.save-btn {
  border: 1px solid var(--border-strong); background: var(--surface); color: var(--text);
  border-radius: 8px; padding: 8px 14px; font-size: 13px; cursor: pointer; flex: none;
}
.save-btn:disabled { opacity: 0.5; cursor: default; }
.status { margin: 10px 0 2px; font-size: 13px; line-height: 1.4; }
.status.err { color: var(--warn-text); }
.account { margin-top: 12px; }
.hint.small { margin: 0; font-size: 12px; color: var(--text-faint); line-height: 1.4; }
.signin {
  width: 100%; border: 1px solid var(--border-strong); background: var(--surface); color: var(--text);
  border-radius: 8px; padding: 8px 14px; font-size: 13px; cursor: pointer;
}
.signin:disabled { opacity: 0.5; cursor: default; }
.who { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.avatar { width: 24px; height: 24px; border-radius: 50%; }
.who-name { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.signout {
  border: 1px solid var(--border-strong); background: var(--surface); color: var(--text);
  border-radius: 8px; padding: 6px 12px; font-size: 12px; cursor: pointer;
}
.maps { list-style: none; margin: 0; padding: 4px 0; overflow-y: auto; flex: 1; }
.empty { padding: 24px 16px; color: var(--text-faint); text-align: center; font-size: 13px; }
.map-row { display: flex; align-items: stretch; border-left: 3px solid transparent; }
.map-row:hover { background: var(--surface-hover); }
.load {
  flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: flex-start;
  gap: 2px; text-align: left; border: none; background: none; color: var(--text);
  padding: 8px 8px 8px 16px; cursor: pointer; font: inherit;
}
.load .name { font-weight: 600; font-size: 14px; }
.load .when { font-size: 11px; color: var(--text-faint); }
.delete {
  flex: none; border: none; background: none; color: var(--text-faint);
  width: 40px; cursor: pointer; font-size: 13px;
}
.delete:hover { color: var(--warn-text); }
@media (max-width: 640px) {
  .maps-view { width: 100%; }
}
</style>
