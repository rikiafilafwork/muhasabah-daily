<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { addDays, dateRange, type Habit, type HabitTemplate } from '@muhasabah/shared';
import { useUserClock } from '@/features/auth';
import { formatShortDate, UiAlert, UiButton, UiCard } from '@/shared';
import HabitEditDialog from '../components/HabitEditDialog.vue';
import HabitGrid from '../components/HabitGrid.vue';
import HabitInsightCard from '../components/HabitInsightCard.vue';
import HabitLibraryDialog from '../components/HabitLibraryDialog.vue';
import { loadTemplates, useHabits } from '../composables/useHabits';

const { today } = useUserClock();
/** Pergeseran minggu: 0 = 7 hari terakhir sampai hari ini. */
const weekOffset = ref(0);
const range = computed(() => {
  const to = addDays(today.value, weekOffset.value * 7);
  return { from: addDays(to, -6), to };
});
const dates = computed(() => dateRange(range.value.from, range.value.to));
const habits = useHabits(range);

const templates = ref<HabitTemplate[]>([]);
const templateMap = computed(() => new Map(templates.value.map((t) => [t.id, t])));
onMounted(async () => {
  templates.value = await loadTemplates().catch(() => []);
});

const insightKey = ref(0);
const libraryOpen = ref(false);
const editOpen = ref(false);
const editing = ref<Habit | null>(null);

async function toggle(h: Habit, d: string) {
  await habits.toggle(h, d);
  insightKey.value++;
}
function onCreated() {
  void habits.load();
  insightKey.value++;
}
function onChanged() {
  void habits.load();
  insightKey.value++;
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Habit</h1>
        <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Kebiasaan kecil yang dijaga setiap hari.
        </p>
      </div>
      <UiButton @click="libraryOpen = true">Tambah habit</UiButton>
    </header>

    <UiCard>
      <div class="mb-3 flex items-center justify-between gap-2">
        <p class="text-sm font-medium">
          {{ formatShortDate(range.from) }} – {{ formatShortDate(range.to) }}
        </p>
        <div class="flex gap-1">
          <UiButton variant="ghost" aria-label="Minggu sebelumnya" @click="weekOffset--"
            >‹</UiButton
          >
          <UiButton variant="ghost" :disabled="weekOffset === 0" @click="weekOffset = 0"
            >Hari ini</UiButton
          >
          <UiButton
            variant="ghost"
            aria-label="Minggu berikutnya"
            :disabled="weekOffset === 0"
            @click="weekOffset++"
            >›</UiButton
          >
        </div>
      </div>
      <UiAlert v-if="habits.error.value" tone="error" class="mb-3">{{
        habits.error.value
      }}</UiAlert>
      <HabitGrid
        v-if="habits.items.value.length"
        :habits="habits.items.value"
        :dates="dates"
        :today="today"
        :templates="templateMap"
        :is-done="habits.isDone"
        @toggle="toggle"
        @edit="(h) => ((editing = h), (editOpen = true))"
      />
      <div v-else-if="!habits.loading.value" class="py-10 text-center">
        <p class="text-sm text-stone-500 dark:text-stone-400">
          Belum ada habit. Mulai dari satu kebiasaan kecil.
        </p>
        <UiButton class="mt-3" variant="secondary" @click="libraryOpen = true"
          >Buka library habit</UiButton
        >
      </div>
    </UiCard>

    <HabitInsightCard v-if="habits.items.value.length" :today="today" :refresh-key="insightKey" />

    <HabitLibraryDialog
      v-model:open="libraryOpen"
      :templates="templates"
      :existing="habits.items.value"
      @created="onCreated"
    />
    <HabitEditDialog v-model:open="editOpen" :habit="editing" @changed="onChanged" />
  </div>
</template>
