import { describe, expect, it, vi } from 'vitest';
import { DhikrSyncQueue, type SyncStatus } from './sync-queue';

type SendFn = (id: string, date: string, count: number) => Promise<void>;

function setup(send: ReturnType<typeof vi.fn<SendFn>> = vi.fn<SendFn>(async () => undefined)) {
  let stored: Record<string, number> = {};
  const timers: (() => void)[] = [];
  const statuses: SyncStatus[] = [];
  const q = new DhikrSyncQueue({
    storage: { load: () => stored, save: (e) => (stored = { ...e }) },
    send,
    isPermanentError: (err) => (err as { status?: number }).status === 400,
    onStatus: (s) => statuses.push(s),
    setTimer: (fn) => (timers.push(fn), timers.length),
    clearTimer: (h) => (timers[(h as number) - 1] = () => undefined),
  });
  return {
    q,
    send,
    timers,
    statuses,
    stored: () => stored,
    setStored: (s: Record<string, number>) => (stored = s),
  };
}

describe('DhikrSyncQueue', () => {
  it('debounce: banyak ketukan menghasilkan satu kiriman berisi nilai terakhir', async () => {
    const { q, send, timers, stored } = setup();
    q.set('pagi-tasbih', '2026-11-12', 1);
    q.set('pagi-tasbih', '2026-11-12', 2);
    q.set('pagi-tasbih', '2026-11-12', 3);
    expect(stored()).toEqual({ 'pagi-tasbih|2026-11-12': 3 });
    timers.forEach((t) => t());
    await q.flush();
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith('pagi-tasbih', '2026-11-12', 3);
    expect(stored()).toEqual({});
    expect(q.currentStatus).toBe('idle');
  });

  it('menyimpan antrean saat offline dan mengirim ulang nanti', async () => {
    const send = vi
      .fn<SendFn>()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue(undefined);
    const { q, stored } = setup(send);
    q.set('a', '2026-11-12', 5);
    await q.flush();
    expect(q.currentStatus).toBe('offline');
    expect(stored()).toEqual({ 'a|2026-11-12': 5 });
    await q.flush();
    expect(send).toHaveBeenLastCalledWith('a', '2026-11-12', 5);
    expect(q.size).toBe(0);
  });

  it('memulihkan antrean dari penyimpanan saat dibuat ulang', async () => {
    const send = vi.fn<SendFn>(async () => undefined);
    let stored: Record<string, number> = { 'petang-x|2026-11-11': 7 };
    const q = new DhikrSyncQueue({
      storage: { load: () => stored, save: (e) => (stored = e) },
      send,
      isPermanentError: () => false,
    });
    expect(q.currentStatus).toBe('pending');
    expect(q.pendingFor('2026-11-11')).toEqual({ 'petang-x': 7 });
    expect(q.pendingFor('2026-11-12')).toEqual({});
    await q.flush();
    expect(send).toHaveBeenCalledWith('petang-x', '2026-11-11', 7);
  });

  it('membuang entri yang ditolak server (4xx) agar antrean tidak macet', async () => {
    const send = vi.fn<SendFn>(async (id: string) => {
      if (id === 'buruk') throw Object.assign(new Error('x'), { status: 400 });
    });
    const { q } = setup(send);
    q.set('buruk', '2026-11-12', 1);
    q.set('baik', '2026-11-12', 2);
    await q.flush();
    expect(q.size).toBe(0);
    expect(q.currentStatus).toBe('error');
    expect(send).toHaveBeenCalledWith('baik', '2026-11-12', 2);
  });

  it('nilai yang berubah selama pengiriman tidak hilang', async () => {
    let release!: () => void;
    const send = vi.fn<SendFn>(() => new Promise<void>((r) => (release = r)));
    const { q, stored } = setup(send);
    q.set('a', '2026-11-12', 1);
    const flushing = q.flush();
    q.set('a', '2026-11-12', 2); // ketukan baru saat kiriman pertama masih berjalan
    release();
    await Promise.resolve();
    await Promise.resolve();
    expect(stored()['a|2026-11-12']).toBe(2);
    release();
    await flushing;
    expect(send).toHaveBeenLastCalledWith('a', '2026-11-12', 2);
  });
});
