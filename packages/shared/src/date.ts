/**
 * Tanggal kalender (`YYYY-MM-DD`) dari sebuah instan pada zona waktu tertentu.
 * Dipakai untuk menentukan "hari ini" milik pengguna (lihat ARCHITECTURE.md 6.2).
 */
export function toLocalDate(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Menambah `days` hari ke tanggal kalender `YYYY-MM-DD`. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Selisih hari kalender `to - from` untuk tanggal `YYYY-MM-DD`. */
export function diffDays(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** Daftar tanggal dari `from` sampai `to` (inklusif). */
export function dateRange(from: string, to: string): string[] {
  const n = diffDays(from, to);
  return Array.from({ length: Math.max(0, n + 1) }, (_, i) => addDays(from, i));
}

/** Tanggal paling awal/akhir dari dua tanggal `YYYY-MM-DD`. */
export const minDate = (a: string, b: string) => (a < b ? a : b);
export const maxDate = (a: string, b: string) => (a > b ? a : b);

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

/**
 * Instan UTC dari jam dinding `date` + `time` (`HH:MM`) pada `timeZone`.
 * Dipakai untuk mengubah input tanggal/jam pengguna menjadi instan yang disimpan.
 */
export function zonedTimeToUtc(date: string, time: string, timeZone: string): Date {
  const guess = Date.parse(`${date}T${time}:00Z`);
  let result = guess - timeZoneOffsetMs(new Date(guess), timeZone);
  // Hitung ulang sekali untuk zona dengan DST.
  result = guess - timeZoneOffsetMs(new Date(result), timeZone);
  return new Date(result);
}

/** Jam dinding `HH:MM` dari sebuah instan pada `timeZone`. */
export function toLocalTime(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(instant);
}

/** Indeks hari dalam minggu dengan Senin = 0 … Ahad = 6. */
export function weekdayIndex(date: string): number {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}

/** Senin pada minggu yang memuat `date`. */
export function startOfWeek(date: string): string {
  return addDays(date, -weekdayIndex(date));
}
