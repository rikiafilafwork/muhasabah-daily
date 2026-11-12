/** Jam:menit pada zona waktu pengguna, format Indonesia (mis. 04.10). */
export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
}

/** Tanggal panjang, mis. "Rabu, 11 November 2026". */
export function formatLongDate(date: string | Date, timeZone?: string): string {
  const d = typeof date === 'string' ? new Date(`${date}T12:00:00Z`) : date;
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: typeof date === 'string' ? 'UTC' : timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/** Durasi singkat untuk pembaca layar, mis. "2 jam 5 menit". */
export function formatDurationWords(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h} jam ${m} menit`;
  if (m > 0) return `${m} menit`;
  return 'kurang dari 1 menit';
}
