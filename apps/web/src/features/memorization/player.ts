import type { MemorizationStage } from '@muhasabah/shared';

/**
 * State machine pemutar Hafidz (ARCHITECTURE.md 5.3):
 * `idle → playing(ayat, ulangan) → next → … → done`.
 *
 * - Tahap `listen` dan `connect`: audio ayat dalam rentang diputar berurutan, diulang `repeat` kali.
 * - Tahap `recite`: tanpa audio; pengguna menandai setiap kali selesai membaca sendiri.
 * Fungsi murni, tanpa akses DOM, agar mudah dites.
 */
export type PlayerStatus = 'idle' | 'playing' | 'paused' | 'error' | 'done';

export interface PlayerState {
  status: PlayerStatus;
  /** Ayat yang sedang diputar/dibaca (nomor dalam surah). */
  ayah: number;
  /** Ulangan ke- (1-based). */
  repetition: number;
  error: string | null;
}

export type PlayerEvent =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'AUDIO_ENDED' }
  | { type: 'AUDIO_ERROR'; message: string }
  | { type: 'RETRY' }
  | { type: 'SKIP_AYAH' }
  | { type: 'RECITED' }
  | { type: 'RESET' };

export function initialState(stage: MemorizationStage): PlayerState {
  return { status: 'idle', ayah: stage.fromAyah, repetition: 1, error: null };
}

export const usesAudio = (stage: MemorizationStage) => stage.kind !== 'recite';

/** Maju satu langkah: ayat berikutnya, ulangan berikutnya, atau selesai. */
function advance(stage: MemorizationStage, s: PlayerState): PlayerState {
  if (s.ayah < stage.toAyah) return { ...s, ayah: s.ayah + 1, error: null };
  if (s.repetition < stage.repeat)
    return { ...s, ayah: stage.fromAyah, repetition: s.repetition + 1, error: null };
  return { ...s, status: 'done', error: null };
}

export function reduce(stage: MemorizationStage, s: PlayerState, e: PlayerEvent): PlayerState {
  switch (e.type) {
    case 'RESET':
      return initialState(stage);
    case 'PLAY':
      if (!usesAudio(stage) || s.status === 'done') return s;
      return { ...s, status: 'playing', error: null };
    case 'PAUSE':
      return s.status === 'playing' ? { ...s, status: 'paused' } : s;
    case 'AUDIO_ENDED':
      return s.status === 'playing' ? advance(stage, s) : s;
    case 'AUDIO_ERROR':
      return s.status === 'playing' ? { ...s, status: 'error', error: e.message } : s;
    case 'RETRY':
      return s.status === 'error' ? { ...s, status: 'playing', error: null } : s;
    case 'SKIP_AYAH': {
      // Lewati ayat yang audionya bermasalah tanpa menghentikan tahap.
      if (!usesAudio(stage) || s.status === 'done') return s;
      const next = advance(stage, s);
      return next.status === 'done'
        ? next
        : { ...next, status: s.status === 'error' ? 'playing' : s.status };
    }
    case 'RECITED': {
      if (usesAudio(stage) || s.status === 'done') return s;
      return s.repetition < stage.repeat
        ? { ...s, repetition: s.repetition + 1 }
        : { ...s, status: 'done' };
    }
  }
}

/** Total langkah dan langkah yang sudah lewat, untuk indikator progres tahap. */
export function stageProgress(
  stage: MemorizationStage,
  s: PlayerState,
): { done: number; total: number } {
  if (!usesAudio(stage)) {
    return { done: s.status === 'done' ? stage.repeat : s.repetition - 1, total: stage.repeat };
  }
  const perRep = stage.toAyah - stage.fromAyah + 1;
  const total = perRep * stage.repeat;
  if (s.status === 'done') return { done: total, total };
  return { done: (s.repetition - 1) * perRep + (s.ayah - stage.fromAyah), total };
}
