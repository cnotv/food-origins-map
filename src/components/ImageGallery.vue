<script setup lang="ts">
import { reactive, computed, ref, watch } from 'vue'
import type { ProduceItem } from '../data/types'
import { heroImagePath, partImagePath, type ImagePart } from '../data/validators'
import attributions from '../../public/images/attributions.json'

const props = defineProps<{ item: ProduceItem }>()

type Cand = { key: string; label: string; src: string; attrKey: string }
type Status = 'loading' | 'ok' | 'fail'

const PARTS: { key: ImagePart; label: string }[] = [
  { key: 'fruit', label: 'Fruit' },
  { key: 'leaves', label: 'Leaves' },
  { key: 'seed', label: 'Seed' },
  { key: 'tree', label: 'Plant' },
]

// Candidate images: the main photo plus each botanical part. Any that 404 are
// dropped, so the layout only ever reflects the images that actually exist.
const candidates = computed<Cand[]>(() => [
  { key: 'photo', label: 'Photo', src: heroImagePath(props.item.id), attrKey: props.item.id },
  ...PARTS.map((p) => ({
    key: p.key,
    label: p.label,
    src: partImagePath(props.item.id, p.key),
    attrKey: `${props.item.id}__${p.key}`,
  })),
])

const status = reactive<Record<string, Status>>({})
const slide = ref<number | null>(null) // index into `loaded`, or null for the grid

// Reset load tracking whenever the item changes.
watch(
  () => props.item.id,
  () => {
    for (const k of Object.keys(status)) delete status[k]
    slide.value = null
  },
  { immediate: true },
)

const loaded = computed(() => candidates.value.filter((c) => status[c.key] === 'ok'))
const attrOf = (key: string) =>
  (attributions as Record<string, { artist: string; license: string }>)[key]

function onLoad(key: string) {
  status[key] = 'ok'
}
function onError(key: string) {
  status[key] = 'fail'
}
function openSlide(cand: Cand) {
  slide.value = loaded.value.findIndex((c) => c.key === cand.key)
}
function step(delta: number) {
  if (slide.value === null) return
  const n = loaded.value.length
  slide.value = (slide.value + delta + n) % n
}
</script>
<template>
  <div class="gallery-wrap">
    <!-- Hidden loaders: every candidate is fetched so we can detect which exist. -->
    <img
      v-for="c in candidates"
      :key="'probe-' + c.key"
      :src="c.src"
      class="probe"
      alt=""
      @load="onLoad(c.key)"
      @error="onError(c.key)"
    />

    <!-- Grid of the images that loaded. Odd counts let the first span full width
         so no empty cell is ever left. -->
    <div
      class="gallery"
      :class="['count-' + loaded.length, { odd: loaded.length % 2 === 1 }]"
    >
      <button
        v-for="c in loaded"
        :key="c.key"
        class="cell"
        type="button"
        @click="openSlide(c)"
      >
        <img :src="c.src" :alt="`${item.name} — ${c.label}`" />
        <span class="cell-label">{{ c.label }}</span>
      </button>
    </div>

    <!-- Slideshow: view each image one by one. -->
    <div v-if="slide !== null && loaded[slide]" class="slideshow" @click.self="slide = null">
      <button class="slide-close" aria-label="Back to grid" @click="slide = null">✕</button>
      <button
        v-if="loaded.length > 1"
        class="nav prev"
        aria-label="Previous"
        @click="step(-1)"
      >
        ‹
      </button>
      <figure class="slide-fig">
        <img :src="loaded[slide].src" :alt="`${item.name} — ${loaded[slide].label}`" />
        <figcaption>
          <span class="slide-label">{{ loaded[slide].label }}</span>
          <span class="slide-pos">{{ slide + 1 }} / {{ loaded.length }}</span>
          <span v-if="attrOf(loaded[slide].attrKey)" class="slide-attr">
            {{ attrOf(loaded[slide].attrKey).artist }} — {{ attrOf(loaded[slide].attrKey).license }}
          </span>
        </figcaption>
      </figure>
      <button
        v-if="loaded.length > 1"
        class="nav next"
        aria-label="Next"
        @click="step(1)"
      >
        ›
      </button>
    </div>
  </div>
</template>
<style scoped>
.gallery-wrap { position: relative; }
.probe { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }

.gallery { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
.gallery.count-0 { display: none; }
.gallery.count-1 { grid-template-columns: 1fr; }
/* Odd number of images: first one spans the full width, rest pair up below. */
.gallery.odd:not(.count-1) .cell:first-child { grid-column: 1 / -1; }

.cell {
  position: relative; padding: 0; border: none; cursor: pointer; overflow: hidden;
  background: var(--surface-2); display: block;
}
.cell img { width: 100%; height: 130px; object-fit: cover; display: block; }
.gallery.count-1 .cell img { height: 210px; }
.gallery.odd:not(.count-1) .cell:first-child img { height: 180px; }
.cell-label {
  position: absolute; left: 0; bottom: 0; padding: 2px 8px;
  font-size: 11px; color: #fff; background: rgba(0, 0, 0, 0.55);
  border-top-right-radius: 6px;
}

.slideshow {
  position: fixed; inset: 0; z-index: 3000; background: rgba(0, 0, 0, 0.9);
  display: flex; align-items: center; justify-content: center;
}
.slide-close {
  position: fixed; top: 14px; right: 14px; width: 40px; height: 40px; z-index: 1;
  border: none; border-radius: 50%; background: rgba(255, 255, 255, 0.15);
  color: #fff; font-size: 18px; cursor: pointer;
}
.slide-fig { margin: 0; max-width: 92vw; max-height: 88vh; text-align: center; }
.slide-fig img {
  max-width: 92vw; max-height: 74vh; object-fit: contain; border-radius: 6px;
}
figcaption { margin-top: 10px; color: #eee; font-size: 13px; }
.slide-label { font-weight: 600; margin-right: 8px; }
.slide-pos { color: #aaa; }
.slide-attr { display: block; margin-top: 4px; color: #999; font-size: 11px; }
.nav {
  position: fixed; top: 50%; transform: translateY(-50%);
  width: 48px; height: 48px; border: none; border-radius: 50%;
  background: rgba(255, 255, 255, 0.15); color: #fff; font-size: 26px; cursor: pointer;
}
.nav.prev { left: 12px; }
.nav.next { right: 12px; }
</style>
