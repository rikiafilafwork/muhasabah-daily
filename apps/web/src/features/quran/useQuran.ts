import { ref } from 'vue';
import type { Ayah, Surah } from '@muhasabah/shared';
import { ApiError } from '@/api/http';
import { quranApi } from './api';

let surahsCache: Promise<Surah[]> | null = null;
const ayahCache = new Map<string, Promise<Ayah[]>>();

/** Daftar surah (statis), dimuat sekali per sesi halaman. */
export function loadSurahs(): Promise<Surah[]> {
  surahsCache ??= quranApi
    .surahs()
    .then((r) => r.items)
    .catch((err) => {
      surahsCache = null;
      throw err;
    });
  return surahsCache;
}

/** Ayat dalam rentang, di-cache per rentang. */
export function loadAyahs(surahId: number, from: number, to: number): Promise<Ayah[]> {
  const key = `${surahId}:${from}-${to}`;
  let p = ayahCache.get(key);
  if (!p) {
    p = quranApi
      .ayahs(surahId, from, to)
      .then((r) => r.items)
      .catch((err) => {
        ayahCache.delete(key);
        throw err;
      });
    ayahCache.set(key, p);
  }
  return p;
}

/** Status data Al-Qur'an dan daftar surah untuk komponen pemilih. */
export function useSurahs() {
  const surahs = ref<Surah[]>([]);
  const notSeeded = ref(false);
  const error = ref<string | null>(null);
  const loading = ref(true);
  loadSurahs()
    .then((s) => (surahs.value = s))
    .catch((err) => {
      if (err instanceof ApiError && err.code === 'QURAN_NOT_SEEDED') notSeeded.value = true;
      else error.value = err instanceof Error ? err.message : "Gagal memuat data Al-Qur'an";
    })
    .finally(() => (loading.value = false));
  return { surahs, notSeeded, error, loading };
}
