import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { formatCountdown, splitDuration, useCountdown } from './useCountdown';

describe('formatCountdown', () => {
  it('memformat jam, menit, detik', () => {
    expect(formatCountdown(3725)).toBe('01:02:05');
    expect(formatCountdown(-5)).toBe('00:00:00');
    expect(splitDuration(59.9)).toEqual({ hours: 0, minutes: 0, seconds: 59 });
  });
});

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-11T10:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('menghitung dari Date.now(), bukan jumlah tick', async () => {
    const scope = effectScope();
    const target = ref<string | null>('2026-11-11T10:01:00Z');
    const cd = scope.run(() => useCountdown(target))!;
    expect(cd.remainingSeconds.value).toBe(60);

    // Simulasi tab di latar belakang: jam melompat 44 detik, lalu hanya satu tick (1 detik) yang jalan.
    vi.setSystemTime(new Date('2026-11-11T10:00:44Z'));
    vi.advanceTimersToNextTimer();
    await nextTick();
    expect(cd.remainingSeconds.value).toBe(15);
    expect(cd.formatted.value).toBe('00:00:15');

    vi.setSystemTime(new Date('2026-11-11T10:02:00Z'));
    vi.advanceTimersToNextTimer();
    expect(cd.done.value).toBe(true);

    target.value = null;
    expect(cd.formatted.value).toBe('--:--:--');
    scope.stop();
  });
});
