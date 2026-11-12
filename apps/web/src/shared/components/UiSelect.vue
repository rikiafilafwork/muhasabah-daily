<script setup lang="ts">
import { useId } from 'vue';

defineProps<{
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}>();
const model = defineModel<string>({ required: true });
const id = useId();
</script>

<template>
  <div class="space-y-1">
    <label :for="id" class="block text-sm font-medium text-stone-700 dark:text-stone-300">
      {{ label }}
    </label>
    <select
      :id="id"
      v-model="model"
      class="block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-xs focus:outline-2 focus:outline-brand-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
  </div>
</template>
