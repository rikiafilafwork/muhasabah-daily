import { addDays, diffDays, maxDate, minDate, type HabitStats } from '@muhasabah/shared';

/** Jendela untuk proyeksi minggu depan: 4 minggu terakhir (ARCHITECTURE.md 8.2). */
export const PROJECTION_WINDOW_DAYS = 28;

export interface HabitStatsInput {
  /** Tanggal mulai habit (lokal). */
  startDate: string;
  /** Tanggal-tanggal (lokal) yang dicentang. Urutan bebas, boleh di luar rentang. */
  doneDates: Iterable<string>;
  from: string;
  to: string;
  /** Hari ini menurut zona waktu pengguna. Hari setelahnya tidak dihitung. */
  today: string;
}

function inclusiveDays(from: string, to: string): number {
  return from <= to ? diffDays(from, to) + 1 : 0;
}

/**
 * Statistik satu habit. Fungsi murni tanpa akses basis data.
 *
 * - Hari aktif: dari `max(from, startDate)` sampai `min(to, today)`.
 * - Konsistensi: check-in / hari aktif.
 * - Streak terbaik: deret berurutan terpanjang di dalam rentang.
 * - Streak berjalan: berakhir hari ini, atau kemarin bila hari ini belum dicentang.
 * - Proyeksi minggu depan: laju harian 4 minggu terakhir × 7, dibulatkan. Untuk
 *   habit yang lebih muda dari 4 minggu, laju dihitung dari hari aktifnya saja.
 */
export function computeHabitStats(input: HabitStatsInput): HabitStats {
  const { startDate, from, to, today } = input;
  const done = new Set<string>();
  for (const d of input.doneDates) if (d >= startDate && d <= today) done.add(d);

  const rangeFrom = maxDate(from, startDate);
  const rangeTo = minDate(to, today);
  const activeDays = inclusiveDays(rangeFrom, rangeTo);

  const inRange = [...done].filter((d) => d >= rangeFrom && d <= rangeTo).sort();
  let bestStreak = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of inRange) {
    run = prev !== null && diffDays(prev, d) === 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    prev = d;
  }

  let currentStreak = 0;
  let cursor = done.has(today) ? today : addDays(today, -1);
  while (done.has(cursor)) {
    currentStreak++;
    cursor = addDays(cursor, -1);
  }

  const windowFrom = maxDate(addDays(today, -(PROJECTION_WINDOW_DAYS - 1)), startDate);
  const windowDays = inclusiveDays(windowFrom, today);
  const windowDone = [...done].filter((d) => d >= windowFrom).length;
  const projectedNextWeek = windowDays ? Math.round(Math.min(7, (windowDone / windowDays) * 7)) : 0;

  return {
    checkIns: inRange.length,
    bestStreak,
    currentStreak,
    activeDays,
    consistency: activeDays ? Math.round((inRange.length / activeDays) * 100) : 0,
    projectedNextWeek,
  };
}

/** Ringkasan beberapa habit: jumlah, maksimum streak, konsistensi gabungan. */
export function summarizeHabitStats(stats: HabitStats[]): HabitStats {
  const sum = (k: keyof HabitStats) => stats.reduce((s, x) => s + x[k], 0);
  const checkIns = sum('checkIns');
  const activeDays = sum('activeDays');
  return {
    checkIns,
    bestStreak: Math.max(0, ...stats.map((s) => s.bestStreak)),
    currentStreak: Math.max(0, ...stats.map((s) => s.currentStreak)),
    activeDays,
    consistency: activeDays ? Math.round((checkIns / activeDays) * 100) : 0,
    projectedNextWeek: sum('projectedNextWeek'),
  };
}
