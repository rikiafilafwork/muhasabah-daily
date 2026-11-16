import { z } from 'zod';
import { colorSchema, idSchema, optionalText, type Color } from './common';
import { isoDateSchema } from './prayer-times';

/**
 * Catatan keuangan: pemasukan dan pengeluaran dalam Rupiah utuh (tanpa desimal).
 * Nominal disimpan sebagai bilangan bulat agar tidak ada galat pembulatan float.
 */

export const TRANSACTION_TYPES = ['income', 'expense'] as const;
export const transactionTypeSchema = z.enum(TRANSACTION_TYPES);
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  income: 'Pemasukan',
  expense: 'Pengeluaran',
};

/** Nominal terbesar per transaksi: Rp999.999.999.999 (aman sebagai `number` JavaScript). */
export const AMOUNT_MAX = 999_999_999_999;
export const amountSchema = z
  .number({ error: 'Nominal wajib diisi' })
  .int('Nominal harus bilangan bulat')
  .min(1, 'Nominal minimal Rp1')
  .max(AMOUNT_MAX, 'Nominal terlalu besar');

/** Bulan kalender `YYYY-MM`. */
export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Format bulan harus YYYY-MM')
  .refine((m) => {
    const y = Number(m.slice(0, 4));
    return y >= 2000 && y <= 2100;
  }, 'Tahun di luar rentang');

/** Bulan dari tanggal `YYYY-MM-DD`. */
export const monthOf = (date: string): string => date.slice(0, 7);

/** Menggeser bulan `YYYY-MM` sebanyak `n` (boleh negatif). */
export function addMonths(month: string, n: number): string {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7)) - 1 + n;
  const year = y + Math.floor(m / 12);
  const mm = ((m % 12) + 12) % 12;
  return `${year}-${String(mm + 1).padStart(2, '0')}`;
}

/** Tanggal pertama dan terakhir sebuah bulan, `YYYY-MM-DD`. */
export function monthRange(month: string): { from: string; to: string } {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
}

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});
const groupFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

/** `1500000` → `Rp 1.500.000`. Spasi diganti spasi biasa agar konsisten di semua runtime. */
export function formatRupiah(amount: number): string {
  return rupiahFormatter.format(amount).replace(/\s/g, ' ');
}

/** `1500000` → `1.500.000` (tanpa simbol), untuk isian nominal. */
export function formatAmountInput(amount: number | null): string {
  return amount === null ? '' : groupFormatter.format(amount);
}

/**
 * Mengurai isian nominal: `"1.500.000"`, `"Rp 1.500.000"`, `"1500000"` → `1500000`.
 * Titik dan koma dianggap pemisah ribuan (Rupiah tanpa desimal). Kosong → `null`.
 */
export function parseRupiah(input: string): number | null {
  const digits = input.replace(/[^\d]/g, '');
  if (!digits) return null;
  const n = Number(digits.replace(/^0+(?=\d)/, ''));
  return Number.isSafeInteger(n) ? n : null;
}

// ---- Kategori ----

const categoryFields = {
  name: z.string().trim().min(1, 'Nama kategori wajib diisi').max(50),
  color: colorSchema,
};

export const createFinanceCategorySchema = z
  .object({
    type: transactionTypeSchema,
    name: categoryFields.name,
    color: categoryFields.color.default('slate'),
  })
  .strict();
export type CreateFinanceCategoryInput = z.input<typeof createFinanceCategorySchema>;

/** Jenis kategori tidak bisa diubah agar transaksi lama tetap konsisten. */
export const updateFinanceCategorySchema = z
  .object({ ...categoryFields, archived: z.boolean() })
  .partial()
  .strict();
export type UpdateFinanceCategoryInput = z.infer<typeof updateFinanceCategorySchema>;

export const financeCategoriesQuerySchema = z
  .object({ includeArchived: z.stringbool().optional() })
  .strict();

export interface FinanceCategory {
  id: string;
  type: TransactionType;
  name: string;
  color: Color;
  archived: boolean;
  position: number;
  transactionCount: number;
}

/** Kategori bawaan yang dibuat saat pengguna pertama kali membuka Keuangan. */
export const DEFAULT_FINANCE_CATEGORIES: readonly {
  type: TransactionType;
  name: string;
  color: Color;
}[] = [
  { type: 'income', name: 'Gaji', color: 'emerald' },
  { type: 'income', name: 'Usaha', color: 'sky' },
  { type: 'income', name: 'Hadiah', color: 'violet' },
  { type: 'income', name: 'Pemasukan lain', color: 'slate' },
  { type: 'expense', name: 'Makan', color: 'amber' },
  { type: 'expense', name: 'Transportasi', color: 'sky' },
  { type: 'expense', name: 'Tagihan', color: 'rose' },
  { type: 'expense', name: 'Belanja', color: 'violet' },
  { type: 'expense', name: 'Kesehatan', color: 'emerald' },
  { type: 'expense', name: 'Pendidikan', color: 'sky' },
  { type: 'expense', name: 'Sedekah & infak', color: 'emerald' },
  { type: 'expense', name: 'Zakat', color: 'amber' },
  { type: 'expense', name: 'Pengeluaran lain', color: 'slate' },
];

// ---- Transaksi ----

/** Jenis transaksi mengikuti kategorinya, jadi tidak dikirim terpisah. */
const transactionFields = {
  amount: amountSchema,
  date: isoDateSchema,
  categoryId: idSchema,
  note: optionalText(300),
};

export const createTransactionSchema = z.object(transactionFields).strict();
export type CreateTransactionInput = z.input<typeof createTransactionSchema>;

export const updateTransactionSchema = z.object(transactionFields).partial().strict();
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export const transactionsQuerySchema = z
  .object({
    /** Bawaan: bulan berjalan pengguna. */
    month: monthSchema.optional(),
    type: transactionTypeSchema.optional(),
    categoryId: idSchema.optional(),
    cursor: idSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();
export interface TransactionsQuery {
  month?: string;
  type?: TransactionType;
  categoryId?: string;
  cursor?: string;
  limit?: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  note: string | null;
  category: { id: string; name: string; color: Color };
  createdAt: string;
  updatedAt: string;
}

// ---- Ringkasan ----

export const financeSummaryQuerySchema = z.object({ month: monthSchema.optional() }).strict();

export const FINANCE_MAX_MONTHS = 24;
export const financeMonthlyQuerySchema = z
  .object({
    /** Bulan terakhir dalam deret (bawaan: bulan berjalan). */
    to: monthSchema.optional(),
    months: z.coerce.number().int().min(1).max(FINANCE_MAX_MONTHS).default(12),
  })
  .strict();

export interface MonthTotals {
  month: string;
  income: number;
  expense: number;
  /** `income - expense`. */
  balance: number;
}

export interface FinanceCategoryTotal {
  categoryId: string;
  name: string;
  color: Color;
  type: TransactionType;
  total: number;
  count: number;
}

export interface FinanceSummary extends MonthTotals {
  transactionCount: number;
  previous: MonthTotals;
  /** Total per kategori, terbesar dulu. */
  byCategory: FinanceCategoryTotal[];
}

export interface FinanceMonthly {
  /** Urut dari bulan terlama ke terbaru; bulan tanpa transaksi bernilai 0. */
  months: MonthTotals[];
}
