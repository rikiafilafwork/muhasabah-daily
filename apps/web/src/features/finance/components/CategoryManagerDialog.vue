<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  createFinanceCategorySchema,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_TYPES,
  type Color,
  type FinanceCategory,
  type TransactionType,
} from '@muhasabah/shared';
import {
  COLOR_CLASSES,
  UiAlert,
  UiButton,
  UiColorPicker,
  UiDialog,
  UiInput,
  useZodForm,
} from '@/shared';
import { financeApi } from '../api';

const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ changed: [] }>();

const categories = ref<FinanceCategory[]>([]);
const editing = ref<FinanceCategory | null>(null);
const form = reactive({ type: 'expense' as TransactionType, name: '', color: 'slate' as Color });
const { errors, formError, submitting, submit, reset } = useZodForm(createFinanceCategorySchema);
const busyId = ref<string | null>(null);
const rowError = ref<string | null>(null);

const grouped = computed(() =>
  TRANSACTION_TYPES.map((type) => ({
    type,
    items: categories.value.filter((c) => c.type === type),
  })),
);

async function load() {
  categories.value = (await financeApi.categories(true)).items;
}

function startNew() {
  editing.value = null;
  reset();
  form.name = '';
  form.color = 'slate';
}

function startEdit(c: FinanceCategory) {
  editing.value = c;
  reset();
  form.type = c.type;
  form.name = c.name;
  form.color = c.color;
}

watch(open, async (isOpen) => {
  if (!isOpen) return;
  startNew();
  rowError.value = null;
  await load().catch(() => (rowError.value = 'Gagal memuat kategori'));
});

function onSubmit() {
  return submit({ ...form }, async (data) => {
    if (editing.value) {
      await financeApi.updateCategory(editing.value.id, { name: data.name, color: data.color });
    } else {
      await financeApi.createCategory(data);
    }
    await load();
    startNew();
    emit('changed');
  });
}

async function run(c: FinanceCategory, action: () => Promise<unknown>) {
  busyId.value = c.id;
  rowError.value = null;
  try {
    await action();
    await load();
    if (editing.value?.id === c.id) startNew();
    emit('changed');
  } catch (err) {
    rowError.value = err instanceof Error ? err.message : 'Terjadi kesalahan';
  } finally {
    busyId.value = null;
  }
}
</script>

<template>
  <UiDialog v-model:open="open" title="Kategori keuangan" wide>
    <div class="space-y-5">
      <UiAlert v-if="rowError" tone="error">{{ rowError }}</UiAlert>
      <section v-for="g in grouped" :key="g.type">
        <h3 class="mb-1 text-sm font-semibold">{{ TRANSACTION_TYPE_LABELS[g.type] }}</h3>
        <ul class="divide-y divide-stone-100 dark:divide-stone-800">
          <li v-for="c in g.items" :key="c.id" class="flex items-center gap-3 py-2 text-sm">
            <span :class="['size-2.5 shrink-0 rounded-full', COLOR_CLASSES[c.color].dot]" />
            <span :class="['min-w-0 flex-1 truncate', c.archived && 'text-stone-400 line-through']">
              {{ c.name }}
              <span class="text-xs text-stone-500 no-underline dark:text-stone-400">
                · {{ c.transactionCount }} transaksi{{ c.archived ? ' · diarsipkan' : '' }}
              </span>
            </span>
            <button
              type="button"
              class="rounded-full px-2 py-1 text-brand-700 hover:bg-stone-100 dark:text-brand-500 dark:hover:bg-stone-800"
              :aria-label="`Ubah ${c.name}`"
              @click="startEdit(c)"
            >
              Ubah
            </button>
            <button
              type="button"
              class="rounded-full px-2 py-1 hover:bg-stone-100 disabled:opacity-50 dark:hover:bg-stone-800"
              :disabled="busyId === c.id"
              :aria-label="`${c.archived ? 'Pulihkan' : 'Arsipkan'} ${c.name}`"
              @click="run(c, () => financeApi.updateCategory(c.id, { archived: !c.archived }))"
            >
              {{ c.archived ? 'Pulihkan' : 'Arsipkan' }}
            </button>
            <button
              v-if="c.transactionCount === 0"
              type="button"
              class="rounded-full px-2 py-1 text-rose-700 hover:bg-stone-100 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-stone-800"
              :disabled="busyId === c.id"
              :aria-label="`Hapus ${c.name}`"
              @click="run(c, () => financeApi.removeCategory(c.id))"
            >
              Hapus
            </button>
          </li>
        </ul>
      </section>

      <form
        class="space-y-3 rounded-2xl bg-stone-50 p-4 dark:bg-stone-800/60"
        novalidate
        @submit.prevent="onSubmit"
      >
        <h3 class="text-sm font-semibold">
          {{ editing ? `Ubah “${editing.name}”` : 'Tambah kategori' }}
        </h3>
        <UiAlert v-if="formError" tone="error">{{ formError }}</UiAlert>
        <div
          v-if="!editing"
          role="group"
          aria-label="Jenis kategori"
          class="flex w-fit rounded-full bg-stone-200/70 p-1 dark:bg-stone-900"
        >
          <button
            v-for="t in [...TRANSACTION_TYPES].reverse()"
            :key="t"
            type="button"
            :aria-pressed="form.type === t"
            :class="[
              'rounded-full px-4 py-1 text-sm',
              form.type === t
                ? 'bg-white font-medium shadow-xs dark:bg-stone-700'
                : 'text-stone-600 dark:text-stone-400',
            ]"
            @click="form.type = t"
          >
            {{ TRANSACTION_TYPE_LABELS[t] }}
          </button>
        </div>
        <UiInput v-model="form.name" label="Nama kategori" required :error="errors.name" />
        <UiColorPicker v-model="form.color" />
        <div class="flex justify-end gap-2">
          <UiButton v-if="editing" variant="secondary" @click="startNew">Batal ubah</UiButton>
          <UiButton type="submit" :loading="submitting">
            {{ editing ? 'Simpan' : 'Tambah' }}
          </UiButton>
        </div>
      </form>
    </div>
  </UiDialog>
</template>
