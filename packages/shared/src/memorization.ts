import { z } from 'zod';
import { idSchema } from './common';
import { ayahNumberSchema, surahIdSchema } from './quran';

/**
 * Tahap tikrar:
 * - `listen`: dengarkan audio ayat (atau rentang) sebanyak `repeat` kali.
 * - `recite`: baca sendiri (teks bisa disembunyikan) sebanyak `repeat` kali.
 * - `connect`: sambung ayat-ayat yang sudah dihafal, dengarkan rentangnya `repeat` kali.
 */
export const STAGE_KINDS = ['listen', 'recite', 'connect'] as const;
export type StageKind = (typeof STAGE_KINDS)[number];
export const STAGE_LABELS: Record<StageKind, string> = {
  listen: 'Dengarkan',
  recite: 'Baca sendiri',
  connect: 'Sambung',
};

/** Batas jumlah ayat per rencana agar tahapan tetap wajar. */
export const MEMORIZATION_MAX_AYAHS = 30;
export const MEMORIZATION_MAX_STAGES = 200;

export const tikrarSettingsSchema = z
  .object({
    listenRepeat: z.number().int().min(0).max(40).default(5),
    reciteRepeat: z.number().int().min(0).max(40).default(5),
    connectRepeat: z.number().int().min(0).max(40).default(3),
  })
  .strict();
export type TikrarSettings = z.infer<typeof tikrarSettingsSchema>;

export const createMemorizationPlanSchema = z
  .object({
    surahId: surahIdSchema,
    fromAyah: ayahNumberSchema,
    toAyah: ayahNumberSchema,
    title: z.string().trim().max(120).nullable().optional(),
    settings: tikrarSettingsSchema.default({ listenRepeat: 5, reciteRepeat: 5, connectRepeat: 3 }),
  })
  .strict()
  .refine((v) => v.fromAyah <= v.toAyah, {
    message: 'Ayat awal harus sebelum ayat akhir',
    path: ['toAyah'],
  })
  .refine((v) => v.toAyah - v.fromAyah + 1 <= MEMORIZATION_MAX_AYAHS, {
    message: `Maksimal ${MEMORIZATION_MAX_AYAHS} ayat per rencana`,
    path: ['toAyah'],
  });
export type CreateMemorizationPlanInput = z.input<typeof createMemorizationPlanSchema>;

export const updateMemorizationPlanSchema = z
  .object({
    title: z.string().trim().max(120).nullable(),
    /** Indeks tahap yang sedang dikerjakan (0-based); sama dengan jumlah tahap berarti selesai. */
    currentStage: z.number().int().min(0).max(MEMORIZATION_MAX_STAGES),
    archived: z.boolean(),
  })
  .partial()
  .strict();
export type UpdateMemorizationPlanInput = z.infer<typeof updateMemorizationPlanSchema>;

export const stageInputSchema = z
  .object({
    kind: z.enum(STAGE_KINDS),
    fromAyah: ayahNumberSchema,
    toAyah: ayahNumberSchema,
    repeat: z.number().int().min(1).max(40),
  })
  .strict()
  .refine((s) => s.fromAyah <= s.toAyah, { message: 'Rentang ayat tidak valid', path: ['toAyah'] });
export type StageInput = z.infer<typeof stageInputSchema>;

export const setStagesSchema = z
  .object({ stages: z.array(stageInputSchema).min(1).max(MEMORIZATION_MAX_STAGES) })
  .strict();
export type SetStagesInput = z.infer<typeof setStagesSchema>;

export const planIdParamsSchema = z.object({ id: idSchema }).strict();

export interface MemorizationStage extends StageInput {
  position: number;
}

export interface MemorizationPlan {
  id: string;
  surahId: number;
  surahName: string;
  fromAyah: number;
  toAyah: number;
  title: string | null;
  settings: TikrarSettings;
  currentStage: number;
  archived: boolean;
  stages: MemorizationStage[];
  /** 0–100. */
  progress: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Menyusun tahapan tikrar bawaan: untuk setiap ayat dengarkan lalu baca sendiri,
 * kemudian sambung dengan ayat-ayat sebelumnya. Diakhiri satu putaran seluruh rentang.
 * Tahap dengan ulangan 0 dilewati. Fungsi murni.
 */
export function buildTikrarStages(
  fromAyah: number,
  toAyah: number,
  s: TikrarSettings,
): StageInput[] {
  const stages: StageInput[] = [];
  for (let ayah = fromAyah; ayah <= toAyah; ayah++) {
    if (s.listenRepeat > 0)
      stages.push({ kind: 'listen', fromAyah: ayah, toAyah: ayah, repeat: s.listenRepeat });
    if (s.reciteRepeat > 0)
      stages.push({ kind: 'recite', fromAyah: ayah, toAyah: ayah, repeat: s.reciteRepeat });
    if (ayah > fromAyah && s.connectRepeat > 0) {
      stages.push({ kind: 'connect', fromAyah, toAyah: ayah, repeat: s.connectRepeat });
    }
  }
  if (!stages.length) stages.push({ kind: 'recite', fromAyah, toAyah, repeat: 1 });
  return stages;
}
