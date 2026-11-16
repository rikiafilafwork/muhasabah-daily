<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  createPlanSchema,
  formatAmountInput,
  parseRupiah,
  type FinanceCategory,
  type FinancePlan,
  type TransactionType,
} from '@muhasabah/shared';
import { UiAlert, UiButton, UiDialog, UiInput, UiSelect, useZodForm } from '@/shared';
import { budgetApi } from '../api';
import TypeToggle from './TypeToggle.vue';

/** Membuat atau mengubah satu rencana (anggaran) pada bulan tertentu. */
const props = defineProps<{
  plan: FinancePlan | null;
  categories: FinanceCategory[];
  defaultDate: string;
}>();
const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ changed: [] }>();

const form = reactive({
  type: 'expense' as TransactionType,
  name: '',
  amount: '',
  date: '',
  categoryId: '',
});
const { errors, formError, submitting, submit, reset } = useZodForm(createPlanSchema);
const deleting = ref(false);

const categoryOptions = computed(() =>
  props.categories
    .filter((c) => c.type === form.type && (!c.archived || c.id === props.plan?.category.id))
    .map((c) => ({ value: c.id, label: c.name })),
);
const firstCategory = (type: TransactionType) =>
  props.categories.find((c) => c.type === type && !c.archived)?.id ?? '';

watch(open, (isOpen) => {
  if (!isOpen) return;
  reset();
  const p = props.plan;
  form.type = p?.type ?? 'expense';
  form.name = p?.name ?? '';
  form.amount = p ? formatAmountInput(p.amount) : '';
  form.date = p?.date ?? props.defaultDate;
  form.categoryId = p?.category.id ?? firstCategory(form.type);
});

watch(
  () => form.amount,
  (value) => {
    const formatted = formatAmountInput(parseRupiah(value));
    if (formatted !== value) form.amount = formatted;
  },
);

function onSubmit() {
  const values = {
    name: form.name,
    amount: parseRupiah(form.amount) ?? undefined,
    date: form.date,
    categoryId: form.categoryId,
  };
  return submit(values, async (data) => {
    if (props.plan) await budgetApi.updatePlan(props.plan.id, data);
    else await budgetApi.createPlan(data);
    emit('changed');
    open.value = false;
  });
}

async function onDelete() {
  if (!props.plan) return;
  deleting.value = true;
  try {
    await budgetApi.removePlan(props.plan.id);
    emit('changed');
    open.value = false;
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Gagal menghapus';
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <UiDialog v-model:open="open" :title="plan ? 'Ubah rencana' : 'Rencana baru'">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <UiAlert v-if="formError" tone="error">{{ formError }}</UiAlert>
      <TypeToggle
        v-model="form.type"
        label="Jenis rencana"
        @change="(t) => (form.categoryId = firstCategory(t))"
      />
      <UiInput v-model="form.name" label="Nama" required :error="errors.name" />
      <UiInput
        v-model="form.amount"
        label="Nominal rencana (Rp)"
        inputmode="numeric"
        autocomplete="off"
        required
        :error="errors.amount"
      />
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UiInput v-model="form.date" label="Tanggal" type="date" required :error="errors.date" />
        <UiSelect v-model="form.categoryId" label="Kategori" :options="categoryOptions" />
      </div>
      <p v-if="plan?.status === 'done'" class="text-xs text-stone-500 dark:text-stone-400">
        Rencana ini sudah tercatat. Mengubahnya tidak mengubah transaksi realisasinya.
      </p>
      <div class="flex items-center justify-between gap-2 pt-2">
        <UiButton v-if="plan" variant="ghost" :loading="deleting" @click="onDelete">Hapus</UiButton>
        <span v-else />
        <div class="flex gap-2">
          <UiButton variant="secondary" @click="open = false">Batal</UiButton>
          <UiButton type="submit" :loading="submitting">Simpan</UiButton>
        </div>
      </div>
    </form>
  </UiDialog>
</template>
