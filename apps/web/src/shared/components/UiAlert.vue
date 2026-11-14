<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'error' | 'info' | 'success' | 'warning' }>(), {
  tone: 'info',
});

const tones = {
  error:
    'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
  info: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200',
  success:
    'border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-900 dark:bg-brand-900/40 dark:text-brand-100',
  warning:
    'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
};
</script>

<template>
  <div
    :role="tone === 'error' ? 'alert' : 'status'"
    :class="['rounded-2xl border px-4 py-3 text-sm', tones[tone]]"
  >
    <slot />
  </div>
</template>
