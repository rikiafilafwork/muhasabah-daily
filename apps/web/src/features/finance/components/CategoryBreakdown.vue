<script setup lang="ts">
import { computed } from 'vue';
import { budgetGap, formatRupiah, type FinanceCategoryTotal } from '@muhasabah/shared';
import { COLOR_CLASSES } from '@/shared';

/**
 * Total per kategori. Kategori yang punya rencana menampilkan real terhadap rencana
 * (bar terisi = persentase rencana yang sudah terpakai); lainnya menampilkan porsi
 * terhadap total jenisnya.
 */
const props = defineProps<{ items: FinanceCategoryTotal[]; emptyText: string }>();
const total = computed(() => props.items.reduce((n, c) => n + c.total, 0));
const share = (v: number) => (total.value ? Math.round((v / total.value) * 100) : 0);

function row(c: FinanceCategoryTotal) {
  if (c.planned > 0) {
    const gap = budgetGap(c.type, c.planned, c.total);
    const over = gap < 0;
    return {
      width: Math.min(100, Math.round((c.total / c.planned) * 100)),
      over: over && c.type === 'expense',
      detail: `dari ${formatRupiah(c.planned)}`,
      gap:
        gap === 0
          ? 'sesuai rencana'
          : c.type === 'expense'
            ? over
              ? `lebih ${formatRupiah(-gap)}`
              : `sisa ${formatRupiah(gap)}`
            : over
              ? `kurang ${formatRupiah(-gap)}`
              : `lebih ${formatRupiah(gap)}`,
      gapTone: over ? 'text-rose-700 dark:text-rose-400' : '',
    };
  }
  return {
    width: Math.max(2, share(c.total)),
    over: false,
    detail: `${share(c.total)}% · tanpa rencana`,
    gap: null,
    gapTone: '',
  };
}
</script>

<template>
  <ul v-if="items.length" class="space-y-3">
    <li v-for="c in items" :key="c.categoryId">
      <div class="flex items-baseline justify-between gap-3 text-sm">
        <span class="flex min-w-0 items-center gap-2">
          <span :class="['size-2.5 shrink-0 rounded-full', COLOR_CLASSES[c.color].dot]" />
          <span class="truncate">{{ c.name }}</span>
          <span v-if="c.count" class="shrink-0 text-xs text-stone-500 dark:text-stone-400"
            >{{ c.count }}×</span
          >
        </span>
        <span class="shrink-0 tabular-nums">{{ formatRupiah(c.total) }}</span>
      </div>
      <div class="mt-1 h-1.5 rounded-full bg-stone-100 dark:bg-stone-800" aria-hidden="true">
        <div
          :class="[
            'h-full rounded-full',
            row(c).over ? 'bg-rose-600 dark:bg-rose-500' : COLOR_CLASSES[c.color].dot,
          ]"
          :style="{ width: `${row(c).width}%` }"
        />
      </div>
      <p
        class="mt-0.5 flex justify-between gap-2 text-xs text-stone-500 tabular-nums dark:text-stone-400"
      >
        <span>{{ row(c).detail }}</span>
        <span v-if="row(c).gap" :class="['font-medium', row(c).gapTone]">{{ row(c).gap }}</span>
      </p>
    </li>
  </ul>
  <p v-else class="text-sm text-stone-500 dark:text-stone-400">{{ emptyText }}</p>
</template>
