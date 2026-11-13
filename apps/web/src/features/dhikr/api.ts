import type { DhikrGroup, DhikrList, DhikrSummary } from '@muhasabah/shared';
import { http } from '@/api/http';

export const dhikrApi = {
  list: (group: DhikrGroup, date?: string) =>
    http.get<DhikrList>('/dhikr', { query: { group, date } }),
  summary: (date?: string) => http.get<DhikrSummary>('/dhikr/summary', { query: { date } }),
  setCount: (id: string, date: string, count: number) =>
    http.put<{ dhikrId: string; date: string; count: number }>(`/dhikr/${id}/logs/${date}`, {
      count,
    }),
};
