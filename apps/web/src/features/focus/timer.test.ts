import { describe, expect, it } from 'vitest';
import {
  focusedSeconds,
  idle,
  isFinished,
  parseTimerState,
  pause,
  remainingMs,
  resume,
  start,
} from './timer';

const T0 = 1_000_000;

describe('focus timer', () => {
  it('menghitung sisa dari selisih jam, tahan terhadap tab latar belakang', () => {
    const s = start(idle('focus', 1500), T0);
    expect(remainingMs(s, T0)).toBe(1_500_000);
    // Tidak ada tick selama 10 menit: hasil tetap tepat.
    expect(remainingMs(s, T0 + 600_000)).toBe(900_000);
    expect(focusedSeconds(s, T0 + 600_000)).toBe(600);
    expect(isFinished(s, T0 + 1_500_000)).toBe(true);
    expect(remainingMs(s, T0 + 2_000_000)).toBe(0);
  });

  it('jeda tidak dihitung sebagai waktu fokus dan menggeser waktu selesai', () => {
    let s = start(idle('focus', 1500), T0);
    s = pause(s, T0 + 300_000); // 5 menit fokus
    expect(remainingMs(s, T0 + 900_000)).toBe(1_200_000); // jeda 10 menit tidak mengurangi
    expect(focusedSeconds(s, T0 + 900_000)).toBe(300);
    s = resume(s, T0 + 900_000);
    expect(remainingMs(s, T0 + 960_000)).toBe(1_140_000);
    expect(focusedSeconds(s, T0 + 960_000)).toBe(360);
    expect(isFinished(s, T0 + 900_000 + 1_200_000)).toBe(true);
    expect(focusedSeconds(s, T0 + 5_000_000)).toBe(1500);
  });

  it('pause/resume di fase yang salah tidak mengubah state', () => {
    const i = idle('break', 300);
    expect(pause(i, T0)).toBe(i);
    expect(resume(i, T0)).toBe(i);
    expect(remainingMs(i, T0)).toBe(300_000);
  });

  it('parseTimerState menolak data rusak', () => {
    expect(parseTimerState(null)).toBeNull();
    expect(parseTimerState('{bukan json')).toBeNull();
    expect(parseTimerState(JSON.stringify({ phase: 'x' }))).toBeNull();
    const s = start(idle('focus', 60), T0);
    expect(parseTimerState(JSON.stringify(s))).toEqual(s);
  });
});
