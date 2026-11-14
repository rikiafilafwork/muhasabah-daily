import { z } from 'zod';

export const SURAH_COUNT = 114;
export const AYAH_COUNT = 6236;

export const surahIdSchema = z.coerce.number().int().min(1).max(SURAH_COUNT);
export const ayahNumberSchema = z.coerce.number().int().min(1).max(286);

export const surahParamsSchema = z.object({ id: surahIdSchema }).strict();
export const ayahsQuerySchema = z
  .object({ from: ayahNumberSchema.optional(), to: ayahNumberSchema.optional() })
  .strict()
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: '`from` harus sebelum atau sama dengan `to`',
    path: ['from'],
  });

export interface Surah {
  id: number;
  /** Nama Arab, mis. سُورَةُ ٱلْفَاتِحَةِ */
  nameArabic: string;
  /** Nama latin, mis. Al-Faatiha */
  nameLatin: string;
  /** Arti nama (dari sumber data). */
  nameMeaning: string;
  revelationType: 'Meccan' | 'Medinan';
  ayahCount: number;
}

export interface Ayah {
  /** Nomor global 1–6236. */
  id: number;
  surahId: number;
  numberInSurah: number;
  juz: number;
  page: number;
  arabic: string;
  /** Transliterasi (ejaan Inggris, sumber en.transliteration). */
  latin: string;
  /** Terjemah Kemenag (id.indonesian). */
  translation: string;
  audioUrl: string;
}

export interface AyahRef {
  surahId: number;
  from: number;
  to: number;
}

export const ayahRefSchema = z
  .object({ surahId: surahIdSchema, from: ayahNumberSchema, to: ayahNumberSchema })
  .strict()
  .refine((r) => r.from <= r.to, { message: 'Ayat awal harus sebelum ayat akhir', path: ['to'] });

/** Label rujukan, mis. "QS. Al-Baqarah: 255" atau "QS. Al-Mulk: 1–5". */
export function formatAyahRef(surahName: string, from: number, to: number): string {
  return `QS. ${surahName}: ${from === to ? from : `${from}–${to}`}`;
}
