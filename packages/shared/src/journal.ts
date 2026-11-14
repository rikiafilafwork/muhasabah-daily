import { z } from 'zod';
import { dateRangeQuerySchema } from './common';

/** Panjang maksimum teks jurnal yang disimpan. Batas untuk AI diatur terpisah di server. */
export const JOURNAL_MAX_LENGTH = 20_000;

export const saveJournalSchema = z
  .object({
    rawText: z.string().max(JOURNAL_MAX_LENGTH, `Maksimal ${JOURNAL_MAX_LENGTH} karakter`),
  })
  .strict();
export type SaveJournalInput = z.infer<typeof saveJournalSchema>;

export const journalListQuerySchema = dateRangeQuerySchema(366);

export const POLISH_STATUSES = ['none', 'pending', 'done', 'failed'] as const;
export type PolishStatus = (typeof POLISH_STATUSES)[number];

export interface JournalEntry {
  date: string;
  rawText: string;
  /** Versi yang dirapikan AI. Teks asli tidak pernah ditimpa. */
  polishedText: string | null;
  polishStatus: PolishStatus;
  /** Kode error bila gagal, mis. `AI_REFUSED`, `AI_UNAVAILABLE`. */
  polishError: string | null;
  /** `true` bila teks asli sudah diubah setelah dirapikan. */
  polishStale: boolean;
  updatedAt: string | null;
}

export interface JournalSummary {
  date: string;
  preview: string;
  hasPolished: boolean;
}

export interface AiStatus {
  enabled: boolean;
  provider: string | null;
  dailyLimit: number;
  usedToday: number;
  maxInputChars: number;
}
