<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  createTemplateItemSchema,
  formatAmountInput,
  formatRupiah,
  parseRupiah,
  TRANSACTION_TYPE_LABELS,
  type FinanceCategory,
  type FinanceTemplateItem,
  type TransactionType,
} from '@muhasabah/shared';
import {
  COLOR_CLASSES,
  UiAlert,
  UiButton,
  UiDialog,
  UiInput,
  UiSelect,
  useZodForm,
} from '@/shared';
import { budgetApi } from '../api';
import { balanceLabel } from '../format';
import TypeToggle from './TypeToggle.vue';

/**
 * Template bulanan: daftar pemasukan/pengeluaran tetap yang bisa diterapkan ke bulan mana pun.
 * Mengubah template tidak mengubah bulan yang sudah diterapkan.
 */
const props = defineProps<{ categories: FinanceCategory[] }>();
const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ changed: [items: FinanceTemplateItem[]] }>();

const items = ref<FinanceTemplateItem[]>([]);
const editing = ref<FinanceTemplateItem | null>(null);
const busyId = ref<string | null>(null);
const listError = ref<string | null>(null);
const form = reactive({
  type: 'expense' as TransactionType,
  name: '',
  amount: '',
  dayOfMonth: '1',
  categoryId: '',
});
const { errors, formError, submitting, submit, reset } = useZodForm(createTemplateItemSchema);

const categoryOptions = computed(() =>
  props.categories
    .filter((c) => c.type === form.type && (!c.archived || c.id === editing.value?.category.id))
    .map((c) => ({ value: c.id, label: c.name })),
);
const firstCategory = (type: TransactionType) =>
  props.categories.find((c) => c.type === type && !c.archived)?.id ?? '';

const totals = computed(() => {
  const sum = (t: TransactionType) =>
    items.value.filter((i) => i.type === t).reduce((n, i) => n + i.amount, 0);
  const income = sum('income');
  const expense = sum('expense');
  return { income, expense, balance: income - expense };
});
const grouped = computed(() =>
  (['income', 'expense'] as const).map((type) => ({
    type,
    items: items.value.filter((i) => i.type === type),
  })),
);

async function load() {
  items.value = (await budgetApi.template()).items;
}

function startNew(type: TransactionType = form.type) {
  editing.value = null;
  reset();
  form.type = type;
  form.name = '';
  form.amount = '';
  form.dayOfMonth = '1';
  form.categoryId = firstCategory(type);
}

function startEdit(item: FinanceTemplateItem) {
  editing.value = item;
  reset();
  form.type = item.type;
  form.name = item.name;
  form.amount = formatAmountInput(item.amount);
  form.dayOfMonth = String(item.dayOfMonth);
  form.categoryId = item.category.id;
}

watch(open, async (isOpen) => {
  if (!isOpen) return;
  listError.value = null;
  startNew('expense');
  await load().catch(() => (listError.value = 'Gagal memuat template'));
});

watch(
  () => form.amount,
  (value) => {
    const formatted = formatAmountInput(parseRupiah(value));
    if (formatted !== value) form.amount = formatted;
  },
);

function onSubmit() {
  const day = Number(form.dayOfMonth);
  const values = {
    name: form.name,
    categoryId: form.categoryId,
    amount: parseRupiah(form.amount) ?? undefined,
    dayOfMonth: form.dayOfMonth.trim() && Number.isFinite(day) ? day : undefined,
  };
  return submit(values, async (data) => {
    if (editing.value) await budgetApi.updateTemplateItem(editing.value.id, data);
    else await budgetApi.createTemplateItem(data);
    await load();
    startNew();
    emit('changed', items.value);
  });
}

async function remove(item: FinanceTemplateItem) {
  busyId.value = item.id;
  listError.value = null;
  try {
    await budgetApi.removeTemplateItem(item.id);
    await load();
    if (editing.value?.id === item.id) startNew();
    emit('changed', items.value);
  } catch (err) {
    listError.value = err instanceof Error ? err.message : 'Gagal menghapus';
  } finally {
    busyId.value = null;
  }
}
</script>

<template>
  <UiDialog v-model:open="open" title="Template bulanan" wide>
    <div class="space-y-5">
      <p class="text-sm text-stone-600 dark:text-stone-300">
        Pemasukan dan pengeluaran tetap tiap bulan. Terapkan ke bulan mana pun dari halaman
        Keuangan; bulan yang sudah diterapkan tidak berubah saat template diubah.
      </p>
      <UiAlert v-if="listError" tone="error">{{ listError }}</UiAlert>

      <dl
        v-if="items.length"
        class="grid grid-cols-3 gap-2 rounded-2xl bg-stone-50 p-3 text-sm dark:bg-stone-800/60"
      >
        <div>
          <dt class="text-xs text-stone-500 dark:text-stone-400">Pemasukan</dt>
          <dd class="font-semibold tabular-nums">{{ formatRupiah(totals.income) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-stone-500 dark:text-stone-400">Pengeluaran</dt>
          <dd class="font-semibold tabular-nums">{{ formatRupiah(totals.expense) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-stone-500 dark:text-stone-400">Sisa</dt>
          <dd
            :class="[
              'font-semibold tabular-nums',
              totals.balance < 0 && 'text-rose-700 dark:text-rose-400',
            ]"
          >
            {{ balanceLabel(totals.balance) }}
          </dd>
        </div>
      </dl>

      <section v-for="g in grouped" :key="g.type">
        <h3 class="mb-1 text-sm font-semibold">{{ TRANSACTION_TYPE_LABELS[g.type] }}</h3>
        <ul v-if="g.items.length" class="divide-y divide-stone-100 dark:divide-stone-800">
          <li v-for="i in g.items" :key="i.id" class="flex items-center gap-3 py-2 text-sm">
            <span
              class="w-9 shrink-0 text-center text-xs text-stone-500 tabular-nums dark:text-stone-400"
              >tgl {{ i.dayOfMonth }}</span
            >
            <span
              :class="['size-2.5 shrink-0 rounded-full', COLOR_CLASSES[i.category.color].dot]"
            />
            <span class="min-w-0 flex-1">
              <span class="block truncate font-medium">{{ i.name }}</span>
              <span class="block truncate text-xs text-stone-500 dark:text-stone-400">{{
                i.category.name
              }}</span>
            </span>
            <span class="shrink-0 tabular-nums">{{ formatRupiah(i.amount) }}</span>
            <button
              type="button"
              class="rounded-full px-2 py-1 text-brand-700 hover:bg-stone-100 dark:text-brand-500 dark:hover:bg-stone-800"
              :aria-label="`Ubah ${i.name}`"
              @click="startEdit(i)"
            >
              Ubah
            </button>
            <button
              type="button"
              class="rounded-full px-2 py-1 text-rose-700 hover:bg-stone-100 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-stone-800"
              :disabled="busyId === i.id"
              :aria-label="`Hapus ${i.name}`"
              @click="remove(i)"
            >
              Hapus
            </button>
          </li>
        </ul>
        <p v-else class="py-1 text-sm text-stone-500 dark:text-stone-400">Belum ada.</p>
      </section>

      <form
        class="space-y-3 rounded-2xl bg-stone-50 p-4 dark:bg-stone-800/60"
        novalidate
        @submit.prevent="onSubmit"
      >
        <h3 class="text-sm font-semibold">
          {{ editing ? `Ubah “${editing.name}”` : 'Tambah item template' }}
        </h3>
        <UiAlert v-if="formError" tone="error">{{ formError }}</UiAlert>
        <TypeToggle
          v-model="form.type"
          label="Jenis item"
          @change="(t) => (form.categoryId = firstCategory(t))"
        />
        <UiInput v-model="form.name" label="Nama" required :error="errors.name" />
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_8rem]">
          <UiInput
            v-model="form.amount"
            label="Nominal (Rp)"
            inputmode="numeric"
            autocomplete="off"
            required
            :error="errors.amount"
          />
          <UiInput
            v-model="form.dayOfMonth"
            label="Tanggal (1–31)"
            inputmode="numeric"
            required
            :error="errors.dayOfMonth"
          />
        </div>
        <UiSelect v-model="form.categoryId" label="Kategori" :options="categoryOptions" />
        <div class="flex justify-end gap-2">
          <UiButton v-if="editing" variant="secondary" @click="startNew()">Batal ubah</UiButton>
          <UiButton type="submit" :loading="submitting">{{
            editing ? 'Simpan' : 'Tambah'
          }}</UiButton>
        </div>
      </form>
    </div>
  </UiDialog>
</template>
