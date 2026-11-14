<script setup lang="ts">
import { computed } from 'vue';
import { diffDays, type Goal } from '@muhasabah/shared';
import { formatShortDate, UiButton } from '@/shared';

const props = defineProps<{ goal: Goal; today: string; busy?: boolean }>();
const emit = defineEmits<{ increment: []; edit: [] }>();

const pct = (n: number) => `${Math.min(100, (n / props.goal.target) * 100)}%`;
const manualShown = computed(() => Math.min(props.goal.progress.manual, props.goal.target));
const habitsShown = computed(() => Math.max(0, props.goal.progress.total - manualShown.value));
const unit = computed(() => props.goal.unit ?? '');
const deadlineLabel = computed(() => {
  const d = props.goal.deadline;
  if (!d) return null;
  const left = diffDays(props.today, d);
  if (left < 0) return `Lewat ${-left} hari (${formatShortDate(d)})`;
  if (left === 0) return 'Tenggat hari ini';
  return `${left} hari lagi (${formatShortDate(d)})`;
});
</script>

<template>
  <article
    class="flex flex-col rounded-3xl border border-stone-200/80 bg-white p-5 shadow-soft dark:border-stone-800 dark:bg-stone-900"
    data-testid="goal-card"
  >
    <header class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h2 class="font-semibold">{{ goal.title }}</h2>
        <p v-if="goal.description" class="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
          {{ goal.description }}
        </p>
      </div>
      <span
        v-if="goal.progress.achieved"
        class="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-100"
      >
        Tercapai
      </span>
    </header>

    <p class="mt-4 text-2xl font-semibold tabular-nums">
      {{ goal.progress.total
      }}<span class="text-base font-normal text-stone-500 dark:text-stone-400">
        / {{ goal.target }} {{ unit }}</span
      >
    </p>
    <div
      class="mt-2 flex h-2.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800"
      role="progressbar"
      :aria-valuenow="goal.progress.percent"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="`Progres ${goal.title}`"
    >
      <div class="h-full bg-brand-700" :style="{ width: pct(manualShown) }" />
      <div class="h-full bg-amber-400" :style="{ width: pct(habitsShown) }" />
    </div>
    <dl class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600 dark:text-stone-400">
      <div class="flex items-center gap-1.5">
        <span class="size-2 rounded-full bg-brand-700" aria-hidden="true" />
        <dt>Manual</dt>
        <dd class="font-medium tabular-nums">{{ goal.progress.manual }}</dd>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="size-2 rounded-full bg-amber-400" aria-hidden="true" />
        <dt>Dari habit</dt>
        <dd class="font-medium tabular-nums">{{ goal.progress.fromHabits }}</dd>
      </div>
      <div>
        <dt class="sr-only">Persen</dt>
        <dd>{{ goal.progress.percent }}%</dd>
      </div>
    </dl>

    <ul
      v-if="goal.habits.length"
      class="mt-3 space-y-0.5 text-xs text-stone-500 dark:text-stone-400"
    >
      <li v-for="h in goal.habits" :key="h.habitId">
        {{ h.name }}: {{ h.doneCount }}× <span v-if="h.weight > 1">× {{ h.weight }}</span> =
        {{ h.contribution }}
      </li>
    </ul>

    <footer class="mt-auto flex items-center justify-between gap-2 pt-4">
      <span class="text-xs text-stone-500 dark:text-stone-400">{{ deadlineLabel }}</span>
      <div class="flex gap-1">
        <UiButton variant="ghost" @click="emit('edit')">Ubah</UiButton>
        <UiButton
          variant="secondary"
          :loading="busy"
          :disabled="goal.progress.achieved"
          :aria-label="`Tambah 1 ${unit} manual ke ${goal.title}`"
          @click="emit('increment')"
        >
          +1
        </UiButton>
      </div>
    </footer>
  </article>
</template>
