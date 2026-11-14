import { describe, expect, it } from 'vitest';
import { createLectureNoteSchema, extractRichDoc } from './lecture-notes';
import { buildTikrarStages, createMemorizationPlanSchema } from './memorization';
import { formatAyahRef } from './quran';

describe('buildTikrarStages', () => {
  it('menyusun dengar, baca, lalu sambung untuk setiap ayat', () => {
    const stages = buildTikrarStages(1, 3, { listenRepeat: 5, reciteRepeat: 3, connectRepeat: 2 });
    expect(stages.map((s) => `${s.kind}:${s.fromAyah}-${s.toAyah}x${s.repeat}`)).toEqual([
      'listen:1-1x5',
      'recite:1-1x3',
      'listen:2-2x5',
      'recite:2-2x3',
      'connect:1-2x2',
      'listen:3-3x5',
      'recite:3-3x3',
      'connect:1-3x2',
    ]);
  });
  it('melewati tahap dengan ulangan 0 dan tidak pernah kosong', () => {
    expect(
      buildTikrarStages(5, 6, { listenRepeat: 0, reciteRepeat: 2, connectRepeat: 0 }),
    ).toHaveLength(2);
    expect(buildTikrarStages(5, 6, { listenRepeat: 0, reciteRepeat: 0, connectRepeat: 0 })).toEqual(
      [{ kind: 'recite', fromAyah: 5, toAyah: 6, repeat: 1 }],
    );
  });
  it('membatasi panjang rencana', () => {
    expect(
      createMemorizationPlanSchema.safeParse({ surahId: 2, fromAyah: 1, toAyah: 31 }).success,
    ).toBe(false);
    expect(
      createMemorizationPlanSchema.safeParse({ surahId: 2, fromAyah: 10, toAyah: 5 }).success,
    ).toBe(false);
    expect(
      createMemorizationPlanSchema.parse({ surahId: 67, fromAyah: 1, toAyah: 5 }).settings,
    ).toEqual({
      listenRepeat: 5,
      reciteRepeat: 5,
      connectRepeat: 3,
    });
  });
});

describe('lecture notes', () => {
  const doc = {
    type: 'doc' as const,
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Tafsir Al-Mulk' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Ujian hidup.' }] },
      { type: 'ayahRef', attrs: { surahId: 67, from: 2, to: 2 } },
      { type: 'ayahRef', attrs: { surahId: 67, from: 2, to: 2 } },
      { type: 'ayahRef', attrs: { surahId: 2, from: 255, to: 255 } },
    ],
  };
  it('mengambil teks dan rujukan unik', () => {
    expect(extractRichDoc(doc)).toEqual({
      text: 'Tafsir Al-Mulk\nUjian hidup.',
      ayahRefs: [
        { surahId: 67, from: 2, to: 2 },
        { surahId: 2, from: 255, to: 255 },
      ],
    });
  });
  it('memvalidasi bentuk dokumen dan menolak field asing', () => {
    expect(
      createLectureNoteSchema.safeParse({ title: 'x', date: '2026-11-13', content: doc }).success,
    ).toBe(true);
    expect(
      createLectureNoteSchema.safeParse({
        title: 'x',
        date: '2026-11-13',
        content: { type: 'html' },
      }).success,
    ).toBe(false);
    expect(
      createLectureNoteSchema.safeParse({
        title: 'x',
        date: '2026-11-13',
        content: { type: 'doc', content: [{ type: 'p', onclick: 'x' }] },
      }).success,
    ).toBe(false);
  });
  it('formatAyahRef', () => {
    expect(formatAyahRef('Al-Baqarah', 255, 255)).toBe('QS. Al-Baqarah: 255');
    expect(formatAyahRef('Al-Mulk', 1, 5)).toBe('QS. Al-Mulk: 1–5');
  });
});
