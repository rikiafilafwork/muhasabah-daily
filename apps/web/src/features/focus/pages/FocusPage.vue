<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  FOCUS_PRESETS,
  getNextPrayer,
  type FocusSessionList,
  type PrayerTimes,
  type Task,
} from '@muhasabah/shared';
import { ApiError } from '@/api/http';
import { useSessionStore, useUserClock } from '@/features/auth';
import { prayerTimesApi } from '@/features/prayer-times';
import { tasksApi } from '@/features/tasks';
import { formatCountdown, formatTime, UiAlert, UiButton, UiCard, UiSelect } from '@/shared';
import { focusApi } from '../api';
import FocusRing from '../components/FocusRing.vue';
import FocusWeekChart from '../components/FocusWeekChart.vue';
import { useFocusTimer, type CompletedFocus } from '../composables/useFocusTimer';

/** Sesi yang dihentikan sebelum 1 menit tidak dicatat. */
const MIN_RECORD_SECONDS = 60;
const TASK_KEY = 'md-focus-task';

const session = useSessionStore();
const { today, timezone } = useUserClock();
const message = ref<{ tone: 'success' | 'info' | 'error'; text: string } | null>(null);

// ---- Tugas yang difokuskan
const tasks = ref<Task[]>([]);
const taskId = ref('');
try {
  taskId.value = localStorage.getItem(TASK_KEY) ?? '';
} catch {
  /* abaikan */
}
watch(taskId, (id) => {
  try {
    localStorage.setItem(TASK_KEY, id);
  } catch {
    /* abaikan */
  }
});
const taskOptions = computed(() => [
  { value: '', label: 'Tanpa tugas' },
  ...tasks.value.map((t) => ({ value: t.id, label: `${t.focusToday ? '★ ' : ''}${t.title}` })),
]);

// ---- Riwayat
const history = ref<FocusSessionList | null>(null);
async function loadHistory() {
  history.value = await focusApi.list().catch(() => null);
}
const todayStats = computed(() => {
  const items = history.value?.items.filter((s) => s.date === today.value) ?? [];
  return {
    minutes: Math.round(items.reduce((sum, s) => sum + s.focusedSeconds, 0) / 60),
    completed: items.filter((s) => s.status === 'completed').length,
    items,
  };
});

async function record(s: CompletedFocus) {
  if (s.focusedSeconds < MIN_RECORD_SECONDS) {
    message.value = { tone: 'info', text: 'Sesi dihentikan sebelum 1 menit, tidak dicatat.' };
    return;
  }
  const valid = tasks.value.some((t) => t.id === taskId.value);
  try {
    await focusApi.create({
      startedAt: new Date(s.startedAt).toISOString(),
      endedAt: new Date(s.endedAt).toISOString(),
      plannedSeconds: s.plannedSeconds,
      focusedSeconds: s.focusedSeconds,
      status: s.status,
      taskId: valid ? taskId.value : null,
    });
    message.value =
      s.status === 'completed'
        ? {
            tone: 'success',
            text: `Alhamdulillah, ${Math.round(s.focusedSeconds / 60)} menit fokus tercatat. Saatnya istirahat.`,
          }
        : {
            tone: 'info',
            text: `Sesi dihentikan; ${Math.round(s.focusedSeconds / 60)} menit tetap tercatat.`,
          };
    await loadHistory();
  } catch (err) {
    message.value = {
      tone: 'error',
      text: err instanceof ApiError ? err.message : 'Gagal mencatat sesi',
    };
  }
}

const timer = useFocusTimer(record);
const running = computed(() => timer.state.value.phase === 'running');
const idle = computed(() => timer.state.value.phase === 'idle');
const activePreset = computed(
  () =>
    FOCUS_PRESETS.find(
      (p) =>
        p.focusMinutes === timer.config.value.focusMinutes &&
        p.breakMinutes === timer.config.value.breakMinutes,
    )?.id,
);

// Hitung mundur di judul tab saat berjalan.
const originalTitle = document.title;
watch(
  () => [running.value, Math.ceil(timer.remainingMs.value / 1000)] as const,
  ([isRunning, s]) => {
    document.title = isRunning
      ? `${formatCountdown(s).slice(3)} · ${timer.state.value.mode === 'focus' ? 'Fokus' : 'Istirahat'}`
      : originalTitle;
  },
);
onUnmounted(() => (document.title = originalTitle));

// ---- Waktu sholat yang jatuh di tengah sesi
const prayer = ref<PrayerTimes | null>(null);
const prayerNotice = computed(() => {
  if (!prayer.value) return null;
  const now = new Date();
  const next = getNextPrayer(prayer.value.timings, now);
  if (!next) return null;
  const windowMs = running.value
    ? timer.remainingMs.value
    : timer.state.value.plannedSeconds * 1000;
  const inMs = Date.parse(next.at) - now.getTime();
  if (inMs > windowMs) return null;
  return `Waktu ${next.label} masuk pukul ${formatTime(next.at, timezone.value)} (${Math.max(1, Math.round(inMs / 60000))} menit lagi), sebelum sesi ini selesai.`;
});

onMounted(async () => {
  const [open] = await Promise.all([
    tasksApi.list({ limit: 100 }).catch(() => null),
    loadHistory(),
  ]);
  tasks.value = (open?.items ?? []).sort((a, b) => Number(b.focusToday) - Number(a.focusToday));
  if (session.user?.latitude != null)
    prayer.value = await prayerTimesApi.get(today.value).catch(() => null);
});
</script>

<template>
  <div class="mx-auto grid grid-cols-1 max-w-5xl gap-6 lg:grid-cols-[1.1fr_1fr]">
    <header class="lg:col-span-2">
      <h1 class="text-2xl font-semibold">Fokus</h1>
      <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Satu tugas, satu sesi. Timer tetap akurat meski tab berpindah atau halaman dimuat ulang.
      </p>
    </header>

    <UiCard>
      <div
        role="group"
        aria-label="Mode"
        class="mx-auto mb-4 flex w-fit rounded-lg bg-stone-100 p-0.5 dark:bg-stone-800"
      >
        <button
          v-for="m in ['focus', 'break'] as const"
          :key="m"
          type="button"
          :disabled="!idle"
          :aria-pressed="timer.state.value.mode === m"
          :class="[
            'rounded-md px-4 py-1.5 text-sm disabled:cursor-not-allowed',
            timer.state.value.mode === m
              ? 'bg-white font-medium shadow-xs dark:bg-stone-700'
              : 'text-stone-600 dark:text-stone-400',
          ]"
          @click="timer.setMode(m)"
        >
          {{ m === 'focus' ? 'Fokus' : 'Istirahat' }}
        </button>
      </div>

      <FocusRing
        :remaining-ms="timer.remainingMs.value"
        :progress="timer.progress.value"
        :mode="timer.state.value.mode"
        :running="running"
      />

      <div class="mt-5 flex justify-center gap-2">
        <UiButton v-if="idle" class="min-w-32" @click="timer.start()">Mulai</UiButton>
        <UiButton v-else-if="running" variant="secondary" class="min-w-32" @click="timer.pause()"
          >Jeda</UiButton
        >
        <UiButton v-else class="min-w-32" @click="timer.resume()">Lanjutkan</UiButton>
        <UiButton v-if="!idle" variant="ghost" @click="timer.stop()">
          {{ timer.state.value.mode === 'focus' ? 'Hentikan' : 'Lewati istirahat' }}
        </UiButton>
      </div>

      <UiAlert v-if="prayerNotice" tone="warning" class="mt-4">{{ prayerNotice }}</UiAlert>
      <UiAlert v-if="message" :tone="message.tone" class="mt-4">{{ message.text }}</UiAlert>

      <div class="mt-6 space-y-4 border-t border-stone-100 pt-4 dark:border-stone-800">
        <UiSelect v-model="taskId" label="Tugas yang dikerjakan" :options="taskOptions" />
        <fieldset>
          <legend class="mb-1 text-sm font-medium text-stone-700 dark:text-stone-300">
            Durasi (fokus / istirahat)
          </legend>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="p in FOCUS_PRESETS"
              :key="p.id"
              type="button"
              :disabled="!idle"
              :aria-pressed="activePreset === p.id"
              :class="[
                'rounded-lg border px-3 py-1.5 text-sm tabular-nums disabled:cursor-not-allowed disabled:opacity-50',
                activePreset === p.id
                  ? 'border-brand-600 bg-brand-50 font-medium text-brand-800 dark:bg-brand-900/40 dark:text-brand-100'
                  : 'border-stone-300 dark:border-stone-700',
              ]"
              @click="
                timer.setConfig({ focusMinutes: p.focusMinutes, breakMinutes: p.breakMinutes })
              "
            >
              {{ p.label }} menit
            </button>
          </div>
        </fieldset>
      </div>
    </UiCard>

    <div class="space-y-6">
      <UiCard title="Hari ini">
        <dl class="grid grid-cols-2 gap-3">
          <div class="rounded-xl bg-stone-50 p-3 dark:bg-stone-800/60">
            <dt class="text-xs text-stone-500 dark:text-stone-400">Menit fokus</dt>
            <dd class="mt-1 text-2xl font-semibold tabular-nums" data-testid="focus-today-minutes">
              {{ todayStats.minutes }}
            </dd>
          </div>
          <div class="rounded-xl bg-stone-50 p-3 dark:bg-stone-800/60">
            <dt class="text-xs text-stone-500 dark:text-stone-400">Sesi tuntas</dt>
            <dd class="mt-1 text-2xl font-semibold tabular-nums">{{ todayStats.completed }}</dd>
          </div>
        </dl>
        <ul
          v-if="todayStats.items.length"
          class="mt-4 divide-y divide-stone-100 text-sm dark:divide-stone-800"
        >
          <li
            v-for="s in todayStats.items"
            :key="s.id"
            class="flex items-center justify-between gap-3 py-2"
          >
            <span class="min-w-0 truncate">
              <span class="text-stone-500 tabular-nums dark:text-stone-400">{{
                formatTime(s.startedAt, timezone)
              }}</span>
              · {{ s.taskTitle ?? s.label ?? 'Sesi fokus' }}
            </span>
            <span class="shrink-0 tabular-nums">
              {{ Math.round(s.focusedSeconds / 60) }} mnt
              <span
                v-if="s.status === 'cancelled'"
                class="text-xs text-stone-500 dark:text-stone-400"
                >(dihentikan)</span
              >
            </span>
          </li>
        </ul>
      </UiCard>

      <UiCard
        v-if="history"
        title="7 hari terakhir"
        :description="`${Math.round(history.summary.totalFocusedSeconds / 60)} menit, ${history.summary.completedSessions} sesi tuntas`"
      >
        <FocusWeekChart :summary="history.summary" :today="today" />
      </UiCard>
    </div>
  </div>
</template>
