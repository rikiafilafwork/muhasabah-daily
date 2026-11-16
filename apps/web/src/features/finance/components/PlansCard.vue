<script setup lang="ts">
import { computed } from 'vue';
import {
  formatRupiah,
  TRANSACTION_TYPE_LABELS,
  type FinancePlan,
  type TransactionType,
} from '@muhasabah/shared';
import { COLOR_CLASSES, formatShortDate, UiButton, UiCard } from '@/shared';
import { balanceLabel } from '../format';

/** Rencana (anggaran) satu bulan dengan tombol Bayar/Terima dan selisih per item. */
const props = defineProps<{
  plans: FinancePlan[];
  templateCount: number;
  today: string;
  monthName: string;
  applying: boolean;
  busyId: string | null;
}>();
const emit = defineEmits<{
  apply: [];
  add: [];
  template: [];
  edit: [plan: FinancePlan];
  realize: [plan: FinancePlan];
  unrealize: [plan: FinancePlan];
}>();

const done = computed(() => props.plans.filter((p) => p.status === 'done').length);
const fromTemplate = computed(() => props.plans.filter((p) => p.templateItemId).length);
const groups = computed(() =>
  (['expense', 'income'] as TransactionType[])
    .map((type) => ({ type, items: props.plans.filter((p) => p.type === type) }))
    .filter((g) => g.items.length),
);

const overdue = (p: FinancePlan) => p.status === 'pending' && p.date < props.today;
/** Selisih yang merugikan: pengeluaran melebihi rencana atau pemasukan kurang dari rencana. */
const unfavourable = (p: FinancePlan) =>
  p.difference !== null && (p.type === 'expense' ? p.difference > 0 : p.difference < 0);
const diffLabel = (d: number) => `${d > 0 ? '+' : ''}${balanceLabel(d)} dari rencana`;
</script>

<template>
  <UiCard title="Rencana bulan ini" data-testid="finance-plans">
    <div class="-mt-2 mb-4 flex flex-wrap gap-2">
      <UiButton variant="secondary" @click="emit('template')">Template</UiButton>
      <UiButton variant="secondary" @click="emit('add')">+ Rencana</UiButton>
    </div>

    <template v-if="plans.length">
      <div class="mb-4">
        <div class="flex justify-between text-xs text-stone-500 dark:text-stone-400">
          <span>{{ done }} dari {{ plans.length }} tercatat</span>
          <button
            v-if="templateCount > fromTemplate"
            type="button"
            class="font-medium text-brand-700 hover:underline disabled:opacity-60 dark:text-brand-500"
            :disabled="applying"
            @click="emit('apply')"
          >
            Tambahkan item template yang belum ada
          </button>
        </div>
        <div
          class="mt-1 h-1.5 rounded-full bg-stone-100 dark:bg-stone-800"
          role="progressbar"
          aria-label="Rencana tercatat"
          :aria-valuenow="done"
          aria-valuemin="0"
          :aria-valuemax="plans.length"
        >
          <div
            class="h-full rounded-full bg-brand-700 dark:bg-brand-500"
            :style="{ width: `${(done / plans.length) * 100}%` }"
          />
        </div>
      </div>

      <section v-for="g in groups" :key="g.type" class="mb-3 last:mb-0">
        <h3
          class="border-b border-stone-100 pb-1 text-xs font-medium text-stone-500 dark:border-stone-800 dark:text-stone-400"
        >
          {{ TRANSACTION_TYPE_LABELS[g.type] }}
        </h3>
        <ul>
          <li v-for="p in g.items" :key="p.id" class="flex items-center gap-2 py-1.5">
            <button
              type="button"
              class="-ml-2 flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1 text-left text-sm hover:bg-stone-50 dark:hover:bg-stone-800/60"
              @click="emit('edit', p)"
            >
              <span class="sr-only">Ubah rencana:</span>
              <span
                v-if="p.status === 'done'"
                class="flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white dark:bg-brand-500"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  class="size-3"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span
                v-else
                :class="[
                  'm-[3px] size-2.5 shrink-0 rounded-full',
                  COLOR_CLASSES[p.category.color].dot,
                ]"
              />
              <span class="min-w-0 flex-1">
                <span class="block truncate font-medium">{{ p.name }}</span>
                <span class="block truncate text-xs text-stone-500 dark:text-stone-400">
                  {{ p.category.name }} ·
                  <template v-if="p.transaction">
                    {{ p.type === 'income' ? 'diterima' : 'dibayar' }}
                    {{ formatShortDate(p.transaction.date) }}
                  </template>
                  <template v-else>{{ formatShortDate(p.date) }}</template>
                  <span v-if="overdue(p)" class="font-medium text-rose-700 dark:text-rose-400">
                    · Terlambat</span
                  >
                  <span
                    v-if="p.difference"
                    :class="unfavourable(p) && 'font-medium text-rose-700 dark:text-rose-400'"
                  >
                    · {{ diffLabel(p.difference) }}</span
                  >
                </span>
              </span>
              <span class="shrink-0 text-right tabular-nums">
                <span class="block font-medium">{{
                  formatRupiah(p.transaction?.amount ?? p.amount)
                }}</span>
                <span
                  v-if="p.transaction && p.difference"
                  class="block text-xs text-stone-500 line-through dark:text-stone-400"
                  >{{ formatRupiah(p.amount) }}</span
                >
              </span>
            </button>
            <UiButton
              v-if="p.status === 'pending'"
              variant="secondary"
              class="shrink-0 !px-3 !py-1"
              :aria-label="`${p.type === 'income' ? 'Terima' : 'Bayar'} ${p.name}`"
              @click="emit('realize', p)"
            >
              {{ p.type === 'income' ? 'Terima' : 'Bayar' }}
            </UiButton>
            <UiButton
              v-else
              variant="ghost"
              class="shrink-0 !px-3 !py-1"
              :loading="busyId === p.id"
              :aria-label="`Batalkan catatan ${p.name}`"
              @click="emit('unrealize', p)"
            >
              Batalkan
            </UiButton>
          </li>
        </ul>
      </section>
    </template>

    <div v-else class="py-4 text-center text-sm text-stone-500 dark:text-stone-400">
      <p>Belum ada rencana di {{ monthName }}.</p>
      <div class="mt-3 flex flex-wrap justify-center gap-2">
        <UiButton v-if="templateCount" :loading="applying" @click="emit('apply')">
          Terapkan template ({{ templateCount }} item)
        </UiButton>
        <UiButton v-else variant="secondary" @click="emit('template')"
          >Buat template bulanan</UiButton
        >
      </div>
    </div>
  </UiCard>
</template>
