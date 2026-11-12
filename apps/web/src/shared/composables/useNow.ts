import { onScopeDispose, ref, type Ref } from 'vue';

/**
 * Waktu sekarang yang diperbarui berkala. Nilai selalu dibaca dari `Date.now()`
 * sehingga tetap akurat walau interval tertunda saat tab di latar belakang.
 */
export function useNow(intervalMs = 1000): Ref<number> {
  const now = ref(Date.now());
  const update = () => {
    now.value = Date.now();
  };
  const id = setInterval(update, intervalMs);
  const onVisible = () => {
    if (document.visibilityState === 'visible') update();
  };
  document.addEventListener('visibilitychange', onVisible);
  onScopeDispose(() => {
    clearInterval(id);
    document.removeEventListener('visibilitychange', onVisible);
  });
  return now;
}
