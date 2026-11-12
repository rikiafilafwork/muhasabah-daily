import { defineStore } from 'pinia';
import { ref } from 'vue';
import { addDays, type PrayerTimes } from '@muhasabah/shared';
import { ApiError } from '@/api/http';
import { prayerTimesApi } from '../api';

/** Jadwal sholat hari ini dan esok (untuk Subuh berikutnya setelah Isya). */
export const usePrayerTimesStore = defineStore('prayer-times', () => {
  const today = ref<PrayerTimes | null>(null);
  const tomorrow = ref<PrayerTimes | null>(null);
  const loading = ref(false);
  const error = ref<ApiError | null>(null);

  async function load(date: string) {
    loading.value = true;
    error.value = null;
    try {
      today.value = await prayerTimesApi.get(date);
      if (tomorrow.value?.date !== addDays(date, 1)) tomorrow.value = null;
    } catch (err) {
      today.value = null;
      error.value =
        err instanceof ApiError
          ? err
          : new ApiError({
              statusCode: 0,
              code: 'NETWORK_ERROR',
              message: 'Gagal memuat waktu sholat',
            });
    } finally {
      loading.value = false;
    }
  }

  async function ensureTomorrow() {
    if (!today.value) return;
    const date = addDays(today.value.date, 1);
    if (tomorrow.value?.date === date) return;
    try {
      tomorrow.value = await prayerTimesApi.get(date);
    } catch {
      tomorrow.value = null;
    }
  }

  function reset() {
    today.value = null;
    tomorrow.value = null;
    error.value = null;
  }

  return { today, tomorrow, loading, error, load, ensureTomorrow, reset };
});
