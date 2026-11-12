import { daysBetween, roundCoord, startOfLocalDay, todayIn, ttlUntilEndOfDay } from './time-utils';

describe('time-utils', () => {
  it('startOfLocalDay menghitung tengah malam lokal dalam UTC', () => {
    expect(startOfLocalDay('2026-11-11', 'Asia/Jakarta').toISOString()).toBe(
      '2026-11-10T17:00:00.000Z',
    );
    expect(startOfLocalDay('2026-11-11', 'UTC').toISOString()).toBe('2026-11-11T00:00:00.000Z');
    // Zona dengan DST (berakhir 1 Nov 2026 di New York → UTC-5).
    expect(startOfLocalDay('2026-11-11', 'America/New_York').toISOString()).toBe(
      '2026-11-11T05:00:00.000Z',
    );
    expect(startOfLocalDay('2026-07-01', 'America/New_York').toISOString()).toBe(
      '2026-07-01T04:00:00.000Z',
    );
  });

  it('ttlUntilEndOfDay berakhir di tengah malam lokal berikutnya', () => {
    const now = new Date('2026-11-11T10:00:00Z'); // 17:00 WIB
    expect(ttlUntilEndOfDay('2026-11-11', 'Asia/Jakarta', now)).toBe(7 * 3600);
  });

  it('ttlUntilEndOfDay minimal 1 jam untuk tanggal lampau dan maksimal 8 hari', () => {
    const now = new Date('2026-11-11T10:00:00Z');
    expect(ttlUntilEndOfDay('2026-01-01', 'Asia/Jakarta', now)).toBe(3600);
    expect(ttlUntilEndOfDay('2027-01-01', 'Asia/Jakarta', now)).toBe(8 * 24 * 3600);
  });

  it('roundCoord membulatkan ke 2 desimal', () => {
    expect(roundCoord(-6.2088)).toBe('-6.21');
    expect(roundCoord(106.8456)).toBe('106.85');
    expect(roundCoord(0)).toBe('0.00');
  });

  it('todayIn dan daysBetween', () => {
    expect(todayIn('Asia/Jakarta', new Date('2026-11-10T17:30:00Z'))).toBe('2026-11-11');
    expect(daysBetween('2026-11-11', '2026-11-12')).toBe(1);
    expect(daysBetween('2026-11-11', '2026-11-01')).toBe(-10);
  });
});
