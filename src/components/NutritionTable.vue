<script setup lang="ts">
import type { ProduceItem } from '../data/types'
defineProps<{ nutrition: ProduceItem['nutrition'] }>()
</script>
<template>
  <table class="nutrition">
    <caption>Per 100 g</caption>
    <tbody>
      <tr><th>Calories</th><td>{{ nutrition.per100g.calories }} kcal</td></tr>
      <tr><th>Carbs</th><td>{{ nutrition.per100g.carbs }} g</td></tr>
      <tr><th>Fiber</th><td>{{ nutrition.per100g.fiber }} g</td></tr>
      <tr><th>Protein</th><td>{{ nutrition.per100g.protein }} g</td></tr>
    </tbody>
  </table>
  <ul class="highlights">
    <li v-for="h in nutrition.highlights" :key="h">{{ h }}</li>
  </ul>
</template>
<style scoped>
.nutrition { width: 100%; border-collapse: collapse; margin: 8px 0; }
.nutrition th { text-align: left; color: var(--text-muted); font-weight: 500; padding: 4px 0; }
.nutrition td { text-align: right; }
.nutrition caption { text-align: left; font-size: 12px; color: var(--text-faint); margin-bottom: 4px; }
.highlights { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.highlights li {
  background: var(--low-bg); color: var(--low-text); border-radius: 12px;
  padding: 2px 10px; font-size: 13px;
}
</style>
