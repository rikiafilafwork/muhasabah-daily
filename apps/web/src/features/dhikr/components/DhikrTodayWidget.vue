<script setup lang="ts">
import { ref, watch } from 'vue';
import { DHIKR_GROUP_LABELS, type DhikrSummary } from '@muhasabah/shared';
import { useUserClock } from '@/features/auth';
import { UiCard } from '@/shared';
import { dhikrApi } from '../api';

const { today } = useUserClock();
const summary = ref<DhikrSummary | null>(null);
watch(today, async (d) => (summary.value = await dhikrApi.summary(d).catch(() => null)), {
  immediate: true,
});
</script>

<template>
  <UiCard title="Dzikir hari ini">
    <template #actions>
      <RouterLink
        to="/dhikr"
        class="text-sm font-medium text-brand-700 hover:underline dark:text-brand-500"
      >
        Buka dzikir
      </RouterLink>
    </template>
    <ul v-if="summary" class="space-y-3">
      <li v-for="g in summary.groups" :key="g.group">
        <RouterLink
          :to="`/dhikr?group=${g.group}`"
          class="block rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50"
        >
          <div class="mb-1 flex justify-between text-sm">
            <span>{{ DHIKR_GROUP_LABELS[g.group] }}</span>
            <span class="text-stone-500 tabular-nums dark:text-stone-400"
              >{{ g.completed }}/{{ g.total }}</span
            >
          </div>
          <div
            class="h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800"
            aria-hidden="true"
          >
            <div
              class="h-full rounded-full bg-brand-600"
              :style="{ width: `${g.total ? (g.completed / g.total) * 100 : 0}%` }"
            />
          </div>
        </RouterLink>
      </li>
    </ul>
  </UiCard>
</template>
