<script setup lang="ts">
import { computed } from 'vue';
import { useSessionStore } from '@/features/auth';
import { DhikrTodayWidget } from '@/features/dhikr';
import { TodayHabitsWidget } from '@/features/habits';
import { PrayerTimesCard } from '@/features/prayer-times';
import { TodayAgendaWidget } from '@/features/schedule';
import { TodayTasksWidget } from '@/features/tasks';

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
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <header>
      <p class="text-sm text-stone-500 dark:text-stone-400">{{ greeting }},</p>
      <h1 class="text-2xl font-semibold">{{ session.user?.name }}</h1>
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
