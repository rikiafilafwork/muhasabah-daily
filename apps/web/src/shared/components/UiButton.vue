<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    type?: 'button' | 'submit';
    loading?: boolean;
    disabled?: boolean;
    block?: boolean;
  }>(),
  { variant: 'primary', type: 'button' },
);

const variants = {
  primary: 'bg-brand-700 text-white shadow-sm shadow-brand-900/20 hover:bg-brand-800',
  secondary:
    'border border-stone-300 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800',
  ghost: 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
  danger: 'bg-red-700 text-white hover:bg-red-800',
};
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-full px-4.5 py-2 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
      variants[variant],
      block && 'w-full',
    ]"
  >
    <span
      v-if="loading"
      class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
