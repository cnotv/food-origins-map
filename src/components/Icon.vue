<script setup lang="ts">
// A small outline icon set (Feather-style: 24x24, stroke, currentColor) so the
// UI doesn't lean on pictographic emoji for controls — those render wildly
// differently across platforms/fonts and carry unwanted color of their own.
defineProps<{
  name: 'search' | 'filter' | 'leaf' | 'close' | 'map-pin'
}>()
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="icon"
  >
    <template v-if="name === 'search'">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </template>
    <template v-else-if="name === 'filter'">
      <line x1="4" y1="6" x2="20" y2="6" />
      <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="9" cy="18" r="2" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'leaf'">
      <path d="M5 21c.5-4.5 2.5-8 7-10" />
      <path d="M9 18c6.218 0 10.5-3.288 11-12v-2h-4.014c-9 0-11.986 4-12 9c0 1 0 3 2 5h3z" />
    </template>
    <template v-else-if="name === 'close'">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </template>
    <template v-else-if="name === 'map-pin'">
      <path d="M12 21s-7-7.5-7-12a7 7 0 0 1 14 0c0 4.5-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </template>
  </svg>
</template>

<style scoped>
.icon { width: 1em; height: 1em; display: block; }
</style>
