<script setup lang="ts">
import { computed } from 'vue';
import { useSessionStore } from '@/features/auth';
import { PrayerTimesCard } from '@/features/prayer-times';
import { UiCard } from '@/shared';

const session = useSessionStore();

const greeting = computed(() => {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone: session.user?.timezone,
    }).format(new Date()),
  );
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
});

const upcoming = [
  { title: 'Habit harian', text: 'Centang kebiasaan baik dan lihat streak-mu.', phase: 2 },
  { title: 'To-Do & fokus hari ini', text: 'Susun tugas di sela waktu sholat.', phase: 2 },
  { title: 'Dzikir pagi & petang', text: 'Penghitung dzikir dengan rujukan.', phase: 3 },
  { title: 'Timer fokus', text: 'Sesi fokus yang tercatat otomatis.', phase: 3 },
];
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <header>
      <p class="text-sm text-stone-500 dark:text-stone-400">{{ greeting }},</p>
      <h1 class="text-2xl font-semibold">{{ session.user?.name }}</h1>
    </header>

    <PrayerTimesCard />

    <section aria-labelledby="upcoming-title">
      <h2 id="upcoming-title" class="mb-3 text-sm font-semibold text-stone-500 dark:text-stone-400">
        Segera hadir
      </h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <UiCard v-for="m in upcoming" :key="m.title">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-medium">{{ m.title }}</h3>
              <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">{{ m.text }}</p>
            </div>
            <span
              class="shrink-0 rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-500 dark:bg-stone-800"
            >
              Fase {{ m.phase }}
            </span>
          </div>
        </UiCard>
      </div>
    </section>
  </div>
</template>
