<script setup lang="ts">
import { computed } from 'vue'

export type Nutrient = 'calories' | 'carbs' | 'fiber' | 'protein'
export type Thresholds = Record<Nutrient, number>

const props = defineProps<{ modelValue: Thresholds; max: Thresholds }>()
const emit = defineEmits<{ 'update:modelValue': [Thresholds] }>()

// Per-100g cutoffs below which a max-threshold reads as filtering to "low" foods.
const LOW_CUTOFF: Thresholds = { calories: 40, carbs: 5, fiber: 2, protein: 2 }
const META: { key: Nutrient; label: string; unit: string }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fiber', label: 'Fiber', unit: 'g' },
  { key: 'protein', label: 'Protein', unit: 'g' },
]

const active = computed(() => META.some(({ key }) => props.modelValue[key] < props.max[key]))

function setValue(key: Nutrient, value: number) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
function reset() {
  emit('update:modelValue', { ...props.max })
}
// A low threshold means "show me low-X foods" — surface that as a tag.
const isLow = (key: Nutrient) =>
  props.modelValue[key] < props.max[key] && props.modelValue[key] <= LOW_CUTOFF[key]
</script>
<template>
  <details class="nutri-filter">
    <summary>
      Nutrition filter
      <span v-if="active" class="on-dot" aria-label="filter active"></span>
    </summary>
    <div class="rows">
      <div v-for="m in META" :key="m.key" class="row">
        <div class="row-head">
          <span class="name">{{ m.label }}</span>
          <span v-if="isLow(m.key)" class="low-tag">Low</span>
          <span class="val">≤ {{ modelValue[m.key] }} {{ m.unit }}</span>
        </div>
        <input
          type="range"
          min="0"
          :max="max[m.key]"
          step="1"
          :value="modelValue[m.key]"
          :aria-label="`Maximum ${m.label} per 100 g`"
          @input="setValue(m.key, Number(($event.target as HTMLInputElement).value))"
        />
      </div>
      <button class="reset" :disabled="!active" @click="reset">Reset</button>
    </div>
  </details>
</template>
<style scoped>
.nutri-filter { margin: 8px 0 4px; border: 1px solid var(--border); border-radius: 8px; }
summary {
  cursor: pointer; padding: 8px 12px; font-size: 13px; font-weight: 600; color: var(--text-muted);
  display: flex; align-items: center; gap: 8px; list-style: none;
}
summary::-webkit-details-marker { display: none; }
summary::before { content: '▸'; color: var(--text-faint); font-size: 11px; }
.nutri-filter[open] summary::before { content: '▾'; }
.on-dot { width: 8px; height: 8px; border-radius: 50%; background: #3a7d44; }
.rows { padding: 4px 12px 12px; }
.row { margin-bottom: 10px; }
.row-head { display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 2px; }
.name { color: var(--text-muted); }
.val { margin-left: auto; color: var(--text-faint); }
.low-tag {
  background: var(--low-bg); color: var(--low-text); border-radius: 8px; padding: 0 6px;
  font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em;
}
input[type='range'] { width: 100%; accent-color: #3a7d44; }
.reset {
  border: 1px solid var(--border-strong); background: var(--surface); color: var(--text);
  border-radius: 8px; padding: 4px 12px; font-size: 12px; cursor: pointer;
}
.reset:disabled { opacity: 0.4; cursor: default; }
</style>
