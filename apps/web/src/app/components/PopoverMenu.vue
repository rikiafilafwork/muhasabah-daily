<script setup lang="ts">
import { onBeforeUnmount, ref, useId, watch } from 'vue';
import { useRoute } from 'vue-router';

/**
 * Panel tarik-turun berpola disclosure (tombol + panel berisi tautan). Tertutup saat
 * klik di luar, Escape, atau pindah halaman. Fokus kembali ke tombol setelah Escape.
 */
withDefaults(defineProps<{ align?: 'left' | 'right'; panelClass?: string }>(), {
  align: 'left',
  panelClass: '',
});

const open = ref(false);
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const panelId = useId();
const route = useRoute();

function onDocClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false;
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    open.value = false;
    trigger.value?.focus();
  }
}

watch(open, (v) => {
  if (v) {
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
  } else {
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onKey);
  }
});
watch(
  () => route.fullPath,
  () => (open.value = false),
);
onBeforeUnmount(() => (open.value = false));

const close = () => (open.value = false);
</script>

<template>
  <div ref="root" class="relative">
    <button
      ref="trigger"
      type="button"
      :aria-expanded="open"
      :aria-controls="panelId"
      @click="open = !open"
    >
      <slot name="trigger" :open="open" />
    </button>
    <div
      v-if="open"
      :id="panelId"
      :class="[
        'absolute top-full z-50 mt-2 animate-pop rounded-2xl border border-stone-200 bg-white p-2 shadow-soft dark:border-stone-800 dark:bg-stone-900 dark:shadow-black/40',
        align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
        panelClass,
      ]"
    >
      <slot :close="close" />
    </div>
  </div>
</template>
