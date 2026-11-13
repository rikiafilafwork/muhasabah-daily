import type { CreateFocusSessionInput, FocusSession, FocusSessionList } from '@muhasabah/shared';
import { http } from '@/api/http';

export const focusApi = {
  create: (input: CreateFocusSessionInput) => http.post<FocusSession>('/focus-sessions', input),
  list: (q: { from?: string; to?: string } = {}) =>
    http.get<FocusSessionList>('/focus-sessions', { query: q }),
  remove: (id: string) => http.delete<void>(`/focus-sessions/${id}`),
};
