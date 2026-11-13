<script setup lang="ts">
import { ref, watch } from 'vue';
import { addDays, type HabitInsights } from '@muhasabah/shared';
import { ApiError } from '@/api/http';
import { formatShortDate, UiAlert, UiCard } from '@/shared';
import { habitsApi } from '../api';

const props = defineProps<{ today: string; refreshKey: number }>();

const RANGES = [
  { days: 7, label: '7 hari' },
  { days: 30, label: '30 hari' },
  { days: 90, label: '90 hari' },
];
const days = ref(30);
const data = ref<HabitInsights | null>(null);
const error = ref<string | null>(null);

async function load() {
  error.value = null;
  try {
    data.value = await habitsApi.insights({
      from: addDays(props.today, -(days.value - 1)),
      to: props.today,
    });
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Gagal memuat insight';
  }
}
watch([days, () => props.today, () => props.refreshKey], load, { immediate: true });

const stats = (d: HabitInsights) => [
  { label: 'Check-in', value: d.summary.checkIns, hint: 'Total centang dalam rentang' },
  {
    label: 'Streak terbaik',
    value: `${d.summary.bestStreak} hari`,
    hint: 'Deret hari berturut-turut terpanjang',
  },
  { label: 'Konsistensi', value: `${d.summary.consistency}%`, hint: 'Centang dibagi hari aktif' },
  {
    label: 'Proyeksi minggu depan',
    value: d.summary.projectedNextWeek,
    hint: 'Dari rata-rata 4 minggu terakhir',
  },
];
</script>

<template>
  <UiCard
    title="Insight"
    :description="data ? `${formatShortDate(data.from)} – ${formatShortDate(data.to)}` : undefined"
  >
    <template #actions>
      <div
        role="group"
        aria-label="Rentang"
        class="flex rounded-lg bg-stone-100 p-0.5 dark:bg-stone-800"
      >
        <button
          v-for="r in RANGES"
          :key="r.days"
          type="button"
          :aria-pressed="days === r.days"
          :class="[
            'rounded-md px-2.5 py-1 text-xs',
            days === r.days
              ? 'bg-white font-medium shadow-xs dark:bg-stone-700'
              : 'text-stone-600 dark:text-stone-400',
          ]"
          @click="days = r.days"
        >
          {{ r.label }}
        </button>
      </div>
    </template>

    <UiAlert v-if="error" tone="error">{{ error }}</UiAlert>
    <template v-else-if="data">
      <dl class="grid grid-cols-2 gap-3 md:grid-cols-4" data-testid="habit-insights">
        <div
          v-for="s in stats(data)"
          :key="s.label"
          class="rounded-xl bg-stone-50 p-3 dark:bg-stone-800/60"
          :title="s.hint"
        >
          <dt class="text-xs text-stone-500 dark:text-stone-400">{{ s.label }}</dt>
          <dd class="mt-1 text-xl font-semibold tabular-nums">{{ s.value }}</dd>
        </div>
      </dl>

      <table v-if="data.habits.length" class="mt-5 w-full text-sm">
        <caption class="sr-only">
          Insight per habit
        </caption>
        <thead>
          <tr class="text-left text-xs text-stone-500 dark:text-stone-400">
            <th scope="col" class="pb-2 font-medium">Habit</th>
            <th scope="col" class="pb-2 font-medium">Konsistensi</th>
            <th scope="col" class="hidden pb-2 text-right font-medium sm:table-cell">Streak</th>
            <th scope="col" class="pb-2 text-right font-medium">Check-in</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100 dark:divide-stone-800">
          <tr v-for="h in data.habits" :key="h.habitId">
            <th scope="row" class="max-w-0 truncate py-2 pr-3 text-left font-normal">
              {{ h.name }}
            </th>
            <td class="py-2 pr-3 sm:w-2/5">
              <div class="flex items-center gap-2">
                <div
                  class="hidden h-2 flex-1 overflow-hidden rounded-full bg-stone-100 sm:block dark:bg-stone-800"
                  role="progressbar"
                  :aria-valuenow="h.consistency"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  :aria-label="`Konsistensi ${h.name}`"
                >
                  <div
                    class="h-full rounded-full bg-brand-600"
                    :style="{ width: `${h.consistency}%` }"
                  />
                </div>
                <span class="ml-auto w-10 text-right tabular-nums">{{ h.consistency }}%</span>
              </div>
            </td>
            <td class="hidden py-2 text-right tabular-nums sm:table-cell">
              {{ h.currentStreak }}
              <span class="text-stone-500 dark:text-stone-400">/ {{ h.bestStreak }}</span>
            </td>
            <td class="py-2 text-right tabular-nums">{{ h.checkIns }}/{{ h.activeDays }}</td>
          </tr>
        </tbody>
      </table>
      <p class="mt-3 text-xs text-stone-500 dark:text-stone-400">
        Streak: berjalan / terbaik. Check-in: centang / hari aktif sejak habit dimulai.
      </p>
    </template>
  </UiCard>
</template>
