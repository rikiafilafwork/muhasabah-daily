<script setup lang="ts">
import { TRANSACTION_TYPE_LABELS, type TransactionType } from '@muhasabah/shared';

/** Pilihan Pengeluaran/Pemasukan berbentuk tombol tersegmentasi. */
withDefaults(defineProps<{ label: string; full?: boolean }>(), { full: true });
const model = defineModel<TransactionType>({ required: true });
const emit = defineEmits<{ change: [type: TransactionType] }>();
const ORDER: TransactionType[] = ['expense', 'income'];

function pick(t: TransactionType) {
  if (model.value === t) return;
  model.value = t;
  emit('change', t);
}
</script>

<template>
  <div
    role="group"
    :aria-label="label"
    :class="['flex rounded-full bg-stone-100 p-1 dark:bg-stone-800', full ? 'w-full' : 'w-fit']"
  >
    <button
      v-for="t in ORDER"
      :key="t"
      type="button"
      :aria-pressed="model === t"
      :class="[
        'flex-1 rounded-full px-4 py-1.5 text-sm transition',
        model === t
          ? 'bg-white font-medium shadow-xs dark:bg-stone-700'
          : 'text-stone-600 dark:text-stone-400',
      ]"
      @click="pick(t)"
    >
      {{ TRANSACTION_TYPE_LABELS[t] }}
    </button>
  </div>
</template>
