<script setup lang="ts">
import { useId } from 'vue';

defineProps<{
  label: string;
  type?: string;
  error?: string;
  hint?: string;
  autocomplete?: string;
  required?: boolean;
  step?: string;
  inputmode?: 'text' | 'email' | 'decimal' | 'numeric';
}>();
const model = defineModel<string>({ required: true });
const id = useId();
</script>

<template>
  <div class="space-y-1">
    <label :for="id" class="block text-sm font-medium text-stone-700 dark:text-stone-300">
      {{ label }}
    </label>
    <input
      :id="id"
      v-model="model"
      :type="type ?? 'text'"
      :autocomplete="autocomplete"
      :required="required"
      :step="step"
      :inputmode="inputmode"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="error ? `${id}-error` : hint ? `${id}-hint` : undefined"
      :class="[
        'block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs transition placeholder:text-stone-400 focus:outline-2 focus:outline-offset-0 dark:bg-stone-950 dark:text-stone-100',
        error
          ? 'border-red-500 focus:outline-red-500'
          : 'border-stone-300 focus:border-brand-600 focus:outline-brand-600/30 dark:border-stone-700',
      ]"
    />
    <p v-if="error" :id="`${id}-error`" class="text-sm text-red-700 dark:text-red-400">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="`${id}-hint`" class="text-xs text-stone-500 dark:text-stone-400">
      {{ hint }}
    </p>
  </div>
</template>
