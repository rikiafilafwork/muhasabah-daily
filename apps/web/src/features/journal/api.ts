import type { AiStatus, JournalEntry, JournalSummary, Paginated } from '@muhasabah/shared';
import { http } from '@/api/http';

export const journalApi = {
  list: (q: { from?: string; to?: string } = {}) =>
    http.get<Paginated<JournalSummary>>('/journal', { query: q }),
  get: (date: string) => http.get<JournalEntry>(`/journal/${date}`),
  save: (date: string, rawText: string) => http.put<JournalEntry>(`/journal/${date}`, { rawText }),
  polish: (date: string) => http.post<JournalEntry>(`/journal/${date}/polish`),
  discardPolish: (date: string) => http.delete<JournalEntry>(`/journal/${date}/polish`),
  aiStatus: () => http.get<AiStatus>('/ai/status'),
};
