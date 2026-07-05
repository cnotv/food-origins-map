<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ProduceItem } from '../data/types'
import { heroImagePath } from '../data/validators'
import { getFieldGuide } from '../data/guide'
import NutritionTable from './NutritionTable.vue'
import MiniMap from './MiniMap.vue'
import attributions from '../../public/images/attributions.json'

const props = defineProps<{ item: ProduceItem | null }>()
defineEmits<{ close: [] }>()

const CATEGORY_LABEL: Record<string, string> = {
  fruit: 'Fruit',
  vegetable: 'Vegetable',
  legume: 'Legume',
  'herb-spice': 'Herb / Spice',
}
const SOURCE_LABEL = {
  farmed: 'Farmed',
  wild: 'Wild — foraged',
  both: 'Farmed & foraged wild',
} as const
const RAW_LABEL = {
  yes: 'Yes',
  no: 'No — must be cooked or processed',
  caution: 'With caution',
} as const

const tabs = ['About', 'Field guide', 'Recipes', 'Varieties'] as const
type Tab = (typeof tabs)[number]
const activeTab = ref<Tab>('About')
// Reset to the first tab whenever a different item is opened.
watch(
  () => props.item?.id,
  () => (activeTab.value = 'About'),
)

const guide = computed(() => (props.item ? getFieldGuide(props.item.id) : undefined))
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
      <p v-if="guide?.localName" class="local-name">{{ guide.localName }}</p>
      <p class="region">📍 {{ item.origin.region }}</p>

      <nav class="tabs" role="tablist">
        <button
          v-for="t in tabs"
          :key="t"
          class="tab"
          :class="{ active: activeTab === t }"
          role="tab"
          :aria-selected="activeTab === t"
          @click="activeTab = t"
        >
          {{ t }}
        </button>
      </nav>

      <!-- About -->
      <section v-show="activeTab === 'About'" class="tab-panel">
        <MiniMap :item="item" />
        <p class="story">{{ item.story }}</p>
        <NutritionTable :nutrition="item.nutrition" />
        <a class="recipes-link" :href="item.tasteAtlasUrl" target="_blank" rel="noopener">
          More on TasteAtlas ↗
        </a>
        <p v-if="attribution" class="attribution">
          Image: {{ attribution.artist }} — {{ attribution.license }} (Wikimedia Commons)
        </p>
      </section>

      <!-- Field guide -->
      <section v-show="activeTab === 'Field guide'" class="tab-panel">
        <template v-if="guide && guide.harvestSeason">
          <dl class="facts">
            <dt>Harvest time</dt>
            <dd>{{ guide.harvestSeason }}</dd>
            <dt>Source</dt>
            <dd>{{ SOURCE_LABEL[guide.source] }}</dd>
            <dt>Eaten raw</dt>
            <dd :class="{ warn: guide.raw !== 'yes' }">{{ RAW_LABEL[guide.raw] }}</dd>
            <dt>Side effects</dt>
            <dd>{{ guide.sideEffects }}</dd>
          </dl>
          <div v-if="guide.wild" class="wild">
            <h3>Foraging in the wild</h3>
            <p><strong>Where:</strong> {{ guide.wild.where }}</p>
            <p><strong>How to spot it:</strong> {{ guide.wild.identification }}</p>
            <p class="forage-warning">
              ⚠️ These notes are a starting point, not a positive ID. Never eat a wild plant unless
              you are certain of it.
            </p>
          </div>
          <p v-else class="muted">Not commonly foraged in the wild.</p>
        </template>
        <p v-else class="muted">Field guide not yet documented for this item.</p>
      </section>

      <!-- Recipes -->
      <section v-show="activeTab === 'Recipes'" class="tab-panel">
        <ul v-if="guide && guide.recipes?.length" class="list">
          <li v-for="r in guide.recipes" :key="r">{{ r }}</li>
        </ul>
        <p v-else class="muted">Recipes not yet documented for this item.</p>
      </section>

      <!-- Varieties -->
      <section v-show="activeTab === 'Varieties'" class="tab-panel">
        <ul v-if="guide && guide.varieties?.length" class="list">
          <li v-for="v in guide.varieties" :key="v">{{ v }}</li>
        </ul>
        <p v-else class="muted">Varieties not yet documented for this item.</p>
      </section>
    </div>
  </aside>
</template>
<style scoped>
.side-panel {
  position: relative; width: 380px; min-height: 0;
  background: #fff; box-shadow: -2px 0 12px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
}
.close {
  position: absolute; top: 10px; right: 10px; border: none;
  background: rgba(255, 255, 255, 0.85); border-radius: 50%;
  width: 32px; height: 32px; font-size: 16px; cursor: pointer; z-index: 5;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
}
.hero { width: 100%; height: 200px; object-fit: cover; display: block; }
.body { padding: 16px 20px 32px; }
.tag {
  display: inline-block; background: #eee; border-radius: 12px; padding: 2px 10px;
  font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #555;
}
h2 { margin: 8px 0 2px; }
.local-name { margin: 0 0 4px; color: #555; font-style: italic; font-size: 14px; }
.region { color: #666; margin: 0 0 12px; }

.tabs {
  display: flex; gap: 4px; border-bottom: 1px solid #eee; margin-bottom: 16px;
  overflow-x: auto; scrollbar-width: none;
}
.tabs::-webkit-scrollbar { display: none; }
.tab {
  border: none; background: none; padding: 8px 10px; font-size: 13px; cursor: pointer;
  color: #777; border-bottom: 2px solid transparent; white-space: nowrap;
}
.tab.active { color: #111; border-bottom-color: #333; font-weight: 600; }

.story { line-height: 1.5; margin-top: 0; }
.facts { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; margin: 0 0 4px; }
.facts dt { color: #888; font-size: 13px; }
.facts dd { margin: 0; font-size: 14px; }
.facts dd.warn { color: #b23b1e; font-weight: 600; }
.wild { margin-top: 16px; border-top: 1px solid #eee; padding-top: 12px; }
.wild h3 { margin: 0 0 8px; font-size: 15px; }
.wild p { line-height: 1.45; margin: 0 0 8px; font-size: 14px; }
.forage-warning {
  background: #fff6f2; border: 1px solid #f3d2c5; border-radius: 8px;
  padding: 8px 10px; color: #8a3b22; font-size: 12.5px;
}
.list { margin: 0; padding-left: 18px; line-height: 1.6; }
.muted { color: #999; font-style: italic; }
.recipes-link {
  display: inline-block; margin-top: 12px; background: #e4572e; color: #fff;
  text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 600;
}
.attribution { margin-top: 16px; font-size: 11px; color: #999; }
@media (max-width: 640px) {
  /* Full-page detail: cover the map/search entirely, with a fixed, always-
     visible close button that stays put while the content scrolls. */
  .side-panel {
    position: fixed; inset: 0; width: 100%; height: 100%; max-height: none;
    z-index: 2000; box-shadow: none;
  }
  .close { position: fixed; top: 12px; right: 12px; width: 40px; height: 40px; font-size: 18px; }
}
</style>
