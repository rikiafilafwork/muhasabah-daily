import { z } from 'zod';
import { isoDateSchema } from './prayer-times';

export const DHIKR_GROUPS = ['pagi', 'petang', 'tidur'] as const;
export type DhikrGroup = (typeof DHIKR_GROUPS)[number];
export const DHIKR_GROUP_LABELS: Record<DhikrGroup, string> = {
  pagi: 'Dzikir pagi',
  petang: 'Dzikir petang',
  tidur: 'Sebelum tidur',
};

/** Batas hitungan per hari untuk satu dzikir (pengaman input). */
export const DHIKR_MAX_COUNT = 10_000;

export const dhikrQuerySchema = z
  .object({ group: z.enum(DHIKR_GROUPS), date: isoDateSchema.optional() })
  .strict();
export type DhikrQuery = z.infer<typeof dhikrQuerySchema>;

export const dhikrSummaryQuerySchema = z.object({ date: isoDateSchema.optional() }).strict();

const dhikrIdSchema = z.string().regex(/^[a-z0-9-]{1,80}$/, 'Id dzikir tidak valid');
export const dhikrLogParamsSchema = z.object({ id: dhikrIdSchema, date: isoDateSchema }).strict();
export const dhikrLogBodySchema = z
  .object({ count: z.number().int().min(0).max(DHIKR_MAX_COUNT) })
  .strict();
export type DhikrLogBody = z.infer<typeof dhikrLogBodySchema>;

export interface DhikrItem {
  id: string;
  group: DhikrGroup;
  title: string;
  arabic: string;
  latin: string;
  translation: string;
  /** Rujukan dalil, selalu ditampilkan bersama teks. */
  reference: string;
  /** Catatan cara membaca, mis. "Ditiupkan ke telapak tangan lalu diusap ke tubuh". */
  note: string | null;
  /** Jumlah bacaan yang dianjurkan. */
  repeat: number;
  /** Hitungan pengguna pada tanggal yang diminta. */
  count: number;
}

export interface DhikrList {
  date: string;
  group: DhikrGroup;
  items: DhikrItem[];
  nextCursor: null;
}

export interface DhikrGroupSummary {
  group: DhikrGroup;
  total: number;
  /** Jumlah dzikir yang hitungannya sudah mencapai `repeat`. */
  completed: number;
}

export interface DhikrSummary {
  date: string;
  groups: DhikrGroupSummary[];
}

/** Waktu dzikir yang disarankan untuk sebuah jam lokal (0–23). Fungsi murni. */
export function suggestDhikrGroup(hour: number): DhikrGroup {
  if (hour >= 3 && hour < 12) return 'pagi';
  if (hour >= 15 && hour < 20) return 'petang';
  if (hour >= 20 || hour < 3) return 'tidur';
  return 'pagi';
}
