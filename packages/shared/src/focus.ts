import { z } from 'zod';
import { dateRangeQuerySchema, idSchema, isoDateTimeSchema, optionalText } from './common';

export const FOCUS_STATUSES = ['completed', 'cancelled'] as const;
export type FocusStatus = (typeof FOCUS_STATUSES)[number];

/** Durasi sesi maksimum yang diterima (12 jam). */
export const FOCUS_MAX_SECONDS = 12 * 3600;
/** Toleransi selisih jam klien dan durasi terukur. */
export const FOCUS_TOLERANCE_SECONDS = 5;

export const FOCUS_PRESETS = [
  { id: 'pomodoro', label: '25 / 5', focusMinutes: 25, breakMinutes: 5 },
  { id: 'deep', label: '50 / 10', focusMinutes: 50, breakMinutes: 10 },
  { id: 'short', label: '15 / 3', focusMinutes: 15, breakMinutes: 3 },
] as const;

export const createFocusSessionSchema = z
  .object({
    startedAt: isoDateTimeSchema,
    endedAt: isoDateTimeSchema,
    /** Durasi yang direncanakan (detik). */
    plannedSeconds: z.number().int().min(60).max(FOCUS_MAX_SECONDS),
    /** Waktu fokus sebenarnya (detik), tanpa jeda. */
    focusedSeconds: z.number().int().min(0).max(FOCUS_MAX_SECONDS),
    status: z.enum(FOCUS_STATUSES),
    taskId: idSchema.nullable().optional(),
    label: optionalText(120),
  })
  .strict()
  .refine((v) => Date.parse(v.endedAt) >= Date.parse(v.startedAt), {
    message: 'Waktu selesai harus setelah waktu mulai',
    path: ['endedAt'],
  })
  .refine(
    (v) =>
      v.focusedSeconds <=
      (Date.parse(v.endedAt) - Date.parse(v.startedAt)) / 1000 + FOCUS_TOLERANCE_SECONDS,
    { message: 'Waktu fokus melebihi durasi sesi', path: ['focusedSeconds'] },
  );
export type CreateFocusSessionInput = z.input<typeof createFocusSessionSchema>;

export const FOCUS_MAX_RANGE_DAYS = 366;
export const focusSessionsQuerySchema = dateRangeQuerySchema(FOCUS_MAX_RANGE_DAYS);
export type FocusSessionsQuery = z.infer<typeof focusSessionsQuerySchema>;

export interface FocusSession {
  id: string;
  startedAt: string;
  endedAt: string;
  /** Tanggal lokal (zona waktu pengguna) saat sesi dimulai. */
  date: string;
  plannedSeconds: number;
  focusedSeconds: number;
  status: FocusStatus;
  taskId: string | null;
  taskTitle: string | null;
  label: string | null;
}

export interface FocusSummary {
  from: string;
  to: string;
  totalFocusedSeconds: number;
  completedSessions: number;
  /** Detik fokus per tanggal lokal, berisi setiap tanggal dalam rentang. */
  byDate: { date: string; focusedSeconds: number }[];
}

export interface FocusSessionList {
  items: FocusSession[];
  nextCursor: null;
  summary: FocusSummary;
}
