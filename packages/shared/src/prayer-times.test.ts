import { describe, expect, it } from 'vitest';
import { getCurrentPrayer, getNextPrayer, type PrayerKey } from './prayer-times';

const timings: Record<PrayerKey, string> = {
  fajr: '2026-11-10T21:55:00.000Z', // 04:55 WIB (11 Nov)
  sunrise: '2026-11-10T23:10:00.000Z',
  dhuhr: '2026-11-11T04:50:00.000Z', // 11:50 WIB
  asr: '2026-11-11T08:10:00.000Z',
  maghrib: '2026-11-11T10:55:00.000Z',
  isha: '2026-11-11T12:05:00.000Z',
};

describe('getNextPrayer', () => {
  it('mengembalikan Subuh sebelum fajar', () => {
    const next = getNextPrayer(timings, new Date('2026-11-10T21:00:00.000Z'));
    expect(next).toMatchObject({ prayer: 'fajr', label: 'Subuh', secondsRemaining: 55 * 60 });
  });

  it('melewati waktu terbit karena bukan sholat', () => {
    const next = getNextPrayer(timings, new Date('2026-11-10T22:30:00.000Z'));
    expect(next?.prayer).toBe('dhuhr');
  });

  it('waktu tepat sama dianggap sudah masuk, lanjut ke berikutnya', () => {
    const next = getNextPrayer(timings, new Date(timings.asr));
    expect(next?.prayer).toBe('maghrib');
  });

  it('null setelah Isya', () => {
    expect(getNextPrayer(timings, new Date('2026-11-11T13:00:00.000Z'))).toBeNull();
  });
});

describe('getCurrentPrayer', () => {
  it('null sebelum Subuh dan Isya setelah Isya', () => {
    expect(getCurrentPrayer(timings, new Date('2026-11-10T21:00:00.000Z'))).toBeNull();
    expect(getCurrentPrayer(timings, new Date('2026-11-11T13:00:00.000Z'))).toBe('isha');
    expect(getCurrentPrayer(timings, new Date('2026-11-10T22:00:00.000Z'))).toBe('fajr');
    expect(getCurrentPrayer(timings, new Date('2026-11-11T01:00:00.000Z'))).toBeNull();
  });
});
