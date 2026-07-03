<script setup lang="ts">
import type { Category } from '../data/types'
import { CATEGORIES } from '../data/types'

defineProps<{ active: Category | 'all' }>()
defineEmits<{ change: [value: Category | 'all'] }>()

const LABELS: Record<Category | 'all', string> = {
  all: 'All',
  fruit: 'Fruits',
  vegetable: 'Vegetables',
  legume: 'Legumes',
  'herb-spice': 'Herbs & spices',
}
const options: (Category | 'all')[] = ['all', ...CATEGORIES]
</script>
<template>
  <div class="chips">
    <button
      v-for="opt in options"
      :key="opt"
      class="chip"
      :class="{ active: active === opt }"
      @click="$emit('change', opt)"
    >
      {{ LABELS[opt] }}
    </button>
  </div>
</template>
<style scoped>
.chips { display: flex; gap: 8px; overflow-x: auto; }
.chip {
  border: 1px solid #ccc; background: #fff; border-radius: 16px;
  padding: 6px 14px; font-size: 13px; cursor: pointer; white-space: nowrap;
}
.chip.active { background: #333; color: #fff; border-color: #333; }
</style>
