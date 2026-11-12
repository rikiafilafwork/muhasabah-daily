import { z } from 'zod';

/** Urutan waktu dalam sehari. `sunrise` (terbit) bukan sholat, hanya penanda. */
export const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerKey = (typeof PRAYER_KEYS)[number];

/** Waktu yang dihitung sebagai sholat wajib. */
export const OBLIGATORY_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type ObligatoryPrayer = (typeof OBLIGATORY_PRAYERS)[number];

export const PRAYER_LABELS: Record<PrayerKey, string> = {
  fajr: 'Subuh',
  sunrise: 'Terbit',
  dhuhr: 'Dzuhur',
  asr: 'Ashar',
  maghrib: 'Maghrib',
  isha: 'Isya',
};

/** Tanggal kalender `YYYY-MM-DD`. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, 'Tanggal tidak valid');

export const prayerTimesQuerySchema = z.object({ date: isoDateSchema.optional() }).strict();
export type PrayerTimesQuery = z.infer<typeof prayerTimesQuerySchema>;

export interface PrayerTimes {
  /** Tanggal lokal pengguna, `YYYY-MM-DD`. */
  date: string;
  timezone: string;
  /** Waktu tiap jadwal sebagai ISO 8601 UTC. */
  timings: Record<PrayerKey, string>;
  /** Metode perhitungan, mis. "Kemenag RI". */
  method: string;
  /** `true` bila data diambil dari cache. */
  cached: boolean;
  /** `true` bila sumber gagal dan yang dikembalikan data cache lama. */
  stale: boolean;
}

export interface NextPrayer {
  prayer: ObligatoryPrayer;
  label: string;
  /** ISO 8601 UTC. */
  at: string;
  /** Sisa detik dari waktu server saat dihitung. */
  secondsRemaining: number;
}

/**
 * Mencari sholat wajib berikutnya setelah `now` dari jadwal satu hari.
 * Mengembalikan `null` bila semua sholat hari itu sudah lewat (pemanggil
 * lalu memakai jadwal hari berikutnya).
 */
export function getNextPrayer(timings: Record<PrayerKey, string>, now: Date): NextPrayer | null {
  const nowMs = now.getTime();
  for (const prayer of OBLIGATORY_PRAYERS) {
    const atMs = Date.parse(timings[prayer]);
    if (atMs > nowMs) {
      return {
        prayer,
        label: PRAYER_LABELS[prayer],
        at: new Date(atMs).toISOString(),
        secondsRemaining: Math.floor((atMs - nowMs) / 1000),
      };
    }
  }
  return null;
}

/**
 * Sholat yang waktunya sedang berlangsung, atau null. Waktu Subuh berakhir saat
 * terbit, sehingga antara terbit dan Dzuhur hasilnya null.
 */
export function getCurrentPrayer(
  timings: Record<PrayerKey, string>,
  now: Date,
): ObligatoryPrayer | null {
  let current: PrayerKey | null = null;
  for (const key of PRAYER_KEYS) {
    if (Date.parse(timings[key]) <= now.getTime()) current = key;
  }
  return current === null || current === 'sunrise' ? null : current;
}
