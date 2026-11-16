<script setup lang="ts">
import { computed } from 'vue';
import { formatRupiah, type MonthTotals } from '@muhasabah/shared';
import { formatMonthYear } from '@/shared';
import { balanceLabel, compactRupiah, SERIES_CLASSES } from '../format';

/**
 * Pemasukan dan pengeluaran per bulan: dua bar berdampingan per bulan (pemasukan selalu
 * di kiri), satu sumbu, legenda, tooltip lewat `title`, dan tabel untuk pembaca layar.
 */
const props = defineProps<{ months: MonthTotals[]; current: string }>();
const emit = defineEmits<{ select: [month: string] }>();

const max = computed(() => Math.max(1, ...props.months.flatMap((m) => [m.income, m.expense])));
const shortMonth = (month: string) =>
  new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', month: 'short' }).format(
    new Date(`${month}-15T00:00:00Z`),
  );
const height = (v: number) => `${v > 0 ? Math.max(2, (v / max.value) * 100) : 0}%`;
const tooltip = (m: MonthTotals) =>
  `${formatMonthYear(`${m.month}-01`)}\nPemasukan ${formatRupiah(m.income)}\nPengeluaran ${formatRupiah(m.expense)}\nSelisih ${balanceLabel(m.balance)}`;
</script>

<template>
  <figure>
    <div class="mb-3 flex gap-4 text-xs text-stone-600 dark:text-stone-300">
      <span class="flex items-center gap-1.5">
        <span :class="['size-2.5 rounded-sm', SERIES_CLASSES.income]" />Pemasukan
      </span>
      <span class="flex items-center gap-1.5">
        <span :class="['size-2.5 rounded-sm', SERIES_CLASSES.expense]" />Pengeluaran
      </span>
      <span class="ml-auto tabular-nums text-stone-500 dark:text-stone-400">
        maks {{ compactRupiah(max) }}
      </span>
    </div>
    <div class="flex h-40 items-end gap-1 sm:gap-2" aria-hidden="true">
      <button
        v-for="m in months"
        :key="m.month"
        type="button"
        tabindex="-1"
        :title="tooltip(m)"
        :class="[
          'flex h-full flex-1 items-end justify-center gap-0.5 rounded-md px-0.5 transition hover:bg-stone-100 dark:hover:bg-stone-800',
          m.month === current && 'bg-stone-100/70 dark:bg-stone-800/70',
        ]"
        @click="emit('select', m.month)"
      >
        <span
          :class="['w-full max-w-3 rounded-t-[4px]', SERIES_CLASSES.income]"
          :style="{ height: height(m.income) }"
        />
        <span
          :class="['w-full max-w-3 rounded-t-[4px]', SERIES_CLASSES.expense]"
          :style="{ height: height(m.expense) }"
        />
      </button>
    </div>
    <div
      class="mt-1 flex gap-1 border-t border-stone-200 pt-1 sm:gap-2 dark:border-stone-700"
      aria-hidden="true"
    >
      <span
        v-for="m in months"
        :key="m.month"
        :class="[
          'flex-1 text-center text-[11px]',
          m.month === current ? 'font-semibold' : 'text-stone-500 dark:text-stone-400',
        ]"
      >
        {{ shortMonth(m.month) }}
      </span>
    </div>
    <figcaption class="sr-only">Pemasukan dan pengeluaran per bulan</figcaption>
    <table class="sr-only">
      <thead>
        <tr>
          <th>Bulan</th>
          <th>Pemasukan</th>
          <th>Pengeluaran</th>
          <th>Selisih</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in months" :key="m.month">
          <td>{{ formatMonthYear(`${m.month}-01`) }}</td>
          <td>{{ formatRupiah(m.income) }}</td>
          <td>{{ formatRupiah(m.expense) }}</td>
          <td>{{ balanceLabel(m.balance) }}</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>
