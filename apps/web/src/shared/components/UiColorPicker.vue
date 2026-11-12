<script setup lang="ts">
import { COLORS, type Color } from '@muhasabah/shared';
import { COLOR_CLASSES, COLOR_LABELS } from '../utils/colors';

defineProps<{ label?: string }>();
const model = defineModel<Color>({ required: true });
</script>

<template>
  <fieldset>
    <legend class="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
      {{ label ?? 'Warna' }}
    </legend>
    <div class="flex flex-wrap gap-2">
      <label
        v-for="c in COLORS"
        :key="c"
        :class="[
          'flex size-8 cursor-pointer items-center justify-center rounded-full has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-600',
          COLOR_CLASSES[c].dot,
          model === c &&
            'ring-2 ring-stone-900 ring-offset-2 dark:ring-white dark:ring-offset-stone-900',
        ]"
      >
        <input v-model="model" type="radio" class="sr-only" :value="c" />
        <span class="sr-only">{{ COLOR_LABELS[c] }}</span>
      </label>
    </div>
  </fieldset>
</template>
