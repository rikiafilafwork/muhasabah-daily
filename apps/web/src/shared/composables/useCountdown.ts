import { computed, type MaybeRefOrGetter, type Ref, toValue } from 'vue';
import { useNow } from './useNow';

/** Memecah sisa detik menjadi jam, menit, detik. Fungsi murni. */
export function splitDuration(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return { hours: Math.floor(s / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

/** Format `HH:MM:SS`. */
export function formatCountdown(totalSeconds: number): string {
  const { hours, minutes, seconds } = splitDuration(totalSeconds);
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}

/** Hitung mundur ke sebuah instan (ISO atau epoch ms), dihitung dari selisih terhadap `Date.now()`. */
export function useCountdown(
  target: MaybeRefOrGetter<string | number | null | undefined>,
  now: Ref<number> = useNow(1000),
) {
  const remainingSeconds = computed(() => {
    const t = toValue(target);
    if (t == null) return null;
    const ms = typeof t === 'number' ? t : Date.parse(t);
    return Math.max(0, Math.ceil((ms - now.value) / 1000));
  });
  const formatted = computed(() =>
    remainingSeconds.value == null ? '--:--:--' : formatCountdown(remainingSeconds.value),
  );
  const done = computed(() => remainingSeconds.value === 0);
  return { now, remainingSeconds, formatted, done };
}
