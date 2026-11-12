import type {
  CreateGoalInput,
  Goal,
  Paginated,
  SetGoalHabitsInput,
  UpdateGoalInput,
} from '@muhasabah/shared';
import { http } from '@/api/http';

export const goalsApi = {
  list: () => http.get<Paginated<Goal>>('/goals'),
  create: (input: CreateGoalInput) => http.post<Goal>('/goals', input),
  update: (id: string, input: UpdateGoalInput) => http.patch<Goal>(`/goals/${id}`, input),
  setHabits: (id: string, input: SetGoalHabitsInput) =>
    http.put<Goal>(`/goals/${id}/habits`, input),
  remove: (id: string) => http.delete<void>(`/goals/${id}`),
};
