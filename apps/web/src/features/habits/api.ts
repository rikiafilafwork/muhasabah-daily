import type {
  CreateHabitInput,
  Habit,
  HabitInsights,
  HabitTemplate,
  Paginated,
  UpdateHabitInput,
} from '@muhasabah/shared';
import { http } from '@/api/http';

export const habitsApi = {
  list: (q: { from?: string; to?: string; includeInactive?: boolean } = {}) =>
    http.get<Paginated<Habit>>('/habits', { query: q }),
  create: (input: CreateHabitInput) => http.post<Habit>('/habits', input),
  update: (id: string, input: UpdateHabitInput) => http.patch<Habit>(`/habits/${id}`, input),
  remove: (id: string) => http.delete<void>(`/habits/${id}`),
  setLog: (id: string, date: string, done: boolean) =>
    http.put<{ habitId: string; date: string; done: boolean }>(`/habits/${id}/logs/${date}`, {
      done,
    }),
  insights: (q: { from?: string; to?: string }) =>
    http.get<HabitInsights>('/habits/insights', { query: q }),
  templates: () => http.get<Paginated<HabitTemplate>>('/habit-templates'),
};
