import type { Ayah, Paginated, Surah } from '@muhasabah/shared';
import { http } from '@/api/http';

export const quranApi = {
  status: () => http.get<{ seeded: boolean; surahs: number; ayahs: number }>('/quran/status'),
  surahs: () => http.get<Paginated<Surah>>('/quran/surahs'),
  ayahs: (surahId: number, from?: number, to?: number) =>
    http.get<{ surah: Surah; items: Ayah[]; nextCursor: null }>(`/quran/surahs/${surahId}/ayahs`, {
      query: { from, to },
    }),
};
