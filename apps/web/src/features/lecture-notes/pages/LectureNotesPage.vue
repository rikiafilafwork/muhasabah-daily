<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { LectureNoteSummary } from '@muhasabah/shared';
import { ApiError } from '@/api/http';
import { formatShortDate, UiAlert, UiButton } from '@/shared';
import { lectureNotesApi } from '../api';

const notes = ref<LectureNoteSummary[]>([]);
const nextCursor = ref<string | null>(null);
const q = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

async function load(append = false) {
  loading.value = true;
  error.value = null;
  try {
    const page = await lectureNotesApi.list({
      q: q.value.trim() || undefined,
      cursor: append ? (nextCursor.value ?? undefined) : undefined,
    });
    notes.value = append ? [...notes.value, ...page.items] : page.items;
    nextCursor.value = page.nextCursor;
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Gagal memuat catatan';
  } finally {
    loading.value = false;
  }
}

let timer: ReturnType<typeof setTimeout> | null = null;
watch(q, () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => load(), 300);
});
onMounted(() => load());
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-5">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold">Catatan Kajian</h1>
        <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Ringkasan kajian dengan rujukan ayat.
        </p>
      </div>
      <RouterLink
        to="/lecture-notes/new"
        class="inline-flex rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
      >
        Catatan baru
      </RouterLink>
    </header>

    <div>
      <label for="note-search" class="sr-only">Cari catatan</label>
      <input
        id="note-search"
        v-model="q"
        type="search"
        placeholder="Cari judul, pemateri, isi, atau tag…"
        class="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-900"
      />
    </div>

    <UiAlert v-if="error" tone="error">{{ error }}</UiAlert>

    <ul v-if="notes.length" class="space-y-3" data-testid="note-list">
      <li v-for="n in notes" :key="n.id">
        <RouterLink
          :to="`/lecture-notes/${n.id}`"
          class="block rounded-2xl border border-stone-200 bg-white p-4 shadow-xs hover:border-brand-300 dark:border-stone-800 dark:bg-stone-900"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="font-semibold">{{ n.title }}</h2>
            <span class="text-xs text-stone-500 dark:text-stone-400">{{
              formatShortDate(n.date)
            }}</span>
          </div>
          <p v-if="n.speaker" class="text-sm text-stone-600 dark:text-stone-400">{{ n.speaker }}</p>
          <p v-if="n.preview" class="mt-1 line-clamp-2 text-sm text-stone-600 dark:text-stone-300">
            {{ n.preview }}
          </p>
          <div
            v-if="n.tags.length || n.ayahRefs.length"
            class="mt-2 flex flex-wrap gap-1.5 text-xs"
          >
            <span
              v-for="t in n.tags"
              :key="t"
              class="rounded-full bg-stone-100 px-2 py-0.5 dark:bg-stone-800"
              >#{{ t }}</span
            >
            <span
              v-if="n.ayahRefs.length"
              class="rounded-full bg-brand-50 px-2 py-0.5 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100"
            >
              {{ n.ayahRefs.length }} rujukan ayat
            </span>
          </div>
        </RouterLink>
      </li>
    </ul>
    <p
      v-else-if="!loading"
      class="rounded-2xl border border-dashed border-stone-300 py-12 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400"
    >
      {{ q ? 'Tidak ada catatan yang cocok.' : 'Belum ada catatan kajian.' }}
    </p>
    <div v-if="nextCursor" class="text-center">
      <UiButton variant="ghost" :loading="loading" @click="load(true)">Muat lebih banyak</UiButton>
    </div>
  </div>
</template>
