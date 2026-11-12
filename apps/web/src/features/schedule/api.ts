import type {
  CalendarEvent,
  CreateEventInput,
  Paginated,
  UpdateEventInput,
} from '@muhasabah/shared';
import { http } from '@/api/http';

export const eventsApi = {
  list: (from: string, to: string) =>
    http.get<Paginated<CalendarEvent>>('/events', { query: { from, to } }),
  create: (input: CreateEventInput) => http.post<CalendarEvent>('/events', input),
  update: (id: string, input: UpdateEventInput) =>
    http.patch<CalendarEvent>(`/events/${id}`, input),
  remove: (id: string) => http.delete<void>(`/events/${id}`),
};
