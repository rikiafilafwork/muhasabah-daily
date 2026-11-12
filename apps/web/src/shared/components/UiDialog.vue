<script setup lang="ts">
import { nextTick, ref, useId, watch } from 'vue';

defineProps<{ title: string; description?: string; wide?: boolean }>();
const open = defineModel<boolean>('open', { required: true });
const dialog = ref<HTMLDialogElement | null>(null);
const titleId = useId();

// <dialog> bawaan: fokus terkunci di dalam, Escape menutup, latar belakang inert.
watch(
  open,
  async (value) => {
    await nextTick();
    const el = dialog.value;
    if (!el) return;
    if (value && !el.open) el.showModal();
    if (!value && el.open) el.close();
  },
  { immediate: true },
);

function onBackdrop(e: MouseEvent) {
  if (e.target === dialog.value) open.value = false;
}
</script>

<template>
  <dialog
    ref="dialog"
    :aria-labelledby="titleId"
    :class="[
      'm-auto w-[calc(100%-2rem)] rounded-2xl border border-stone-200 bg-white p-0 text-stone-900 shadow-xl backdrop:bg-stone-950/50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100',
      wide ? 'max-w-2xl' : 'max-w-lg',
    ]"
    @close="open = false"
    @click="onBackdrop"
  >
    <div v-if="open" class="p-5">
      <header class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 :id="titleId" class="text-lg font-semibold">{{ title }}</h2>
          <p v-if="description" class="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
            {{ description }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
          @click="open = false"
        >
          <span class="sr-only">Tutup</span>
          <svg
            class="size-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6 6 18" stroke-linecap="round" />
          </svg>
        </button>
      </header>
      <slot />
    </div>
  </dialog>
</template>
