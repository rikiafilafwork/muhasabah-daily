<script setup lang="ts">
import { computed } from 'vue';
import type { FocusSummary } from '@muhasabah/shared';
import { formatShortDate, formatWeekdayShort } from '@/shared';

/**
 * Menit fokus per hari (satu seri). Bar tipis berujung bulat dari garis dasar,
 * warna merek tunggal, tooltip lewat `title`, dan tabel untuk pembaca layar.
 */
const props = defineProps<{ summary: FocusSummary; today: string }>();

const minutes = (s: number) => Math.round(s / 60);
const max = computed(() =>
  Math.max(30, ...props.summary.byDate.map((d) => minutes(d.focusedSeconds))),
);
const bestDay = computed(() =>
  props.summary.byDate.reduce(
    (best, d) => (d.focusedSeconds > best.focusedSeconds ? d : best),
    props.summary.byDate[0]!,
  ),
);
</script>

<template>
  <figure>
    <div class="flex h-36 items-end gap-2" aria-hidden="true">
      <div
        v-for="d in summary.byDate"
        :key="d.date"
        class="group relative flex h-full flex-1 flex-col items-center justify-end"
        :title="`${formatWeekdayShort(d.date)} ${formatShortDate(d.date)}: ${minutes(d.focusedSeconds)} menit`"
      >
        <span
          v-if="d.date === bestDay.date && d.focusedSeconds > 0"
          class="mb-1 text-xs font-medium text-stone-600 tabular-nums dark:text-stone-300"
        >
          {{ minutes(d.focusedSeconds) }}
        </span>
        <div
          :class="[
            'w-full max-w-7 rounded-t-[4px] transition-opacity group-hover:opacity-80',
            d.date === today
              ? 'bg-brand-700 dark:bg-brand-500'
              : 'bg-brand-600/60 dark:bg-brand-500/50',
          ]"
          :style="{
            height: `${Math.max(d.focusedSeconds > 0 ? 3 : 0, (minutes(d.focusedSeconds) / max) * 100)}%`,
          }"
        />
      </div>
    </div>
    <div
      class="mt-1 flex gap-2 border-t border-stone-200 pt-1 dark:border-stone-700"
      aria-hidden="true"
    >
      <span
        v-for="d in summary.byDate"
        :key="d.date"
        :class="[
          'flex-1 text-center text-xs',
          d.date === today ? 'font-semibold' : 'text-stone-500 dark:text-stone-400',
        ]"
      >
        {{ formatWeekdayShort(d.date) }}
      </span>
    </div>
    <figcaption class="sr-only">Menit fokus per hari</figcaption>
    <table class="sr-only">
      <thead>
        <tr>
          <th>Tanggal</th>
          <th>Menit fokus</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="d in summary.byDate" :key="d.date">
          <td>{{ formatShortDate(d.date) }}</td>
          <td>{{ minutes(d.focusedSeconds) }}</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>
