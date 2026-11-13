<script setup lang="ts">
import { computed } from 'vue';
import { useUserClock } from '@/features/auth';
import { COLOR_CLASSES, UiCard } from '@/shared';
import { useHabits } from '../composables/useHabits';

const { today } = useUserClock();
const range = computed(() => ({ from: today.value, to: today.value }));
const habits = useHabits(range);
const doneCount = computed(
  () => habits.items.value.filter((h) => habits.isDone(h, today.value)).length,
);
</script>

<template>
  <UiCard
    title="Habit hari ini"
    :description="
      habits.items.value.length
        ? `${doneCount} dari ${habits.items.value.length} selesai`
        : undefined
    "
  >
    <template #actions>
      <RouterLink
        to="/habits"
        class="text-sm font-medium text-brand-700 hover:underline dark:text-brand-500"
      >
        Lihat insight
      </RouterLink>
    </template>
    <ul v-if="habits.items.value.length" class="space-y-1">
      <li v-for="h in habits.items.value" :key="h.id">
        <label
          class="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-stone-50 dark:hover:bg-stone-800/50"
        >
          <input
            type="checkbox"
            class="size-5 accent-brand-700"
            :checked="habits.isDone(h, today)"
            :disabled="today < h.startDate"
            @change="habits.toggle(h, today)"
          />
          <span :class="['size-2 rounded-full', COLOR_CLASSES[h.color].dot]" aria-hidden="true" />
          <span
            :class="[
              'text-sm',
              habits.isDone(h, today) && 'text-stone-500 dark:text-stone-400 line-through',
            ]"
            >{{ h.name }}</span
          >
        </label>
      </li>
    </ul>
    <p v-else-if="!habits.loading.value" class="text-sm text-stone-500 dark:text-stone-400">
      Belum ada habit.
      <RouterLink to="/habits" class="text-brand-700 underline dark:text-brand-500"
        >Tambah dari library</RouterLink
      >.
    </p>
  </UiCard>
</template>
