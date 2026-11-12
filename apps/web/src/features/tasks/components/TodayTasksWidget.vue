<script setup lang="ts">
import { computed, ref } from 'vue';
import type { TasksQuery } from '@muhasabah/shared';
import { useUserClock } from '@/features/auth';
import { UiCard } from '@/shared';
import { useTaskList } from '../composables/useTaskList';
import TaskItem from './TaskItem.vue';

const { today } = useUserClock();
const focusQuery = ref<TasksQuery>({ focusToday: true, limit: 10 });
const focus = useTaskList(focusQuery);
const overdueQuery = ref<TasksQuery>({ due: 'overdue', limit: 1 });
const overdue = useTaskList(overdueQuery);
const remaining = computed(() => focus.items.value.filter((t) => !t.completed).length);
</script>

<template>
  <UiCard
    title="Fokus hari ini"
    :description="focus.items.value.length ? `${remaining} tersisa` : undefined"
  >
    <template #actions>
      <RouterLink
        to="/tasks?view=focus"
        class="text-sm font-medium text-brand-700 hover:underline dark:text-brand-500"
      >
        Semua tugas
      </RouterLink>
    </template>
    <ul
      v-if="focus.items.value.length"
      class="-mx-2 divide-y divide-stone-100 dark:divide-stone-800"
    >
      <TaskItem
        v-for="t in focus.items.value"
        :key="t.id"
        :task="t"
        :today="today"
        :busy="focus.busyIds.value.has(t.id)"
        @toggle="focus.toggleComplete(t)"
        @focus="focus.toggleFocus(t)"
        @open="$router.push('/tasks?view=focus')"
      />
    </ul>
    <p v-else-if="!focus.loading.value" class="text-sm text-stone-500 dark:text-stone-400">
      Pilih 1–3 tugas terpenting hari ini dengan menandai bintang di halaman To-Do.
    </p>
    <RouterLink
      v-if="overdue.items.value.length"
      to="/tasks?view=overdue"
      class="mt-3 block text-sm text-rose-700 hover:underline dark:text-rose-400"
    >
      Ada tugas yang terlambat — lihat
    </RouterLink>
  </UiCard>
</template>
