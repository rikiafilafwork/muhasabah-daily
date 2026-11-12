<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import type { Habit, HabitTemplate } from '@muhasabah/shared';
import { COLOR_CLASSES, formatShortDate, formatWeekdayShort } from '@/shared';

const props = defineProps<{
  habits: Habit[];
  dates: string[];
  today: string;
  templates: Map<string, HabitTemplate>;
  isDone: (habit: Habit, date: string) => boolean;
}>();
const emit = defineEmits<{ toggle: [habit: Habit, date: string]; edit: [habit: Habit] }>();

// Di layar sempit grid bisa digulir; pastikan kolom terbaru (hari ini) yang terlihat.
const scroller = ref<HTMLElement | null>(null);
watch(
  () => props.dates,
  async () => {
    await nextTick();
    if (scroller.value) scroller.value.scrollLeft = scroller.value.scrollWidth;
  },
  { immediate: true },
);
</script>

<template>
  <div ref="scroller" class="-mx-5 overflow-x-auto px-5">
    <table class="w-full min-w-[27rem] sm:min-w-[34rem] border-separate border-spacing-y-1 text-sm">
      <caption class="sr-only">
        Centang habit per hari
      </caption>
      <thead>
        <tr>
          <th
            scope="col"
            class="sticky left-0 z-10 bg-white text-left font-medium text-stone-500 dark:bg-stone-900 dark:text-stone-400"
          >
            Habit
          </th>
          <th
            v-for="d in dates"
            :key="d"
            scope="col"
            :class="[
              'w-11 text-center text-xs font-medium',
              d === today
                ? 'text-brand-700 dark:text-brand-500'
                : 'text-stone-500 dark:text-stone-400',
            ]"
          >
            <span class="block">{{ formatWeekdayShort(d) }}</span>
            <span class="block font-normal">{{ formatShortDate(d).split(' ')[0] }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="h in habits" :key="h.id" data-testid="habit-row">
          <th
            scope="row"
            class="sticky left-0 z-10 w-32 max-w-32 bg-white py-1 pr-3 text-left font-normal sm:w-auto sm:max-w-0 dark:bg-stone-900"
          >
            <button
              type="button"
              class="group flex w-full min-w-0 items-start gap-2 text-left"
              @click="emit('edit', h)"
            >
              <span
                :class="['mt-1.5 size-2.5 shrink-0 rounded-full', COLOR_CLASSES[h.color].dot]"
                aria-hidden="true"
              />
              <span class="min-w-0">
                <span class="block truncate font-medium group-hover:underline">{{ h.name }}</span>
                <span
                  v-if="h.templateId && templates.get(h.templateId)?.reference"
                  class="block truncate text-xs text-stone-500 dark:text-stone-400"
                >
                  {{ templates.get(h.templateId)?.reference }}
                </span>
              </span>
            </button>
          </th>
          <td v-for="d in dates" :key="d" class="text-center">
            <button
              type="button"
              :disabled="d > today || d < h.startDate"
              :aria-pressed="isDone(h, d)"
              :aria-label="`${h.name}, ${formatWeekdayShort(d)} ${formatShortDate(d)}`"
              :class="[
                'inline-flex size-9 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-30',
                isDone(h, d)
                  ? [COLOR_CLASSES[h.color].dot, 'border-transparent text-white']
                  : 'border-stone-200 hover:border-stone-400 dark:border-stone-700 dark:hover:border-stone-500',
                d === today && !isDone(h, d) && 'border-brand-600 dark:border-brand-500',
              ]"
              @click="emit('toggle', h, d)"
            >
              <svg
                v-if="isDone(h, d)"
                class="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                aria-hidden="true"
              >
                <path d="m5 12 5 5 9-10" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
