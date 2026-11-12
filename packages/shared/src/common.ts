import { z } from 'zod';
import { isoDateSchema } from './prayer-times';

/** Id cuid yang dibuat Prisma. Dipakai untuk parameter rute dan referensi antar entitas. */
export const idSchema = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9]+$/i, 'Id tidak valid');

/** Instan ISO 8601 dengan zona waktu, mis. `2026-11-12T08:00:00.000Z`. */
export const isoDateTimeSchema = z.iso.datetime({ offset: true });

export const dateParamSchema = z.object({ date: isoDateSchema }).strict();

/** Palet warna yang dipakai event, proyek, habit. Nama token, bukan hex, agar tema gelap konsisten. */
export const COLORS = ['emerald', 'sky', 'violet', 'amber', 'rose', 'slate'] as const;
export const colorSchema = z.enum(COLORS);
export type Color = z.infer<typeof colorSchema>;

export const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

interface DateRange {
  from?: string;
  to?: string;
}

/** Rentang tanggal `from..to` (inklusif) dengan batas panjang; `extra` menambah field query lain. */
export function dateRangeQuerySchema<E extends z.ZodRawShape = Record<never, never>>(
  maxDays: number,
  extra?: E,
) {
  const ordered = (v: DateRange) => !v.from || !v.to || v.from <= v.to;
  const withinMax = (v: DateRange) =>
    !v.from ||
    !v.to ||
    (Date.parse(`${v.to}T00:00:00Z`) - Date.parse(`${v.from}T00:00:00Z`)) / 86_400_000 < maxDays;
  return z
    .object({ from: isoDateSchema.optional(), to: isoDateSchema.optional(), ...(extra as E) })
    .strict()
    .refine((v) => ordered(v as DateRange), {
      message: '`from` harus sebelum atau sama dengan `to`',
      path: ['from'],
    })
    .refine((v) => withinMax(v as DateRange), {
      message: `Rentang maksimal ${maxDays} hari`,
      path: ['to'],
    });
}
