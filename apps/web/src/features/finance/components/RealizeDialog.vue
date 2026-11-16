<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import {
  formatAmountInput,
  formatRupiah,
  parseRupiah,
  realizePlanSchema,
  type FinancePlan,
} from '@muhasabah/shared';
import { UiAlert, UiButton, UiDialog, UiInput, useZodForm } from '@/shared';
import { budgetApi } from '../api';
import { balanceLabel } from '../format';

/** Mencatat rencana sebagai transaksi nyata; nominal boleh berbeda dari rencana. */
const props = defineProps<{ plan: FinancePlan | null; today: string }>();
const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ changed: [] }>();

const form = reactive({ amount: '', date: '', note: '' });
const { errors, formError, submitting, submit, reset } = useZodForm(realizePlanSchema);

watch(open, (isOpen) => {
  if (!isOpen || !props.plan) return;
  reset();
  form.amount = formatAmountInput(props.plan.amount);
  // Rencana yang tanggalnya belum tiba dicatat hari ini (bila masih di bulan yang sama).
  const p = props.plan;
  form.date = p.date > props.today && props.today.startsWith(p.month) ? props.today : p.date;
  form.note = '';
});

watch(
  () => form.amount,
  (value) => {
    const formatted = formatAmountInput(parseRupiah(value));
    if (formatted !== value) form.amount = formatted;
  },
);

const diff = computed(() => {
  const n = parseRupiah(form.amount);
  return props.plan && n !== null ? n - props.plan.amount : 0;
});
const verb = computed(() => (props.plan?.type === 'income' ? 'Terima' : 'Bayar'));

function onSubmit() {
  if (!props.plan) return;
  const plan = props.plan;
  const values = {
    amount: parseRupiah(form.amount) ?? undefined,
    date: form.date,
    note: form.note.trim() || null,
  };
  return submit(values, async (data) => {
    await budgetApi.realize(plan.id, data);
    emit('changed');
    open.value = false;
  });
}
</script>

<template>
  <UiDialog v-model:open="open" :title="plan ? `${verb}: ${plan.name}` : verb">
    <form v-if="plan" class="space-y-4" novalidate @submit.prevent="onSubmit">
      <UiAlert v-if="formError" tone="error">{{ formError }}</UiAlert>
      <p class="text-sm text-stone-600 dark:text-stone-300">
        Rencana <span class="font-medium tabular-nums">{{ formatRupiah(plan.amount) }}</span> ·
        {{ plan.category.name }}
      </p>
      <UiInput
        v-model="form.amount"
        :label="plan.type === 'income' ? 'Nominal diterima (Rp)' : 'Nominal dibayar (Rp)'"
        inputmode="numeric"
        autocomplete="off"
        required
        :error="errors.amount"
        :hint="
          diff !== 0
            ? `Selisih dari rencana: ${diff > 0 ? '+' : ''}${balanceLabel(diff)}`
            : undefined
        "
      />
      <UiInput v-model="form.date" label="Tanggal" type="date" required :error="errors.date" />
      <UiInput v-model="form.note" label="Catatan (opsional)" :error="errors.note" />
      <div class="flex justify-end gap-2 pt-2">
        <UiButton variant="secondary" @click="open = false">Batal</UiButton>
        <UiButton type="submit" :loading="submitting">Simpan</UiButton>
      </div>
    </form>
  </UiDialog>
</template>
