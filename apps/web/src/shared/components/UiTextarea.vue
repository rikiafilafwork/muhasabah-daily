<script setup lang="ts">
import { useId } from 'vue';

defineProps<{ label: string; error?: string; rows?: number }>();
const model = defineModel<string>({ required: true });
const id = useId();
</script>

<template>
  <div class="space-y-1">
    <label :for="id" class="block text-sm font-medium text-stone-700 dark:text-stone-300">
      {{ label }}
    </label>
    <textarea
      :id="id"
      v-model="model"
      :rows="rows ?? 3"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="error ? `${id}-error` : undefined"
      class="block w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs transition focus:border-brand-600 focus:outline-2 focus:outline-brand-600/30 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
    />
    <p v-if="error" :id="`${id}-error`" class="text-sm text-red-700 dark:text-red-400">
      {{ error }}
    </p>
  </div>
</template>
