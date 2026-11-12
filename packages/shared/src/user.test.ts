import { describe, expect, it } from 'vitest';
import { updateProfileSchema } from './user';
import { registerSchema } from './auth';
import { addDays, toLocalDate } from './date';

describe('updateProfileSchema', () => {
  it('menolak field yang tidak dikenal', () => {
    expect(updateProfileSchema.safeParse({ userId: 'x' }).success).toBe(false);
  });
  it('menolak zona waktu tidak dikenal', () => {
    expect(updateProfileSchema.safeParse({ timezone: 'Mars/Olympus' }).success).toBe(false);
  });
  it('mewajibkan lat dan lng bersamaan', () => {
    expect(updateProfileSchema.safeParse({ latitude: -6.2 }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ latitude: -6.2, longitude: 106.8 }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ latitude: null, longitude: null }).success).toBe(true);
  });
});

describe('registerSchema', () => {
  it('menormalkan email', () => {
    const r = registerSchema.parse({ name: 'A', email: 'A@Example.COM', password: '12345678' });
    expect(r.email).toBe('a@example.com');
  });
});

describe('tanggal lokal', () => {
  it('menghitung tanggal pada zona waktu pengguna', () => {
    const instant = new Date('2026-11-10T18:30:00Z'); // 01:30 WIB 11 Nov
    expect(toLocalDate(instant, 'Asia/Jakarta')).toBe('2026-11-11');
    expect(toLocalDate(instant, 'UTC')).toBe('2026-11-10');
  });
  it('addDays melewati batas bulan', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
  });
});

import { startOfWeek, toLocalTime, weekdayIndex, zonedTimeToUtc } from './date';

describe('konversi zona waktu', () => {
  it('zonedTimeToUtc dan toLocalTime saling membalik', () => {
    const at = zonedTimeToUtc('2026-11-12', '19:30', 'Asia/Jakarta');
    expect(at.toISOString()).toBe('2026-11-12T12:30:00.000Z');
    expect(toLocalTime(at, 'Asia/Jakarta')).toBe('19:30');
    expect(zonedTimeToUtc('2026-07-01', '00:00', 'America/New_York').toISOString()).toBe(
      '2026-07-01T04:00:00.000Z',
    );
  });
  it('minggu dimulai hari Senin', () => {
    expect(weekdayIndex('2026-11-16')).toBe(0); // Senin
    expect(weekdayIndex('2026-11-15')).toBe(6); // Ahad
    expect(startOfWeek('2026-11-15')).toBe('2026-11-09');
  });
});
