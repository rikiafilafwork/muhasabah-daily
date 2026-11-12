<script setup lang="ts">
defineProps<{ title?: string; description?: string }>();
</script>

<template>
  <section
    class="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900"
  >
    <header v-if="title || $slots.actions" class="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 v-if="title" class="text-base font-semibold">{{ title }}</h2>
        <p v-if="description" class="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
          {{ description }}
        </p>
      </div>
      <slot name="actions" />
    </header>
    <slot />
  </section>
</template>
