<script setup lang="ts">
import { computed } from 'vue';
import { formatRupiah, type FinanceCategoryTotal } from '@muhasabah/shared';
import { COLOR_CLASSES } from '@/shared';

/** Total per kategori sebagai bar horizontal; persentase terhadap total jenisnya. */
const props = defineProps<{ items: FinanceCategoryTotal[]; emptyText: string }>();
const total = computed(() => props.items.reduce((n, c) => n + c.total, 0));
const pct = (v: number) => (total.value ? Math.round((v / total.value) * 100) : 0);
</script>

<template>
  <ul v-if="items.length" class="space-y-3">
    <li v-for="c in items" :key="c.categoryId">
      <div class="flex items-baseline justify-between gap-3 text-sm">
        <span class="flex min-w-0 items-center gap-2">
          <span :class="['size-2.5 shrink-0 rounded-full', COLOR_CLASSES[c.color].dot]" />
          <span class="truncate">{{ c.name }}</span>
          <span class="shrink-0 text-xs text-stone-500 dark:text-stone-400">{{ c.count }}×</span>
        </span>
        <span class="shrink-0 tabular-nums">
          {{ formatRupiah(c.total) }}
          <span class="text-xs text-stone-500 dark:text-stone-400">{{ pct(c.total) }}%</span>
        </span>
      </div>
      <div class="mt-1 h-1.5 rounded-full bg-stone-100 dark:bg-stone-800" aria-hidden="true">
        <div
          :class="['h-full rounded-full', COLOR_CLASSES[c.color].dot]"
          :style="{ width: `${Math.max(2, pct(c.total))}%` }"
        />
      </div>
    </li>
  </ul>
  <p v-else class="text-sm text-stone-500 dark:text-stone-400">{{ emptyText }}</p>
</template>
