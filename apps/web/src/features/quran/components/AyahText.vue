<script setup lang="ts">
import type { Ayah } from '@muhasabah/shared';

defineProps<{
  ayah: Ayah;
  showLatin?: boolean;
  showTranslation?: boolean;
  hidden?: boolean;
  active?: boolean;
}>();
</script>

<template>
  <div
    :class="[
      'rounded-xl px-3 py-3 transition-colors',
      active ? 'bg-brand-50 ring-1 ring-brand-300 dark:bg-brand-900/30 dark:ring-brand-800' : '',
    ]"
    :aria-current="active ? 'true' : undefined"
  >
    <p
      lang="ar"
      dir="rtl"
      :class="['font-arabic text-right text-2xl leading-[2.2]', hidden && 'select-none blur-md']"
      :aria-hidden="hidden ? 'true' : undefined"
    >
      {{ ayah.arabic }}
      <span class="font-sans text-base text-stone-500 dark:text-stone-400"
        >﴿{{ ayah.numberInSurah }}﴾</span
      >
    </p>
    <span v-if="hidden" class="sr-only"
      >Teks ayat {{ ayah.numberInSurah }} disembunyikan untuk menguji hafalan.</span
    >
    <p v-if="showLatin && !hidden" class="mt-2 text-sm text-stone-600 italic dark:text-stone-300">
      {{ ayah.latin }}
    </p>
    <p v-if="showTranslation && !hidden" class="mt-1 text-sm text-stone-700 dark:text-stone-300">
      <span class="font-medium tabular-nums">{{ ayah.numberInSurah }}.</span> {{ ayah.translation }}
    </p>
  </div>
</template>
