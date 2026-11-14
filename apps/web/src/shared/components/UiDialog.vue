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
      // Mobile: lembar dari bawah. Layar lebar: dialog di tengah.
      'mx-0 mt-auto mb-0 max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-3xl border border-stone-200 bg-white p-0 text-stone-900 shadow-xl backdrop:bg-stone-950/50 backdrop:backdrop-blur-[2px] open:animate-sheet-up sm:m-auto sm:w-[calc(100%-2rem)] sm:rounded-3xl dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100',
      wide ? 'sm:max-w-2xl' : 'sm:max-w-lg',
    ]"
    @close="open = false"
    @click="onBackdrop"
  >
    <div v-if="open" class="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
      <header class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 :id="titleId" class="font-display text-xl font-semibold">{{ title }}</h2>
          <p v-if="description" class="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
            {{ description }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-full p-1.5 text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
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
