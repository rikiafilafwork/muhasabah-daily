import type { Color } from '@muhasabah/shared';

/** Kelas Tailwind per token warna. Ditulis lengkap agar terdeteksi oleh Tailwind. */
export const COLOR_CLASSES: Record<
  Color,
  { dot: string; soft: string; border: string; text: string }
> = {
  emerald: {
    dot: 'bg-emerald-500',
    soft: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
    border: 'border-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
  sky: {
    dot: 'bg-sky-500',
    soft: 'bg-sky-50 text-sky-900 dark:bg-sky-950 dark:text-sky-100',
    border: 'border-sky-500',
    text: 'text-sky-700 dark:text-sky-400',
  },
  violet: {
    dot: 'bg-violet-500',
    soft: 'bg-violet-50 text-violet-900 dark:bg-violet-950 dark:text-violet-100',
    border: 'border-violet-500',
    text: 'text-violet-700 dark:text-violet-400',
  },
  amber: {
    dot: 'bg-amber-500',
    soft: 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
    border: 'border-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
  },
  rose: {
    dot: 'bg-rose-500',
    soft: 'bg-rose-50 text-rose-900 dark:bg-rose-950 dark:text-rose-100',
    border: 'border-rose-500',
    text: 'text-rose-700 dark:text-rose-400',
  },
  slate: {
    dot: 'bg-slate-500',
    soft: 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100',
    border: 'border-slate-500',
    text: 'text-slate-700 dark:text-slate-300',
  },
};

export const COLOR_LABELS: Record<Color, string> = {
  emerald: 'Hijau',
  sky: 'Biru',
  violet: 'Ungu',
  amber: 'Kuning',
  rose: 'Merah muda',
  slate: 'Abu-abu',
};
