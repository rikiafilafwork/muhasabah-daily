import { describe, expect, it } from 'vitest';
import type { MemorizationStage } from '@muhasabah/shared';
import { initialState, reduce, stageProgress, type PlayerEvent, type PlayerState } from './player';

const listen: MemorizationStage = {
  position: 0,
  kind: 'listen',
  fromAyah: 1,
  toAyah: 2,
  repeat: 2,
};
const recite: MemorizationStage = {
  position: 1,
  kind: 'recite',
  fromAyah: 3,
  toAyah: 3,
  repeat: 3,
};

function run(stage: MemorizationStage, events: PlayerEvent[]): PlayerState {
  return events.reduce((s, e) => reduce(stage, s, e), initialState(stage));
}

describe('pemutar Hafidz', () => {
  it('memutar setiap ayat dalam rentang lalu mengulang', () => {
    let s = reduce(listen, initialState(listen), { type: 'PLAY' });
    const seen: string[] = [];
    while (s.status === 'playing') {
      seen.push(`${s.repetition}:${s.ayah}`);
      s = reduce(listen, s, { type: 'AUDIO_ENDED' });
    }
    expect(seen).toEqual(['1:1', '1:2', '2:1', '2:2']);
    expect(s.status).toBe('done');
    expect(stageProgress(listen, s)).toEqual({ done: 4, total: 4 });
  });

  it('jeda menahan posisi dan AUDIO_ENDED saat jeda diabaikan', () => {
    const s = run(listen, [
      { type: 'PLAY' },
      { type: 'AUDIO_ENDED' },
      { type: 'PAUSE' },
      { type: 'AUDIO_ENDED' },
    ]);
    expect(s).toMatchObject({ status: 'paused', ayah: 2, repetition: 1 });
    expect(stageProgress(listen, s)).toEqual({ done: 1, total: 4 });
    expect(reduce(listen, s, { type: 'PLAY' }).status).toBe('playing');
  });

  it('galat audio bisa diulang atau dilewati', () => {
    const err = run(listen, [{ type: 'PLAY' }, { type: 'AUDIO_ERROR', message: 'gagal' }]);
    expect(err).toMatchObject({ status: 'error', error: 'gagal', ayah: 1 });
    expect(reduce(listen, err, { type: 'RETRY' })).toMatchObject({
      status: 'playing',
      ayah: 1,
      error: null,
    });
    expect(reduce(listen, err, { type: 'SKIP_AYAH' })).toMatchObject({
      status: 'playing',
      ayah: 2,
      error: null,
    });
  });

  it('tahap baca sendiri dihitung dengan tanda selesai, bukan audio', () => {
    expect(reduce(recite, initialState(recite), { type: 'PLAY' }).status).toBe('idle');
    const s = run(recite, [{ type: 'RECITED' }, { type: 'RECITED' }]);
    expect(s).toMatchObject({ status: 'idle', repetition: 3 });
    expect(stageProgress(recite, s)).toEqual({ done: 2, total: 3 });
    expect(reduce(recite, s, { type: 'RECITED' }).status).toBe('done');
  });

  it('RESET kembali ke awal tahap', () => {
    const s = run(listen, [{ type: 'PLAY' }, { type: 'AUDIO_ENDED' }, { type: 'RESET' }]);
    expect(s).toEqual(initialState(listen));
  });
});
