import type {
  CreateProjectInput,
  CreateTaskInput,
  Paginated,
  Project,
  Task,
  TasksQuery,
  UpdateProjectInput,
  UpdateTaskInput,
} from '@muhasabah/shared';
import { http } from '@/api/http';

export const tasksApi = {
  list: (query: TasksQuery) => http.get<Paginated<Task>>('/tasks', { query: { ...query } }),
  create: (input: CreateTaskInput) => http.post<Task>('/tasks', input),
  update: (id: string, input: UpdateTaskInput) => http.patch<Task>(`/tasks/${id}`, input),
  remove: (id: string) => http.delete<void>(`/tasks/${id}`),
};

export const projectsApi = {
  list: (includeArchived = false) =>
    http.get<Paginated<Project>>('/projects', {
      query: { includeArchived: includeArchived || undefined },
    }),
  create: (input: CreateProjectInput) => http.post<Project>('/projects', input),
  update: (id: string, input: UpdateProjectInput) => http.patch<Project>(`/projects/${id}`, input),
  remove: (id: string) => http.delete<void>(`/projects/${id}`),
};
