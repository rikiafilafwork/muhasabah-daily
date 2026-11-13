import { computed, ref, watch } from 'vue';
import { useNow } from '@/shared';
import * as T from '../timer';

const STATE_KEY = 'md-focus-timer';
const CONFIG_KEY = 'md-focus-config';

export interface FocusConfig {
  focusMinutes: number;
  breakMinutes: number;
}

export interface CompletedFocus {
  startedAt: number;
  endedAt: number;
  plannedSeconds: number;
  focusedSeconds: number;
  status: 'completed' | 'cancelled';
}

function read<T>(key: string, parse: (raw: string | null) => T | null, fallback: T): T {
  try {
    return parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* penyimpanan tidak tersedia: timer tetap jalan, hanya tidak bertahan saat muat ulang */
  }
}

function parseConfig(raw: string | null): FocusConfig | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(raw) as FocusConfig;
    return c.focusMinutes > 0 && c.breakMinutes > 0 ? c : null;
  } catch {
    return null;
  }
}

/** Bunyi pendek saat sesi berakhir. Gagal diam-diam bila audio diblokir. */
function chime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1);
  } catch {
    /* abaikan */
  }
}

/**
 * Timer fokus/istirahat. State disimpan di localStorage agar tetap berjalan
 * setelah muat ulang. `onFocusEnd` dipanggil saat sesi fokus selesai atau dihentikan.
 */
export function useFocusTimer(onFocusEnd: (s: CompletedFocus) => void | Promise<void>) {
  const config = ref<FocusConfig>(
    read(CONFIG_KEY, parseConfig, { focusMinutes: 25, breakMinutes: 5 }),
  );
  const state = ref<T.TimerState>(
    read(STATE_KEY, T.parseTimerState, T.idle('focus', config.value.focusMinutes * 60)),
  );
  const now = useNow(250);

  watch(state, (s) => write(STATE_KEY, s), { deep: true });
  watch(config, (c) => write(CONFIG_KEY, c), { deep: true });

  const remainingMs = computed(() => T.remainingMs(state.value, now.value));
  const progress = computed(() => 1 - remainingMs.value / (state.value.plannedSeconds * 1000));

  function setConfig(c: FocusConfig) {
    config.value = c;
    if (state.value.phase === 'idle') {
      const minutes = state.value.mode === 'focus' ? c.focusMinutes : c.breakMinutes;
      state.value = T.idle(state.value.mode, minutes * 60);
    }
  }

  function setMode(mode: T.TimerMode) {
    if (state.value.phase !== 'idle') return;
    const minutes = mode === 'focus' ? config.value.focusMinutes : config.value.breakMinutes;
    state.value = T.idle(mode, minutes * 60);
  }

  const startTimer = () => (state.value = T.start(state.value, Date.now()));
  const pauseTimer = () => (state.value = T.pause(state.value, Date.now()));
  const resumeTimer = () => (state.value = T.resume(state.value, Date.now()));

  async function finishFocus(status: 'completed' | 'cancelled', at: number) {
    const s = state.value;
    const record: CompletedFocus = {
      startedAt: s.startedAt!,
      endedAt: at,
      plannedSeconds: s.plannedSeconds,
      focusedSeconds: T.focusedSeconds(s, at),
      status,
    };
    state.value = T.idle(
      status === 'completed' ? 'break' : 'focus',
      (status === 'completed' ? config.value.breakMinutes : config.value.focusMinutes) * 60,
    );
    await onFocusEnd(record);
  }

  /** Menghentikan sesi lebih awal. Sesi fokus tercatat sebagai dibatalkan. */
  async function stop() {
    const s = state.value;
    if (s.phase === 'idle') return;
    if (s.mode === 'focus') await finishFocus('cancelled', Date.now());
    else state.value = T.idle('focus', config.value.focusMinutes * 60);
  }

  // Selesai otomatis saat waktu habis (juga bila halaman dibuka setelah waktunya lewat).
  watch(
    () => T.isFinished(state.value, now.value),
    async (done) => {
      if (!done) return;
      const s = state.value;
      chime();
      if (s.mode === 'focus') await finishFocus('completed', s.endsAt!);
      else state.value = T.idle('focus', config.value.focusMinutes * 60);
    },
    { immediate: true },
  );

  return {
    config,
    state,
    remainingMs,
    progress,
    setConfig,
    setMode,
    start: startTimer,
    pause: pauseTimer,
    resume: resumeTimer,
    stop,
  };
}
