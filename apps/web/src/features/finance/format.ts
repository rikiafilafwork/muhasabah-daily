import { formatRupiah, type TransactionType } from '@muhasabah/shared';
import { formatMonthYear } from '@/shared/utils/format';

/** "November 2026" dari `2026-11`. */
export const monthLabel = (month: string) => formatMonthYear(`${month}-01`);

/** Nominal bertanda: `+Rp 5.000` untuk pemasukan, `−Rp 5.000` untuk pengeluaran. */
export function signedAmount(type: TransactionType, amount: number): string {
  return `${type === 'income' ? '+' : '−'}${formatRupiah(amount)}`;
}

/** Selisih bertanda, mis. `−Rp 99.000`. */
export function balanceLabel(balance: number): string {
  return balance < 0 ? `−${formatRupiah(-balance)}` : formatRupiah(balance);
}

/** Bentuk ringkas untuk sumbu grafik: 1,5 jt, 250 rb. */
export function compactRupiah(n: number): string {
  const abs = Math.abs(n);
  const fmt = (v: number) =>
    new Intl.NumberFormat('id-ID', { maximumFractionDigits: v < 10 ? 1 : 0 }).format(v);
  if (abs >= 1e9) return `${fmt(n / 1e9)} M`;
  if (abs >= 1e6) return `${fmt(n / 1e6)} jt`;
  if (abs >= 1e3) return `${fmt(n / 1e3)} rb`;
  return String(n);
}

/** Persentase perubahan terhadap bulan lalu; `null` bila bulan lalu kosong. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Kelas warna seri grafik (lolos uji buta warna; lihat ARCHITECTURE ADR 17). */
export const SERIES_CLASSES: Record<TransactionType, string> = {
  income: 'bg-emerald-700 dark:bg-emerald-600',
  expense: 'bg-amber-500 dark:bg-amber-600',
};
