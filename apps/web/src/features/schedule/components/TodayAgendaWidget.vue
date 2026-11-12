<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { CalendarEvent } from '@muhasabah/shared';
import { useUserClock } from '@/features/auth';
import { UiCard } from '@/shared';
import { eventsApi } from '../api';
import { datesToInstantRange, eventTimeLabel, groupByDate } from '../calendar';
import EventChip from './EventChip.vue';

const { today, timezone } = useUserClock();
const events = ref<CalendarEvent[]>([]);
const loaded = ref(false);
const todays = computed(() => groupByDate(events.value, timezone.value).get(today.value) ?? []);

watch(
  [today, timezone],
  async () => {
    const { from, to } = datesToInstantRange(today.value, today.value, timezone.value);
    events.value = (await eventsApi.list(from, to).catch(() => ({ items: [] }))).items;
    loaded.value = true;
  },
  { immediate: true },
);
</script>

<template>
  <UiCard title="Agenda hari ini">
    <template #actions>
      <RouterLink
        to="/schedule?view=day"
        class="text-sm font-medium text-brand-700 hover:underline dark:text-brand-500"
      >
        Buka jadwal
      </RouterLink>
    </template>
    <div v-if="todays.length" class="space-y-1.5">
      <EventChip
        v-for="e in todays"
        :key="e.id"
        :event="e"
        :time="eventTimeLabel(e, today, timezone)"
        @open="$router.push('/schedule?view=day')"
      />
    </div>
    <p v-else-if="loaded" class="text-sm text-stone-500 dark:text-stone-400">
      Tidak ada agenda hari ini.
    </p>
  </UiCard>
</template>
