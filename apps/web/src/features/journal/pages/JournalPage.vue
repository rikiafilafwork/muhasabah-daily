<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  addDays,
  isoDateSchema,
  JOURNAL_MAX_LENGTH,
  type AiStatus,
  type JournalEntry,
  type JournalSummary,
} from '@muhasabah/shared';
import { ApiError } from '@/api/http';
import { useUserClock } from '@/features/auth';
import { formatLongDate, formatShortDate, UiAlert, UiButton, UiCard } from '@/shared';
import { journalApi } from '../api';

const AUTOSAVE_MS = 1500;
const POLL_MS = 1500;
const POLL_LIMIT_MS = 120_000;

const route = useRoute();
const router = useRouter();
const { today } = useUserClock();
const date = computed(() => {
  const d = isoDateSchema.safeParse(route.query.date);
  return d.success && d.data <= today.value ? d.data : today.value;
});

const entry = ref<JournalEntry | null>(null);
const text = ref('');
const saveState = ref<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
const message = ref<{ tone: 'error' | 'info'; text: string } | null>(null);
const history = ref<JournalSummary[]>([]);
const ai = ref<AiStatus | null>(null);

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pollTimer: ReturnType<typeof setTimeout> | null = null;

async function loadHistory() {
  history.value = (await journalApi.list().catch(() => ({ items: [] }))).items;
}

async function load() {
  stopPolling();
  message.value = null;
  try {
    entry.value = await journalApi.get(date.value);
    text.value = entry.value.rawText;
    saveState.value = 'idle';
    if (entry.value.polishStatus === 'pending') startPolling();
  } catch (err) {
    message.value = {
      tone: 'error',
      text: err instanceof ApiError ? err.message : 'Gagal memuat jurnal',
    };
  }
}

async function save() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  if (saveState.value !== 'dirty') return;
  saveState.value = 'saving';
  try {
    const saved = await journalApi.save(date.value, text.value);
    // Pertahankan ketikan yang masuk saat menyimpan.
    entry.value = { ...saved, rawText: text.value };
    saveState.value = saved.rawText === text.value ? 'saved' : 'dirty';
    if (saveState.value === 'dirty') scheduleSave();
    void loadHistory();
  } catch (err) {
    saveState.value = 'error';
    message.value = {
      tone: 'error',
      text: err instanceof ApiError ? err.message : 'Gagal menyimpan. Coba lagi.',
    };
  }
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(save, AUTOSAVE_MS);
}

function onInput() {
  saveState.value = 'dirty';
  scheduleSave();
}

// ---- AI Polish
let pollStarted = 0;
function startPolling() {
  stopPolling();
  pollStarted = Date.now();
  const tick = async () => {
    const e = await journalApi.get(date.value).catch(() => null);
    if (e) entry.value = { ...e, rawText: text.value };
    if (e?.polishStatus === 'pending' && Date.now() - pollStarted < POLL_LIMIT_MS)
      pollTimer = setTimeout(tick, POLL_MS);
    else if (e?.polishStatus === 'pending')
      message.value = {
        tone: 'info',
        text: 'AI Polish masih diproses. Buka lagi halaman ini nanti.',
      };
  };
  pollTimer = setTimeout(tick, POLL_MS);
}
function stopPolling() {
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = null;
}

const polishing = ref(false);
async function polish() {
  message.value = null;
  polishing.value = true;
  try {
    if (saveState.value === 'dirty') await save();
    entry.value = await journalApi.polish(date.value);
    startPolling();
    ai.value = await journalApi.aiStatus().catch(() => ai.value);
  } catch (err) {
    message.value = {
      tone: 'error',
      text: err instanceof ApiError ? err.message : 'AI Polish gagal',
    };
  } finally {
    polishing.value = false;
  }
}

function usePolished() {
  if (!entry.value?.polishedText) return;
  text.value = entry.value.polishedText;
  saveState.value = 'dirty';
  void save();
}

async function discard() {
  entry.value = await journalApi.discardPolish(date.value);
  text.value = entry.value.rawText || text.value;
}

const errorLabels: Record<string, string> = {
  AI_REFUSED: 'Model AI menolak merapikan teks ini.',
  AI_TRUNCATED: 'Jawaban AI terpotong. Coba dengan teks yang lebih pendek.',
  AI_EMPTY: 'AI tidak mengembalikan teks.',
  AI_UNAVAILABLE: 'Layanan AI tidak bisa dihubungi. Coba lagi nanti.',
  AI_CONFIG_ERROR: 'Kunci API AI di server tidak valid.',
  AI_REJECTED: 'Permintaan ditolak oleh penyedia AI.',
  AI_DISABLED: 'AI Polish tidak aktif di server.',
};

const statusText = computed(
  () =>
    ({
      idle: '',
      dirty: 'Belum disimpan',
      saving: 'Menyimpan…',
      saved: 'Tersimpan',
      error: 'Gagal menyimpan',
    })[saveState.value],
);
const canPolish = computed(
  () =>
    ai.value?.enabled &&
    text.value.trim().length > 0 &&
    text.value.length <= (ai.value?.maxInputChars ?? 0),
);

watch(date, load);
onMounted(async () => {
  await Promise.all([
    load(),
    loadHistory(),
    journalApi
      .aiStatus()
      .then((s) => (ai.value = s))
      .catch(() => null),
  ]);
});
onBeforeUnmount(() => {
  stopPolling();
  void save();
});

function go(d: string) {
  void save();
  void router.replace({ query: { date: d } });
}
</script>

<template>
  <div class="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[1fr_15rem]">
    <section class="min-w-0 space-y-4">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight">Jurnal</h1>
          <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">{{ formatLongDate(date) }}</p>
        </div>
        <div class="flex items-center gap-1">
          <UiButton variant="ghost" aria-label="Hari sebelumnya" @click="go(addDays(date, -1))"
            >‹</UiButton
          >
          <UiButton variant="ghost" :disabled="date === today" @click="go(today)"
            >Hari ini</UiButton
          >
          <UiButton
            variant="ghost"
            aria-label="Hari berikutnya"
            :disabled="date >= today"
            @click="go(addDays(date, 1))"
            >›</UiButton
          >
        </div>
      </header>

      <UiAlert v-if="message" :tone="message.tone">{{ message.text }}</UiAlert>

      <UiCard>
        <label
          for="journal-text"
          class="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300"
        >
          Muhasabah hari ini
        </label>
        <textarea
          id="journal-text"
          v-model="text"
          rows="12"
          :maxlength="JOURNAL_MAX_LENGTH"
          placeholder="Apa yang disyukuri hari ini? Apa yang perlu diperbaiki esok?"
          class="block w-full resize-y rounded-lg border border-stone-300 bg-white px-3 py-2 text-base leading-relaxed focus:outline-2 focus:outline-brand-600 dark:border-stone-700 dark:bg-stone-900"
          @input="onInput"
          @blur="save"
        />
        <div
          class="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400"
        >
          <span role="status" data-testid="journal-save-status">{{ statusText }}</span>
          <span class="tabular-nums">{{ text.length }} karakter</span>
        </div>

        <div v-if="ai?.enabled" class="mt-4 border-t border-stone-100 pt-4 dark:border-stone-800">
          <div class="flex flex-wrap items-center gap-3">
            <UiButton
              variant="secondary"
              :loading="polishing || entry?.polishStatus === 'pending'"
              :disabled="!canPolish"
              @click="polish"
            >
              {{ entry?.polishStatus === 'pending' ? 'Sedang dirapikan…' : 'Poles dengan AI' }}
            </UiButton>
            <span class="text-xs text-stone-500 dark:text-stone-400">
              {{ ai.usedToday }}/{{ ai.dailyLimit }} kali hari ini
            </span>
          </div>
          <p class="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Privasi: teks jurnal hanya dikirim ke penyedia AI ({{ ai.provider }}) saat kamu menekan
            tombol ini. Teks aslimu tidak pernah ditimpa.
          </p>
        </div>
        <p
          v-else-if="ai"
          class="mt-4 border-t border-stone-100 pt-4 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400"
        >
          AI Polish nonaktif. Untuk mengaktifkan, isi <code>AI_PROVIDER=anthropic</code> dan
          <code>AI_API_KEY</code> di <code>.env</code> server lalu jalankan ulang API.
        </p>
      </UiCard>

      <UiCard
        v-if="entry?.polishStatus === 'failed'"
        title="AI Polish gagal"
        :description="errorLabels[entry.polishError ?? ''] ?? 'Terjadi kesalahan.'"
      />

      <UiCard v-if="entry?.polishedText" title="Versi yang dirapikan AI" data-testid="polished">
        <UiAlert v-if="entry.polishStale" tone="warning" class="mb-3">
          Teks asli sudah diubah setelah dirapikan. Poles ulang bila ingin versi terbaru.
        </UiAlert>
        <p class="text-base leading-relaxed whitespace-pre-wrap">{{ entry.polishedText }}</p>
        <div class="mt-4 flex flex-wrap gap-2">
          <UiButton @click="usePolished">Pakai versi ini</UiButton>
          <UiButton variant="ghost" @click="discard">Buang</UiButton>
        </div>
      </UiCard>
    </section>

    <aside aria-label="Jurnal sebelumnya" class="min-w-0">
      <h2 class="mb-2 text-sm font-semibold text-stone-600 dark:text-stone-400">
        30 hari terakhir
      </h2>
      <ul class="space-y-1">
        <li v-for="h in history" :key="h.date">
          <button
            type="button"
            :class="[
              'w-full rounded-lg px-3 py-2 text-left text-sm',
              h.date === date
                ? 'bg-brand-50 dark:bg-brand-900/40'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800',
            ]"
            :aria-current="h.date === date ? 'date' : undefined"
            @click="go(h.date)"
          >
            <span class="block font-medium">{{ formatShortDate(h.date) }}</span>
            <span class="block truncate text-xs text-stone-500 dark:text-stone-400">{{
              h.preview
            }}</span>
          </button>
        </li>
        <li v-if="!history.length" class="px-3 text-sm text-stone-500 dark:text-stone-400">
          Belum ada jurnal.
        </li>
      </ul>
    </aside>
  </div>
</template>
