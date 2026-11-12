<script setup lang="ts">
import { UiCard } from '@/shared';

defineProps<{ title: string; phase: number }>();
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <h1 class="mb-6 text-2xl font-semibold">{{ title }}</h1>
    <UiCard>
      <p class="text-sm text-stone-600 dark:text-stone-400">
        Modul <strong>{{ title }}</strong> sedang disiapkan dan dijadwalkan pada fase {{ phase }}.
      </p>
    </UiCard>
  </div>
</template>
