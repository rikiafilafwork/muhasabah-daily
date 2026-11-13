<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  isoDateSchema,
  OBLIGATORY_PRAYERS,
  PRAYER_LABELS,
  type CalendarEvent,
  type PrayerTimes,
} from '@muhasabah/shared';
import { ApiError } from '@/api/http';
import { useSessionStore, useUserClock } from '@/features/auth';
import { prayerTimesApi } from '@/features/prayer-times';
import {
  formatLongDate,
  formatMonthYear,
  formatShortDate,
  formatTime,
  formatWeekdayShort,
  UiAlert,
  UiButton,
  UiCard,
} from '@/shared';
import { eventsApi } from '../api';
import {
  datesToInstantRange,
  eventTimeLabel,
  groupByDate,
  shiftAnchor,
  visibleDates,
  type CalendarView,
} from '../calendar';
import EventChip from '../components/EventChip.vue';
import EventDialog from '../components/EventDialog.vue';

const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const { today, timezone } = useUserClock();

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: 'day', label: 'Hari' },
  { id: 'week', label: 'Minggu' },
  { id: 'month', label: 'Bulan' },
];
const view = computed<CalendarView>(() =>
  VIEWS.some((v) => v.id === route.query.view) ? (route.query.view as CalendarView) : 'week',
);
const anchor = computed(() => {
  const d = isoDateSchema.safeParse(route.query.date);
  return d.success ? d.data : today.value;
});
function navigate(next: { view?: CalendarView; date?: string }) {
  void router.replace({
    query: { view: next.view ?? view.value, date: next.date ?? anchor.value },
  });
}

const dates = computed(() => visibleDates(view.value, anchor.value));
const events = ref<CalendarEvent[]>([]);
const byDate = computed(() => groupByDate(events.value, timezone.value));
const loading = ref(false);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const { from, to } = datesToInstantRange(dates.value[0]!, dates.value.at(-1)!, timezone.value);
    events.value = (await eventsApi.list(from, to)).items;
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Gagal memuat agenda';
  } finally {
    loading.value = false;
  }
}
watch([dates, timezone], load, { immediate: true });

// Tampilan hari menyisipkan waktu sholat agar agenda tersusun di sekitarnya.
const prayer = ref<PrayerTimes | null>(null);
watch(
  [view, anchor, () => session.user?.latitude],
  async () => {
    prayer.value = null;
    if (view.value !== 'day' || session.user?.latitude == null) return;
    prayer.value = await prayerTimesApi.get(anchor.value).catch(() => null);
  },
  { immediate: true },
);

type AgendaRow =
  | { kind: 'event'; at: string; event: CalendarEvent }
  | { kind: 'prayer'; at: string; label: string };
const dayAgenda = computed<AgendaRow[]>(() => {
  const list = byDate.value.get(anchor.value) ?? [];
  const rows: AgendaRow[] = list
    .filter((e) => !e.allDay)
    .map((e) => ({ kind: 'event', at: e.startAt, event: e }));
  if (prayer.value) {
    for (const p of OBLIGATORY_PRAYERS) {
      rows.push({ kind: 'prayer', at: prayer.value.timings[p], label: PRAYER_LABELS[p] });
    }
  }
  return rows.sort((a, b) => a.at.localeCompare(b.at));
});
const allDayToday = computed(() => (byDate.value.get(anchor.value) ?? []).filter((e) => e.allDay));

const heading = computed(() => {
  if (view.value === 'day') return formatLongDate(anchor.value);
  if (view.value === 'month') return formatMonthYear(anchor.value);
  return `${formatShortDate(dates.value[0]!)} – ${formatShortDate(dates.value[6]!)}`;
});
const inMonth = (d: string) => d.slice(0, 7) === anchor.value.slice(0, 7);

const dialog = ref(false);
const editing = ref<CalendarEvent | null>(null);
const dialogDate = ref('');
function openEvent(event: CalendarEvent | null, date?: string) {
  editing.value = event;
  dialogDate.value = date ?? anchor.value;
  dialog.value = true;
}
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-4">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold">Jadwal</h1>
        <p class="mt-1 text-sm text-stone-500 dark:text-stone-400" aria-live="polite">
          {{ heading }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Tampilan"
          class="flex rounded-lg bg-stone-100 p-0.5 dark:bg-stone-800"
        >
          <button
            v-for="v in VIEWS"
            :key="v.id"
            type="button"
            :aria-pressed="view === v.id"
            :class="[
              'rounded-md px-3 py-1.5 text-sm',
              view === v.id
                ? 'bg-white font-medium shadow-xs dark:bg-stone-700'
                : 'text-stone-600 dark:text-stone-400',
            ]"
            @click="navigate({ view: v.id })"
          >
            {{ v.label }}
          </button>
        </div>
        <div class="flex">
          <UiButton
            variant="ghost"
            aria-label="Sebelumnya"
            @click="navigate({ date: shiftAnchor(view, anchor, -1) })"
            >‹</UiButton
          >
          <UiButton variant="ghost" @click="navigate({ date: today })">Hari ini</UiButton>
          <UiButton
            variant="ghost"
            aria-label="Berikutnya"
            @click="navigate({ date: shiftAnchor(view, anchor, 1) })"
            >›</UiButton
          >
        </div>
        <UiButton @click="openEvent(null)">Agenda baru</UiButton>
      </div>
    </header>

    <UiAlert v-if="error" tone="error">{{ error }}</UiAlert>

    <!-- Hari -->
    <UiCard v-if="view === 'day'">
      <div v-if="allDayToday.length" class="mb-3 space-y-1">
        <EventChip
          v-for="e in allDayToday"
          :key="e.id"
          :event="e"
          time="Sepanjang hari"
          @open="openEvent(e)"
        />
      </div>
      <ol v-if="dayAgenda.length" class="space-y-2" data-testid="day-agenda">
        <li v-for="(row, i) in dayAgenda" :key="i" class="flex gap-3">
          <span
            class="w-12 shrink-0 pt-1.5 text-right text-xs text-stone-500 tabular-nums dark:text-stone-400"
          >
            {{ formatTime(row.at, timezone) }}
          </span>
          <div class="min-w-0 flex-1">
            <EventChip
              v-if="row.kind === 'event'"
              :event="row.event"
              :time="eventTimeLabel(row.event, anchor, timezone)"
              @open="openEvent(row.event)"
            />
            <p
              v-else
              class="flex items-center gap-2 border-t border-dashed border-brand-300 pt-1 text-xs font-medium text-brand-700 dark:border-brand-800 dark:text-brand-500"
            >
              Waktu {{ row.label }}
            </p>
          </div>
        </li>
      </ol>
      <p
        v-else-if="!loading && !allDayToday.length"
        class="py-8 text-center text-sm text-stone-500 dark:text-stone-400"
      >
        Tidak ada agenda.
      </p>
    </UiCard>

    <!-- Minggu -->
    <div v-else-if="view === 'week'" class="grid grid-cols-1 gap-2 md:grid-cols-7">
      <section
        v-for="d in dates"
        :key="d"
        :aria-label="formatLongDate(d)"
        :class="[
          'min-h-32 rounded-xl border bg-white p-2 dark:bg-stone-900',
          d === today
            ? 'border-brand-600 dark:border-brand-500'
            : 'border-stone-200 dark:border-stone-800',
        ]"
      >
        <button
          type="button"
          class="mb-2 flex w-full items-baseline justify-between rounded px-1 text-left hover:bg-stone-50 dark:hover:bg-stone-800"
          @click="navigate({ view: 'day', date: d })"
        >
          <span class="text-xs text-stone-500 dark:text-stone-400">{{
            formatWeekdayShort(d)
          }}</span>
          <span
            :class="['text-sm font-semibold', d === today && 'text-brand-700 dark:text-brand-500']"
          >
            {{ Number(d.slice(8)) }}
          </span>
        </button>
        <div class="space-y-1">
          <EventChip
            v-for="e in byDate.get(d) ?? []"
            :key="e.id"
            :event="e"
            :time="eventTimeLabel(e, d, timezone)"
            @open="openEvent(e)"
          />
          <button
            type="button"
            class="w-full rounded py-1 text-xs text-stone-500 dark:text-stone-400 hover:bg-stone-50 hover:text-stone-600 dark:hover:bg-stone-800"
            :aria-label="`Tambah agenda ${formatLongDate(d)}`"
            @click="openEvent(null, d)"
          >
            +
          </button>
        </div>
      </section>
    </div>

    <!-- Bulan -->
    <div
      v-else
      class="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900"
    >
      <div
        class="grid grid-cols-7 border-b border-stone-200 text-center text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400"
      >
        <div v-for="d in dates.slice(0, 7)" :key="d" class="py-2">{{ formatWeekdayShort(d) }}</div>
      </div>
      <div class="grid grid-cols-7">
        <div
          v-for="d in dates"
          :key="d"
          :class="[
            'min-h-20 border-r border-b border-stone-100 p-1 sm:min-h-24 dark:border-stone-800',
            !inMonth(d) && 'bg-stone-50 dark:bg-stone-950/40',
          ]"
        >
          <button
            type="button"
            :class="[
              'mb-1 flex size-6 items-center justify-center rounded-full text-xs',
              d === today
                ? 'bg-brand-700 font-semibold text-white'
                : inMonth(d)
                  ? ''
                  : 'text-stone-500 dark:text-stone-400',
            ]"
            :aria-label="formatLongDate(d)"
            @click="navigate({ view: 'day', date: d })"
          >
            {{ Number(d.slice(8)) }}
          </button>
          <div class="space-y-0.5">
            <EventChip
              v-for="e in (byDate.get(d) ?? []).slice(0, 3)"
              :key="e.id"
              :event="e"
              compact
              @open="openEvent(e)"
            />
            <button
              v-if="(byDate.get(d)?.length ?? 0) > 3"
              type="button"
              class="px-1 text-xs text-stone-500 dark:text-stone-400 hover:underline"
              @click="navigate({ view: 'day', date: d })"
            >
              +{{ byDate.get(d)!.length - 3 }} lagi
            </button>
          </div>
        </div>
      </div>
    </div>

    <EventDialog
      v-model:open="dialog"
      :event="editing"
      :date="dialogDate"
      :timezone="timezone"
      @changed="load"
    />
  </div>
</template>
