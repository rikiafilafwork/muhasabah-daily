/**
 * Konversi tanggal kalender `YYYY-MM-DD` ↔ kolom Postgres `date`.
 * Prisma memetakan `date` ke `Date` pada tengah malam UTC, jadi konversinya
 * selalu lewat UTC agar tidak bergeser oleh zona waktu server.
 */
export function toDbDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function fromDbDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function fromDbDateOrNull(date: Date | null): string | null {
  return date ? fromDbDate(date) : null;
}
