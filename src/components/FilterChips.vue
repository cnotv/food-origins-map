<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
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

const scroller = ref<HTMLDivElement | null>(null)
const canLeft = ref(false)
const canRight = ref(false)

function updateArrows() {
  const el = scroller.value
  if (!el) return
  canLeft.value = el.scrollLeft > 1
  canRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

function scrollChips(dir: -1 | 1) {
  scroller.value?.scrollBy({ left: dir * 160, behavior: 'smooth' })
}

// Let a vertical mouse wheel scroll the chip row sideways, since the row
// has no visible scrollbar to grab.
function onWheel(e: WheelEvent) {
  const el = scroller.value
  if (!el || el.scrollWidth <= el.clientWidth) return
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    el.scrollLeft += e.deltaY
    e.preventDefault()
  }
}

let observer: ResizeObserver | null = null
onMounted(() => {
  updateArrows()
  if (scroller.value) {
    observer = new ResizeObserver(updateArrows)
    observer.observe(scroller.value)
  }
})
onBeforeUnmount(() => observer?.disconnect())
</script>
<template>
  <div class="chips-row">
    <button
      v-show="canLeft"
      class="chip-arrow"
      aria-label="Scroll filters left"
      @click="scrollChips(-1)"
    >
      ‹
    </button>
    <div ref="scroller" class="chips" @scroll.passive="updateArrows" @wheel="onWheel">
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
    <button
      v-show="canRight"
      class="chip-arrow"
      aria-label="Scroll filters right"
      @click="scrollChips(1)"
    >
      ›
    </button>
  </div>
</template>
<style scoped>
.chips-row { display: flex; align-items: center; gap: 4px; min-width: 0; }
.chips { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
.chips::-webkit-scrollbar { display: none; }
.chip {
  border: 1px solid #ccc; background: #fff; border-radius: 16px;
  padding: 6px 14px; font-size: 13px; cursor: pointer; white-space: nowrap;
}
.chip.active { background: #333; color: #fff; border-color: #333; }
.chip-arrow {
  flex: none; width: 26px; height: 26px; border-radius: 50%;
  border: 1px solid #ccc; background: #fff; cursor: pointer;
  font-size: 16px; line-height: 1; padding: 0;
  display: flex; align-items: center; justify-content: center;
}
.chip-arrow:hover { background: #f2f2f2; }
</style>
