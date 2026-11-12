<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { Goal, Habit } from '@muhasabah/shared';
import { ApiError } from '@/api/http';
import { useUserClock } from '@/features/auth';
import { habitsApi } from '@/features/habits';
import { UiAlert, UiButton } from '@/shared';
import { goalsApi } from '../api';
import GoalCard from '../components/GoalCard.vue';
import GoalDialog from '../components/GoalDialog.vue';

const { today } = useUserClock();
const goals = ref<Goal[]>([]);
const habits = ref<Habit[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const busyId = ref<string | null>(null);

async function load() {
  error.value = null;
  try {
    const [g, h] = await Promise.all([goalsApi.list(), habitsApi.list()]);
    goals.value = g.items;
    habits.value = h.items;
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Gagal memuat goals';
  } finally {
    loading.value = false;
  }
}
onMounted(load);

async function increment(goal: Goal) {
  busyId.value = goal.id;
  try {
    const updated = await goalsApi.update(goal.id, { manualValue: goal.manualValue + 1 });
    goals.value = goals.value.map((g) => (g.id === goal.id ? updated : g));
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Gagal menyimpan';
  } finally {
    busyId.value = null;
  }
}

const dialog = ref(false);
const editing = ref<Goal | null>(null);
function open(goal: Goal | null) {
  editing.value = goal;
  dialog.value = true;
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold">Goals</h1>
        <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Target terukur. Progres berasal dari nilai manual dan habit yang ditautkan.
        </p>
      </div>
      <UiButton @click="open(null)">Goal baru</UiButton>
    </header>

    <UiAlert v-if="error" tone="error">{{ error }}</UiAlert>

    <div v-if="goals.length" class="grid gap-4 md:grid-cols-2">
      <GoalCard
        v-for="g in goals"
        :key="g.id"
        :goal="g"
        :today="today"
        :busy="busyId === g.id"
        @increment="increment(g)"
        @edit="open(g)"
      />
    </div>
    <div
      v-else-if="!loading"
      class="rounded-2xl border border-dashed border-stone-300 py-12 text-center dark:border-stone-700"
    >
      <p class="text-sm text-stone-500 dark:text-stone-400">
        Belum ada goal. Contoh: "Khatam Al-Qur'an 30 juz" ditautkan ke habit tilawah.
      </p>
      <UiButton class="mt-3" variant="secondary" @click="open(null)">Buat goal pertama</UiButton>
    </div>

    <GoalDialog
      v-model:open="dialog"
      :goal="editing"
      :habits="habits"
      :today="today"
      @saved="load"
      @deleted="load"
    />
  </div>
</template>
