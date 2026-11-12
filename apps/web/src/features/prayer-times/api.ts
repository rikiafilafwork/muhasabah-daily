import type { NextPrayer, PrayerTimes } from '@muhasabah/shared';
import { http } from '@/api/http';

export const prayerTimesApi = {
  get: (date?: string) => http.get<PrayerTimes>('/prayer-times', { query: { date } }),
  next: () => http.get<NextPrayer>('/prayer-times/next'),
};
