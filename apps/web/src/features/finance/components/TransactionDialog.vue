<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  createTransactionSchema,
  formatAmountInput,
  parseRupiah,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_TYPES,
  type FinanceCategory,
  type Transaction,
  type TransactionType,
} from '@muhasabah/shared';
import { UiAlert, UiButton, UiDialog, UiInput, UiSelect, useZodForm } from '@/shared';
import { financeApi } from '../api';

const props = defineProps<{
  transaction: Transaction | null;
  categories: FinanceCategory[];
  /** Tanggal bawaan untuk transaksi baru. */
  defaultDate: string;
  defaultType?: TransactionType;
}>();
const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ saved: [t: Transaction]; deleted: [id: string] }>();

const form = reactive({
  type: 'expense' as TransactionType,
  amount: '',
  date: '',
  categoryId: '',
  note: '',
});
const { errors, formError, submitting, submit, reset } = useZodForm(createTransactionSchema);
const deleting = ref(false);

/** Kategori aktif sesuai jenis; kategori terarsip tetap muncul bila sedang dipakai. */
const categoryOptions = computed(() =>
  props.categories
    .filter((c) => c.type === form.type && (!c.archived || c.id === props.transaction?.category.id))
    .map((c) => ({ value: c.id, label: c.name })),
);

function firstCategory(type: TransactionType) {
  return props.categories.find((c) => c.type === type && !c.archived)?.id ?? '';
}

watch(open, (isOpen) => {
  if (!isOpen) return;
  reset();
  const t = props.transaction;
  form.type = t?.type ?? props.defaultType ?? 'expense';
  form.amount = t ? formatAmountInput(t.amount) : '';
  form.date = t?.date ?? props.defaultDate;
  form.categoryId = t?.category.id ?? firstCategory(form.type);
  form.note = t?.note ?? '';
});

function setType(type: TransactionType) {
  if (form.type === type) return;
  form.type = type;
  form.categoryId = firstCategory(type);
}

// Pemisah ribuan otomatis saat mengetik.
watch(
  () => form.amount,
  (value) => {
    const formatted = formatAmountInput(parseRupiah(value));
    if (formatted !== value) form.amount = formatted;
  },
);

function onSubmit() {
  const values = {
    amount: parseRupiah(form.amount) ?? undefined,
    date: form.date,
    categoryId: form.categoryId,
    note: form.note.trim() || null,
  };
  return submit(values, async (data) => {
    const saved = props.transaction
      ? await financeApi.update(props.transaction.id, data)
      : await financeApi.create(data);
    emit('saved', saved);
    open.value = false;
  });
}

async function onDelete() {
  if (!props.transaction) return;
  deleting.value = true;
  try {
    await financeApi.remove(props.transaction.id);
    emit('deleted', props.transaction.id);
    open.value = false;
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Gagal menghapus';
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <UiDialog v-model:open="open" :title="transaction ? 'Ubah transaksi' : 'Catat transaksi'">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <UiAlert v-if="formError" tone="error">{{ formError }}</UiAlert>
      <div
        role="group"
        aria-label="Jenis transaksi"
        class="flex w-full rounded-full bg-stone-100 p-1 dark:bg-stone-800"
      >
        <button
          v-for="t in [...TRANSACTION_TYPES].reverse()"
          :key="t"
          type="button"
          :aria-pressed="form.type === t"
          :class="[
            'flex-1 rounded-full px-4 py-1.5 text-sm transition',
            form.type === t
              ? 'bg-white font-medium shadow-xs dark:bg-stone-700'
              : 'text-stone-600 dark:text-stone-400',
          ]"
          @click="setType(t)"
        >
          {{ TRANSACTION_TYPE_LABELS[t] }}
        </button>
      </div>
      <UiInput
        v-model="form.amount"
        label="Nominal (Rp)"
        inputmode="numeric"
        autocomplete="off"
        required
        :error="errors.amount"
      />
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UiInput v-model="form.date" label="Tanggal" type="date" required :error="errors.date" />
        <div>
          <UiSelect v-model="form.categoryId" label="Kategori" :options="categoryOptions" />
          <p v-if="errors.categoryId" class="mt-1 text-sm text-red-700 dark:text-red-400">
            Pilih kategori
          </p>
        </div>
      </div>
      <UiInput v-model="form.note" label="Catatan (opsional)" :error="errors.note" />
      <div class="flex items-center justify-between gap-2 pt-2">
        <UiButton v-if="transaction" variant="ghost" :loading="deleting" @click="onDelete">
          Hapus
        </UiButton>
        <span v-else />
        <div class="flex gap-2">
          <UiButton variant="secondary" @click="open = false">Batal</UiButton>
          <UiButton type="submit" :loading="submitting">Simpan</UiButton>
        </div>
      </div>
    </form>
  </UiDialog>
</template>
