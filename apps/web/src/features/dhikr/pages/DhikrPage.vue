<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  DHIKR_GROUP_LABELS,
  DHIKR_GROUPS,
  suggestDhikrGroup,
  type DhikrGroup,
} from '@muhasabah/shared';
import { useSessionStore, useUserClock } from '@/features/auth';
import { formatLongDate, UiAlert, UiButton } from '@/shared';
import DhikrCard from '../components/DhikrCard.vue';
import { useDhikr } from '../composables/useDhikr';

const PREFS_KEY = 'md-dhikr-prefs';
const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const { today, timezone } = useUserClock();

function localHour(): number {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone: timezone.value,
    }).format(new Date()),
  );
}
const group = computed<DhikrGroup>(() =>
  DHIKR_GROUPS.includes(route.query.group as DhikrGroup)
    ? (route.query.group as DhikrGroup)
    : suggestDhikrGroup(localHour()),
);
const dhikr = useDhikr(session.user!.id, group, today);

// Preferensi tampilan per perangkat.
const prefs = ref({ latin: true, translation: true });
try {
  Object.assign(prefs.value, JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}'));
} catch {
  /* abaikan */
}
watch(
  prefs,
  (p) => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(p));
    } catch {
      /* abaikan */
    }
  },
  { deep: true },
);

const statusText = computed(() => {
  switch (dhikr.status.value) {
    case 'saving':
      return 'Menyimpan…';
    case 'pending':
      return 'Akan disimpan';
    case 'offline':
      return 'Offline — hitungan disimpan di perangkat dan dikirim saat online';
    case 'error':
      return 'Sebagian hitungan ditolak server';
    default:
      return 'Tersimpan';
  }
});
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-5">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Dzikir</h1>
        <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">{{ formatLongDate(today) }}</p>
      </div>
      <p
        role="status"
        :class="[
          'text-xs',
          dhikr.status.value === 'offline' || dhikr.status.value === 'error'
            ? 'text-amber-700 dark:text-amber-400'
            : 'text-stone-500 dark:text-stone-400',
        ]"
        data-testid="dhikr-sync-status"
      >
        {{ statusText }}
      </p>
    </header>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <div
        role="tablist"
        aria-label="Waktu dzikir"
        class="flex rounded-lg bg-stone-100 p-0.5 dark:bg-stone-800"
      >
        <button
          v-for="g in DHIKR_GROUPS"
          :key="g"
          role="tab"
          type="button"
          :aria-selected="group === g"
          :class="[
            'rounded-md px-3 py-1.5 text-sm',
            group === g
              ? 'bg-white font-medium shadow-xs dark:bg-stone-700'
              : 'text-stone-600 dark:text-stone-400',
          ]"
          @click="router.replace({ query: { group: g } })"
        >
          {{ DHIKR_GROUP_LABELS[g] }}
        </button>
      </div>
      <div class="flex gap-4 text-sm">
        <label class="flex items-center gap-1.5">
          <input v-model="prefs.latin" type="checkbox" class="size-4 accent-brand-700" /> Latin
        </label>
        <label class="flex items-center gap-1.5">
          <input v-model="prefs.translation" type="checkbox" class="size-4 accent-brand-700" />
          Terjemah
        </label>
      </div>
    </div>

    <div v-if="dhikr.items.value.length" class="flex items-center gap-3">
      <div
        class="h-2 flex-1 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800"
        role="progressbar"
        :aria-valuenow="dhikr.completed.value"
        aria-valuemin="0"
        :aria-valuemax="dhikr.items.value.length"
        :aria-label="`${DHIKR_GROUP_LABELS[group]} tuntas`"
      >
        <div
          class="h-full rounded-full bg-brand-600 transition-[width]"
          :style="{ width: `${(dhikr.completed.value / dhikr.items.value.length) * 100}%` }"
        />
      </div>
      <span class="text-sm tabular-nums" data-testid="dhikr-progress">
        {{ dhikr.completed.value }}/{{ dhikr.items.value.length }} tuntas
      </span>
    </div>

    <UiAlert v-if="dhikr.error.value" tone="error">
      {{ dhikr.error.value }}
      <UiButton variant="ghost" class="ml-2" @click="dhikr.load()">Coba lagi</UiButton>
    </UiAlert>

    <div class="space-y-4">
      <DhikrCard
        v-for="item in dhikr.items.value"
        :key="item.id"
        :item="item"
        :show-latin="prefs.latin"
        :show-translation="prefs.translation"
        @increment="dhikr.increment(item)"
        @decrement="dhikr.decrement(item)"
        @reset="dhikr.reset(item)"
      />
    </div>

    <p class="text-xs text-stone-500 dark:text-stone-400">
      Teks ayat diambil dari AlQuran Cloud (rasm Utsmani, terjemah Kemenag). Teks dzikir dari hadis
      disusun dari sumber yang umum dipakai dan sedang ditinjau; lihat DATA_SOURCES.md di
      repositori.
    </p>
  </div>
</template>
