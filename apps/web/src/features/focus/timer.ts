/**
 * Logika timer fokus sebagai fungsi murni. Sisa waktu selalu dihitung dari selisih
 * jam (`now`) terhadap waktu acuan, bukan dari jumlah tick, sehingga tetap akurat
 * saat tab di latar belakang (ARCHITECTURE.md 5.3).
 */
export type TimerMode = 'focus' | 'break';
export type TimerPhase = 'idle' | 'running' | 'paused';

export interface TimerState {
  phase: TimerPhase;
  mode: TimerMode;
  plannedSeconds: number;
  /** Instan mulai sesi (ms), untuk dicatat ke API. */
  startedAt: number | null;
  /** Saat berjalan: instan target selesai (ms). */
  endsAt: number | null;
  /** Saat dijeda: sisa waktu (ms). */
  pausedRemainingMs: number | null;
  /** Waktu berjalan yang sudah terkumpul sebelum segmen sekarang (ms). */
  elapsedBeforeMs: number;
  /** Awal segmen berjalan sekarang (ms). */
  segmentStart: number | null;
}

export function idle(mode: TimerMode, plannedSeconds: number): TimerState {
  return {
    phase: 'idle',
    mode,
    plannedSeconds,
    startedAt: null,
    endsAt: null,
    pausedRemainingMs: null,
    elapsedBeforeMs: 0,
    segmentStart: null,
  };
}

export function start(state: TimerState, now: number): TimerState {
  return {
    ...state,
    phase: 'running',
    startedAt: now,
    endsAt: now + state.plannedSeconds * 1000,
    pausedRemainingMs: null,
    elapsedBeforeMs: 0,
    segmentStart: now,
  };
}

export function pause(state: TimerState, now: number): TimerState {
  if (state.phase !== 'running') return state;
  return {
    ...state,
    phase: 'paused',
    pausedRemainingMs: Math.max(0, state.endsAt! - now),
    elapsedBeforeMs: state.elapsedBeforeMs + (now - state.segmentStart!),
    endsAt: null,
    segmentStart: null,
  };
}

export function resume(state: TimerState, now: number): TimerState {
  if (state.phase !== 'paused') return state;
  return {
    ...state,
    phase: 'running',
    endsAt: now + state.pausedRemainingMs!,
    pausedRemainingMs: null,
    segmentStart: now,
  };
}

export function remainingMs(state: TimerState, now: number): number {
  if (state.phase === 'running') return Math.max(0, state.endsAt! - now);
  if (state.phase === 'paused') return state.pausedRemainingMs!;
  return state.plannedSeconds * 1000;
}

/** Waktu fokus bersih (tanpa jeda), dibatasi durasi rencana. */
export function focusedSeconds(state: TimerState, now: number): number {
  const running = state.phase === 'running' ? now - state.segmentStart! : 0;
  return Math.min(state.plannedSeconds, Math.floor((state.elapsedBeforeMs + running) / 1000));
}

export function isFinished(state: TimerState, now: number): boolean {
  return state.phase === 'running' && now >= state.endsAt!;
}

/** Mengurai state tersimpan; mengembalikan null bila rusak. */
export function parseTimerState(raw: string | null): TimerState | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as TimerState;
    const ok =
      ['idle', 'running', 'paused'].includes(s.phase) &&
      ['focus', 'break'].includes(s.mode) &&
      Number.isFinite(s.plannedSeconds) &&
      s.plannedSeconds > 0;
    return ok ? s : null;
  } catch {
    return null;
  }
}
