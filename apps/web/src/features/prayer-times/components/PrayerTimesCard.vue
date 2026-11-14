<script setup lang="ts">
import { computed, watch } from 'vue';
import {
  ErrorCode,
  getCurrentPrayer,
  getNextPrayer,
  PRAYER_KEYS,
  PRAYER_LABELS,
  toLocalDate,
} from '@muhasabah/shared';
import { useSessionStore } from '@/features/auth';
import {
  formatDurationWords,
  formatLongDate,
  formatTime,
  UiAlert,
  UiButton,
  UiCard,
  useCountdown,
  useNow,
} from '@/shared';
import { usePrayerTimesStore } from '../stores/prayer-times.store';

const session = useSessionStore();
const store = usePrayerTimesStore();
const timezone = computed(() => session.user?.timezone ?? 'Asia/Jakarta');
const hasLocation = computed(() => session.user?.latitude != null);
const now = useNow(1000);

// Sholat berikutnya dihitung di klien dari jadwal yang sudah ada (ARCHITECTURE.md 8.1).
const next = computed(() => {
  const at = new Date(now.value);
  if (store.today) {
    const n = getNextPrayer(store.today.timings, at);
    if (n) return n;
  }
  if (store.tomorrow) return getNextPrayer(store.tomorrow.timings, at);
  return null;
});
const countdown = useCountdown(() => next.value?.at, now);
const localToday = computed(() => toLocalDate(new Date(now.value), timezone.value));
const current = computed(() =>
  store.today ? getCurrentPrayer(store.today.timings, new Date(now.value)) : null,
);

// Muat ulang saat lokasi/zona waktu berubah atau hari berganti.
watch(
  [localToday, () => session.user?.latitude, () => session.user?.longitude, timezone],
  ([date]) => {
    if (hasLocation.value) void store.load(date);
    else store.reset();
  },
  { immediate: true },
);

watch(
  () => store.today && !getNextPrayer(store.today.timings, new Date(now.value)),
  (afterIsha) => {
    if (afterIsha) void store.ensureTomorrow();
  },
  { immediate: true },
);
</script>

<template>
  <UiCard>
    <div v-if="!hasLocation" class="space-y-3">
      <h2 class="text-base font-semibold">Waktu sholat</h2>
      <p class="text-sm text-stone-600 dark:text-stone-400">
        Atur lokasimu untuk melihat jadwal sholat dan hitung mundur.
      </p>
      <RouterLink
        to="/settings"
        class="inline-flex rounded-full bg-brand-700 px-4.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-800"
      >
        Atur lokasi
      </RouterLink>
    </div>

    <div v-else-if="store.error && !store.today" class="space-y-3">
      <h2 class="text-base font-semibold">Waktu sholat</h2>
      <UiAlert tone="warning">
        {{
          store.error.code === ErrorCode.PRAYER_TIMES_UNAVAILABLE
            ? 'Waktu sholat sedang tidak tersedia. Fitur lain tetap bisa dipakai.'
            : store.error.message
        }}
      </UiAlert>
      <UiButton variant="secondary" @click="store.load(localToday)">Coba lagi</UiButton>
    </div>

    <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.4fr]">
      <div
        class="relative isolate flex flex-col justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-6 text-white shadow-lg shadow-brand-900/20"
        aria-live="polite"
      >
        <div
          class="absolute -top-16 -right-10 -z-10 size-48 rounded-full bg-gold-400/30 blur-2xl"
          aria-hidden="true"
        />
        <div
          class="absolute -bottom-20 -left-10 -z-10 size-48 rounded-full bg-brand-400/25 blur-2xl"
          aria-hidden="true"
        />
        <p class="text-sm text-brand-100">
          {{ session.user?.city ?? 'Lokasimu' }} · {{ formatLongDate(localToday) }}
        </p>
        <template v-if="next">
          <p
            class="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-brand-50 ring-1 ring-white/15"
          >
            <span class="size-1.5 rounded-full bg-gold-300" aria-hidden="true" />
            Menuju {{ next.label }}
          </p>
          <p
            class="mt-1 font-display text-5xl font-semibold tracking-tight tabular-nums"
            :aria-label="`${formatDurationWords(countdown.remainingSeconds.value ?? 0)} lagi menuju ${next.label}`"
            data-testid="countdown"
          >
            {{ countdown.formatted.value }}
          </p>
          <p class="mt-1 text-sm text-brand-100">pukul {{ formatTime(next.at, timezone) }}</p>
        </template>
        <p v-else class="mt-3 text-sm text-brand-100">Memuat jadwal…</p>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <h2 class="font-display text-lg font-semibold">Jadwal hari ini</h2>
          <span v-if="store.today?.stale" class="text-xs text-amber-700 dark:text-amber-400">
            Perkiraan (sumber tidak tersedia)
          </span>
        </div>
        <ul v-if="store.today" class="space-y-0.5" data-testid="prayer-list">
          <li
            v-for="key in PRAYER_KEYS"
            :key="key"
            :class="[
              'flex items-center justify-between rounded-xl px-3 py-2 text-sm',
              key === 'sunrise' && 'text-stone-500 dark:text-stone-400',
              key === current &&
                'bg-brand-50 font-semibold text-brand-800 dark:bg-brand-900/40 dark:text-brand-100',
            ]"
            :aria-current="key === current ? 'time' : undefined"
          >
            <span>{{ PRAYER_LABELS[key] }}</span>
            <span class="tabular-nums">{{ formatTime(store.today.timings[key], timezone) }}</span>
          </li>
        </ul>
        <div v-else class="space-y-2" aria-hidden="true">
          <div
            v-for="i in 6"
            :key="i"
            class="h-8 animate-pulse rounded bg-stone-100 dark:bg-stone-800"
          />
        </div>
        <p class="mt-2 text-xs text-stone-500 dark:text-stone-400">
          Sumber: AlAdhan, metode {{ store.today?.method ?? 'Kemenag RI' }}.
        </p>
      </div>
    </div>
  </UiCard>
</template>
