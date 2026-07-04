<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ProduceItem, Category } from '../data/types'
import { badgeImagePath } from '../data/validators'
import FilterChips from './FilterChips.vue'

const props = defineProps<{ items: ProduceItem[]; selectedId: string | null }>()
const emit = defineEmits<{ select: [item: ProduceItem]; close: [] }>()

const query = ref('')
const category = ref<Category | 'all'>('all')

const COLORS: Record<Category, string> = {
  fruit: '#e4572e',
  vegetable: '#3a7d44',
  legume: '#c9a227',
  'herb-spice': '#7b4fb5',
}
const CATEGORY_LABEL: Record<Category, string> = {
  fruit: 'Fruit',
  vegetable: 'Vegetable',
  legume: 'Legume',
  'herb-spice': 'Herb / Spice',
}

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  return props.items
    .filter((it) => category.value === 'all' || it.category === category.value)
    .filter(
      (it) =>
        !q ||
        it.name.toLowerCase().includes(q) ||
        it.origin.region.toLowerCase().includes(q),
    )
    .sort((a, b) => a.name.localeCompare(b.name))
})

const onThumbError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
  const fallback = img.nextElementSibling as HTMLElement | null
  if (fallback) fallback.style.display = 'flex'
}
</script>

<template>
  <aside class="search-view" role="dialog" aria-label="Search foods">
    <header class="search-head">
      <div class="row">
        <h2>Search foods</h2>
        <button class="close" aria-label="Close search" @click="emit('close')">✕</button>
      </div>
      <input
        v-model="query"
        class="search-input"
        type="search"
        placeholder="Search by name or region…"
        aria-label="Search by name or region"
        autofocus
      />
      <FilterChips :active="category" @change="category = $event" />
      <p class="count">{{ results.length }} {{ results.length === 1 ? 'food' : 'foods' }}</p>
    </header>

    <ul class="results">
      <li v-if="results.length === 0" class="empty">No foods match your search.</li>
      <li
        v-for="item in results"
        :key="item.id"
        class="result"
        :class="{ active: item.id === selectedId }"
        @click="emit('select', item)"
      >
        <span class="thumb" :style="{ borderColor: COLORS[item.category] }">
          <img
            :src="badgeImagePath(item.id)"
            :alt="item.name"
            @error="onThumbError"
          />
          <span class="thumb-fallback" :style="{ background: COLORS[item.category], display: 'none' }">
            {{ item.name.charAt(0).toUpperCase() }}
          </span>
        </span>
        <span class="meta">
          <span class="name">{{ item.name }}</span>
          <span class="region">{{ item.origin.region }}</span>
        </span>
        <span class="cat" :style="{ color: COLORS[item.category] }">
          {{ CATEGORY_LABEL[item.category] }}
        </span>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.search-view {
  position: absolute; top: 0; left: 0; bottom: 0; width: min(360px, 100%);
  background: #fff; box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
  display: flex; flex-direction: column; z-index: 1000;
}
.search-head { padding: 14px 16px 8px; border-bottom: 1px solid #eee; }
.row { display: flex; align-items: center; justify-content: space-between; }
.row h2 { margin: 0; font-size: 18px; }
.close {
  border: none; background: #f2f2f2; border-radius: 50%;
  width: 30px; height: 30px; font-size: 15px; cursor: pointer;
}
.search-input {
  width: 100%; margin: 12px 0; padding: 10px 12px; font-size: 14px;
  border: 1px solid #ccc; border-radius: 8px;
}
.count { margin: 8px 0 4px; font-size: 12px; color: #888; }
.results { list-style: none; margin: 0; padding: 4px 0; overflow-y: auto; flex: 1; }
.empty { padding: 24px 16px; color: #888; text-align: center; }
.result {
  display: flex; align-items: center; gap: 12px; padding: 8px 16px;
  cursor: pointer; border-left: 3px solid transparent;
}
.result:hover { background: #f7f7f7; }
.result.active { background: #f0f0f0; border-left-color: #333; }
.thumb {
  flex: none; width: 36px; height: 36px; border-radius: 50%; border: 2px solid;
  overflow: hidden; background: #fff;
}
.thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.thumb-fallback {
  width: 100%; height: 100%; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 15px;
}
.meta { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.name { font-weight: 600; font-size: 14px; }
.region {
  font-size: 12px; color: #888;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cat { flex: none; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; }
@media (max-width: 640px) {
  .search-view { width: 100%; }
}
</style>
