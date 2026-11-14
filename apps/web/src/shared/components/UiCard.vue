<script setup lang="ts">
defineProps<{ title?: string; description?: string }>();
</script>

<template>
  <section
    class="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-soft sm:p-6 dark:border-stone-800 dark:bg-stone-900 dark:shadow-none"
  >
    <header v-if="title || $slots.actions" class="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 v-if="title" class="font-display text-lg font-semibold">{{ title }}</h2>
        <p v-if="description" class="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
          {{ description }}
        </p>
      </div>
      <slot name="actions" />
    </header>
    <slot />
  </section>
</template>
