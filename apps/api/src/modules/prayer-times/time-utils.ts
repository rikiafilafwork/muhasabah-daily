import { addDays, toLocalDate } from '@muhasabah/shared';

/** Selisih (ms) zona waktu `timeZone` terhadap UTC pada instan tertentu. */
export function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second'));
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** Instan UTC dari tengah malam (00:00) tanggal lokal `date` pada `timeZone`. */
export function startOfLocalDay(date: string, timeZone: string): Date {
  const guess = Date.parse(`${date}T00:00:00Z`);
  let result = guess - timeZoneOffsetMs(new Date(guess), timeZone);
  // Hitung ulang sekali untuk zona dengan DST.
  result = guess - timeZoneOffsetMs(new Date(result), timeZone);
  return new Date(result);
}

const HOUR = 3600;
const MAX_TTL = 8 * 24 * HOUR;

/**
 * TTL cache (detik) sampai akhir hari `date` di zona waktu pengguna.
 * Minimal 1 jam (untuk tanggal yang sudah lewat), maksimal 8 hari.
 */
export function ttlUntilEndOfDay(date: string, timeZone: string, now: Date): number {
  const end = startOfLocalDay(addDays(date, 1), timeZone).getTime();
  const seconds = Math.ceil((end - now.getTime()) / 1000);
  return Math.min(Math.max(seconds, HOUR), MAX_TTL);
}

/** Koordinat dibulatkan 2 desimal (~1 km) agar pengguna satu kota berbagi cache. */
export function roundCoord(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

export function todayIn(timeZone: string, now: Date = new Date()): string {
  return toLocalDate(now, timeZone);
}

/** Selisih hari kalender antara dua tanggal `YYYY-MM-DD`. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}
