import { computed } from 'vue';
import { toLocalDate } from '@muhasabah/shared';
import { useNow } from '@/shared';
import { useSessionStore } from './stores/session.store';

/**
 * Zona waktu dan "hari ini" menurut profil pengguna (bukan zona waktu browser),
 * sehingga tanggal harian sama dengan yang dihitung server.
 */
export function useUserClock(tickMs = 30_000) {
  const session = useSessionStore();
  const now = useNow(tickMs);
  const timezone = computed(() => session.user?.timezone ?? 'Asia/Jakarta');
  const today = computed(() => toLocalDate(new Date(now.value), timezone.value));
  return { now, timezone, today };
}
