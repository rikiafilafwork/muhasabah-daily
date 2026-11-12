import { z } from 'zod';
import { colorSchema, dateRangeQuerySchema, idSchema, type Color } from './common';
import { isoDateSchema } from './prayer-times';

export const HABIT_CATEGORIES = [
  'ibadah',
  'kesehatan',
  'produktivitas',
  'keluarga',
  'keuangan',
  'diri',
] as const;
export type HabitCategory = (typeof HABIT_CATEGORIES)[number];
export const HABIT_CATEGORY_LABELS: Record<HabitCategory, string> = {
  ibadah: 'Ibadah',
  kesehatan: 'Kesehatan',
  produktivitas: 'Produktivitas',
  keluarga: 'Keluarga & sosial',
  keuangan: 'Keuangan',
  diri: 'Pengembangan diri',
};

export interface HabitTemplate {
  id: string;
  name: string;
  category: HabitCategory;
  description: string | null;
  /** Rujukan dalil (ayat/hadis) bila ada. Selalu ditampilkan bersama habit ibadah. */
  reference: string | null;
}

const templateIdSchema = z.string().regex(/^[a-z0-9-]{1,64}$/, 'Template tidak valid');

export const createHabitSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    templateId: templateIdSchema.optional(),
    color: colorSchema.default('emerald'),
    /** Tanggal mulai (lokal). Default hari ini. */
    startDate: isoDateSchema.optional(),
  })
  .strict()
  .refine((v) => v.name || v.templateId, {
    message: 'Isi nama habit atau pilih dari template',
    path: ['name'],
  });
export type CreateHabitInput = z.input<typeof createHabitSchema>;

export const updateHabitSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    color: colorSchema,
    active: z.boolean(),
    position: z.number().int().min(0),
    startDate: isoDateSchema,
  })
  .partial()
  .strict();
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;

export const habitLogBodySchema = z.object({ done: z.boolean() }).strict();
export type HabitLogBody = z.infer<typeof habitLogBodySchema>;

export const habitLogParamsSchema = z.object({ id: idSchema, date: isoDateSchema }).strict();

/** Rentang log yang disertakan pada daftar habit (default 7 hari terakhir). */
export const HABITS_MAX_RANGE_DAYS = 62;
export const habitsQuerySchema = dateRangeQuerySchema(HABITS_MAX_RANGE_DAYS, {
  includeInactive: z.stringbool().optional(),
});
export type HabitsQuery = z.input<typeof habitsQuerySchema>;

export const INSIGHTS_MAX_RANGE_DAYS = 366;
export const habitInsightsQuerySchema = dateRangeQuerySchema(INSIGHTS_MAX_RANGE_DAYS);
export type HabitInsightsQuery = z.infer<typeof habitInsightsQuerySchema>;

export interface Habit {
  id: string;
  name: string;
  templateId: string | null;
  color: Color;
  position: number;
  active: boolean;
  startDate: string;
  createdAt: string;
  /** Tanggal (lokal) yang tercentang dalam rentang kueri. */
  logs: string[];
}

export interface HabitStats {
  /** Jumlah log selesai dalam rentang. */
  checkIns: number;
  /** Deret hari berurutan terpanjang dalam rentang. */
  bestStreak: number;
  /** Deret yang masih berjalan sampai hari ini (atau kemarin bila hari ini belum dicentang). */
  currentStreak: number;
  /** Hari aktif dalam rentang: sejak tanggal mulai habit sampai hari ini. */
  activeDays: number;
  /** Persentase check-in terhadap hari aktif (0–100, dibulatkan). */
  consistency: number;
  /** Perkiraan check-in minggu depan dari rata-rata 4 minggu terakhir. */
  projectedNextWeek: number;
}

export interface HabitInsights {
  from: string;
  to: string;
  summary: HabitStats;
  habits: (HabitStats & { habitId: string; name: string })[];
}
