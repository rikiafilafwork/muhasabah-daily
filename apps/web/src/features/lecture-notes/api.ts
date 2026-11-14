import type {
  CreateLectureNoteInput,
  LectureNote,
  LectureNoteSummary,
  Paginated,
  UpdateLectureNoteInput,
} from '@muhasabah/shared';
import { http } from '@/api/http';

export const lectureNotesApi = {
  list: (q: { q?: string; cursor?: string; limit?: number } = {}) =>
    http.get<Paginated<LectureNoteSummary>>('/lecture-notes', { query: q }),
  get: (id: string) => http.get<LectureNote>(`/lecture-notes/${id}`),
  create: (input: CreateLectureNoteInput) => http.post<LectureNote>('/lecture-notes', input),
  update: (id: string, input: UpdateLectureNoteInput) =>
    http.patch<LectureNote>(`/lecture-notes/${id}`, input),
  remove: (id: string) => http.delete<void>(`/lecture-notes/${id}`),
};
