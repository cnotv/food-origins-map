<script setup lang="ts">
import { computed } from 'vue'
import type { ProduceItem } from '../data/types'
import { heroImagePath } from '../data/validators'
import NutritionTable from './NutritionTable.vue'
import attributions from '../../public/images/attributions.json'

const props = defineProps<{ item: ProduceItem | null }>()
defineEmits<{ close: [] }>()

const CATEGORY_LABEL: Record<string, string> = {
  fruit: 'Fruit',
  vegetable: 'Vegetable',
  legume: 'Legume',
  'herb-spice': 'Herb / Spice',
}
const attribution = computed(() =>
  props.item
    ? (attributions as Record<string, { artist: string; license: string }>)[props.item.id]
    : undefined,
)
const onHeroError = (e: Event) => ((e.target as HTMLElement).style.visibility = 'hidden')
</script>
<template>
  <aside v-if="item" class="side-panel">
    <button class="close" aria-label="Close" @click="$emit('close')">✕</button>
    <img class="hero" :src="heroImagePath(item.id)" :alt="item.name" @error="onHeroError" />
    <div class="body">
      <span class="tag">{{ CATEGORY_LABEL[item.category] }}</span>
      <h2>{{ item.name }}</h2>
      <p class="region">📍 {{ item.origin.region }}</p>
      <p class="story">{{ item.story }}</p>
      <NutritionTable :nutrition="item.nutrition" />
      <a class="recipes-link" :href="item.tasteAtlasUrl" target="_blank" rel="noopener">
        Recipes on TasteAtlas ↗
      </a>
      <p v-if="attribution" class="attribution">
        Image: {{ attribution.artist }} — {{ attribution.license }} (Wikimedia Commons)
      </p>
    </div>
  </aside>
</template>
<style scoped>
.side-panel {
  position: absolute; top: 0; right: 0; bottom: 0; width: min(380px, 100%);
  background: #fff; box-shadow: -2px 0 12px rgba(0, 0, 0, 0.15);
  overflow-y: auto; z-index: 1000;
}
.close {
  position: absolute; top: 10px; right: 10px; border: none;
  background: rgba(255, 255, 255, 0.85); border-radius: 50%;
  width: 32px; height: 32px; font-size: 16px; cursor: pointer;
}
.hero { width: 100%; height: 200px; object-fit: cover; display: block; }
.body { padding: 16px 20px 32px; }
.tag {
  display: inline-block; background: #eee; border-radius: 12px; padding: 2px 10px;
  font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #555;
}
h2 { margin: 8px 0 4px; }
.region { color: #666; margin: 0 0 12px; }
.story { line-height: 1.5; }
.recipes-link {
  display: inline-block; margin-top: 12px; background: #e4572e; color: #fff;
  text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 600;
}
.attribution { margin-top: 16px; font-size: 11px; color: #999; }
@media (max-width: 640px) {
  .side-panel { top: auto; width: 100%; height: 70%; border-radius: 16px 16px 0 0; }
}
</style>
