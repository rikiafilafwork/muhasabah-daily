import type {
  CreateMemorizationPlanInput,
  MemorizationPlan,
  Paginated,
  SetStagesInput,
  UpdateMemorizationPlanInput,
} from '@muhasabah/shared';
import { http } from '@/api/http';

export const memorizationApi = {
  list: () => http.get<Paginated<MemorizationPlan>>('/memorization-plans'),
  get: (id: string) => http.get<MemorizationPlan>(`/memorization-plans/${id}`),
  create: (input: CreateMemorizationPlanInput) =>
    http.post<MemorizationPlan>('/memorization-plans', input),
  update: (id: string, input: UpdateMemorizationPlanInput) =>
    http.patch<MemorizationPlan>(`/memorization-plans/${id}`, input),
  setStages: (id: string, input: SetStagesInput) =>
    http.put<MemorizationPlan>(`/memorization-plans/${id}/stages`, input),
  remove: (id: string) => http.delete<void>(`/memorization-plans/${id}`),
};
