import { dateRange, type FocusStatus, type FocusSummary } from '@muhasabah/shared';

/** Ringkasan sesi fokus per tanggal. Fungsi murni; tanggal tanpa sesi bernilai 0. */
export function summarizeFocus(
  from: string,
  to: string,
  sessions: { date: string; focusedSeconds: number; status: FocusStatus }[],
): FocusSummary {
  const perDay = new Map(dateRange(from, to).map((d) => [d, 0]));
  let total = 0;
  let completed = 0;
  for (const s of sessions) {
    if (!perDay.has(s.date)) continue;
    perDay.set(s.date, perDay.get(s.date)! + s.focusedSeconds);
    total += s.focusedSeconds;
    if (s.status === 'completed') completed++;
  }
  return {
    from,
    to,
    totalFocusedSeconds: total,
    completedSessions: completed,
    byDate: [...perDay].map(([date, focusedSeconds]) => ({ date, focusedSeconds })),
  };
}
