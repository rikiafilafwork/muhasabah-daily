<script setup lang="ts">
import { computed } from 'vue';
import { useSessionStore } from '@/features/auth';
import { DhikrTodayWidget } from '@/features/dhikr';
import { TodayHabitsWidget } from '@/features/habits';
import { PrayerTimesCard } from '@/features/prayer-times';
import { TodayAgendaWidget } from '@/features/schedule';
import { TodayTasksWidget } from '@/features/tasks';
import { UiIcon, useNow } from '@/shared';

const session = useSessionStore();
const now = useNow(60_000);
const timeZone = computed(() => session.user?.timezone);

const greeting = computed(() => {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone: timeZone.value,
    }).format(new Date(now.value)),
  );
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
});

const displayName = computed(() => session.user?.name ?? '');

const gregorian = computed(() =>
  new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: timeZone.value,
  }).format(new Date(now.value)),
);

// Kalender Umm al-Qura bawaan browser; bisa selisih sehari dengan penetapan resmi.
const hijri = computed(() => {
  try {
    return new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: timeZone.value,
    }).format(new Date(now.value));
  } catch {
    return null;
  }
});

const SHORTCUTS = [
  { label: 'Mulai fokus', to: '/focus', icon: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z' },
  { label: 'Tulis jurnal', to: '/journal', icon: 'M4 4h12l4 4v12H4zM8 12h8M8 16h5' },
  {
    label: 'Murajaah',
    to: '/memorization',
    icon: 'M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2zM8 7h6',
  },
  {
    label: 'Goals',
    to: '/goals',
    icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  },
];
</script>

<template>
  <div class="space-y-8">
    <header class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="text-sm font-medium text-brand-800 dark:text-brand-300">
          {{ greeting }} · Assalamu'alaikum
        </p>
        <h1 class="mt-1 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {{ displayName }}
        </h1>
        <p class="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {{ gregorian }}
          <template v-if="hijri">
            <span class="mx-1.5 text-stone-400" aria-hidden="true">•</span>
            <span title="Kalender Umm al-Qura; bisa berbeda sehari dengan penetapan resmi">
              {{ hijri }}
            </span>
          </template>
        </p>
      </div>

      <nav aria-label="Pintasan" class="-mx-4 -my-2 overflow-x-auto px-4 py-2 md:mx-0 md:px-0">
        <ul class="flex gap-2">
          <li v-for="s in SHORTCUTS" :key="s.to">
            <RouterLink
              :to="s.to"
              class="flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3.5 py-2 text-sm font-medium whitespace-nowrap text-stone-700 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-800 dark:border-stone-800 dark:bg-stone-900/80 dark:text-stone-200 dark:hover:border-brand-700 dark:hover:text-brand-200"
            >
              <UiIcon :path="s.icon" class="size-4 text-brand-700 dark:text-brand-400" />
              {{ s.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>
    </header>

    <PrayerTimesCard />

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <TodayTasksWidget />
      <TodayHabitsWidget />
      <DhikrTodayWidget />
      <TodayAgendaWidget />
    </div>
  </div>
</template>
