<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { formatRupiah, type FinanceSummary } from '@muhasabah/shared';
import { UiCard } from '@/shared';
import { financeApi } from '../api';
import { balanceLabel, monthLabel } from '../format';

const summary = ref<FinanceSummary | null>(null);
onMounted(async () => {
  summary.value = await financeApi.summary().catch(() => null);
});
</script>

<template>
  <UiCard title="Keuangan bulan ini" :description="summary ? monthLabel(summary.month) : undefined">
    <template #actions>
      <RouterLink
        to="/finance"
        class="text-sm font-medium text-brand-700 hover:underline dark:text-brand-500"
      >
        Catat
      </RouterLink>
    </template>
    <dl v-if="summary" class="grid grid-cols-3 gap-2 text-sm">
      <div>
        <dt class="text-xs text-stone-500 dark:text-stone-400">Pemasukan</dt>
        <dd class="mt-0.5 font-semibold tabular-nums">{{ formatRupiah(summary.income) }}</dd>
      </div>
      <div>
        <dt class="text-xs text-stone-500 dark:text-stone-400">Pengeluaran</dt>
        <dd class="mt-0.5 font-semibold tabular-nums">{{ formatRupiah(summary.expense) }}</dd>
        <dd
          v-if="summary.planned.expense"
          class="text-xs text-stone-500 tabular-nums dark:text-stone-400"
        >
          dari {{ formatRupiah(summary.planned.expense) }}
        </dd>
      </div>
      <div>
        <dt class="text-xs text-stone-500 dark:text-stone-400">Selisih</dt>
        <dd
          :class="[
            'mt-0.5 font-semibold tabular-nums',
            summary.balance < 0 && 'text-rose-700 dark:text-rose-400',
          ]"
        >
          {{ balanceLabel(summary.balance) }}
        </dd>
      </div>
    </dl>
    <p v-else class="text-sm text-stone-500 dark:text-stone-400">Belum ada data.</p>
    <RouterLink
      v-if="summary && summary.plans.pending"
      to="/finance"
      :class="[
        'mt-3 block text-sm hover:underline',
        summary.plans.overdue
          ? 'text-rose-700 dark:text-rose-400'
          : 'text-stone-600 dark:text-stone-300',
      ]"
    >
      {{ summary.plans.pending }} rencana belum tercatat<template v-if="summary.plans.overdue"
        >, {{ summary.plans.overdue }} terlambat</template
      >
    </RouterLink>
  </UiCard>
</template>
