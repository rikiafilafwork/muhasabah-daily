import { describe, expect, it } from 'vitest';
import { dhikrLogBodySchema, dhikrQuerySchema, suggestDhikrGroup } from './dhikr';
import { createFocusSessionSchema } from './focus';

const session = {
  startedAt: '2026-11-12T01:00:00.000Z',
  endedAt: '2026-11-12T01:25:00.000Z',
  plannedSeconds: 1500,
  focusedSeconds: 1500,
  status: 'completed',
};

describe('focus', () => {
  it('menerima sesi valid', () => {
    expect(createFocusSessionSchema.safeParse(session).success).toBe(true);
  });
  it('menolak fokus lebih lama dari durasi sesi', () => {
    expect(createFocusSessionSchema.safeParse({ ...session, focusedSeconds: 1600 }).success).toBe(
      false,
    );
    expect(createFocusSessionSchema.safeParse({ ...session, focusedSeconds: 1504 }).success).toBe(
      true,
    );
  });
  it('menolak selesai sebelum mulai dan field asing', () => {
    expect(
      createFocusSessionSchema.safeParse({ ...session, endedAt: '2026-11-12T00:00:00Z' }).success,
    ).toBe(false);
    expect(createFocusSessionSchema.safeParse({ ...session, userId: 'x' }).success).toBe(false);
  });
});

describe('dhikr', () => {
  it('memvalidasi grup dan hitungan', () => {
    expect(dhikrQuerySchema.safeParse({ group: 'pagi' }).success).toBe(true);
    expect(dhikrQuerySchema.safeParse({ group: 'siang' }).success).toBe(false);
    expect(dhikrLogBodySchema.safeParse({ count: -1 }).success).toBe(false);
    expect(dhikrLogBodySchema.safeParse({ count: 33 }).success).toBe(true);
  });
  it('menyarankan grup dari jam', () => {
    expect(suggestDhikrGroup(5)).toBe('pagi');
    expect(suggestDhikrGroup(13)).toBe('pagi');
    expect(suggestDhikrGroup(16)).toBe('petang');
    expect(suggestDhikrGroup(22)).toBe('tidur');
    expect(suggestDhikrGroup(1)).toBe('tidur');
  });
});
