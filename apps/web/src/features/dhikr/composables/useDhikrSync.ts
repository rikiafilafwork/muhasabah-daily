import { onScopeDispose, ref } from 'vue';
import { ApiError } from '@/api/http';
import { dhikrApi } from '../api';
import { DhikrSyncQueue, type SyncStatus } from '../sync-queue';

const queues = new Map<string, DhikrSyncQueue>();
const status = ref<SyncStatus>('idle');

function storageFor(userId: string) {
  const key = `md-dhikr-pending:${userId}`;
  return {
    load(): Record<string, number> {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, unknown>;
        return Object.fromEntries(
          Object.entries(parsed).filter((e): e is [string, number] => Number.isInteger(e[1])),
        );
      } catch {
        return {};
      }
    },
    save(entries: Record<string, number>) {
      try {
        if (Object.keys(entries).length) localStorage.setItem(key, JSON.stringify(entries));
        else localStorage.removeItem(key);
      } catch {
        /* tanpa penyimpanan: antrean tetap di memori */
      }
    },
  };
}

/** 4xx selain 401/429 berarti data ditolak dan tidak perlu diulang. */
function isPermanentError(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    err.status >= 400 &&
    err.status < 500 &&
    ![401, 429].includes(err.status)
  );
}

/** Satu antrean per pengguna, dipakai bersama oleh halaman dan widget. */
export function useDhikrSync(userId: string) {
  let queue = queues.get(userId);
  if (!queue) {
    queue = new DhikrSyncQueue({
      storage: storageFor(userId),
      send: async (id, date, count) => {
        await dhikrApi.setCount(id, date, count);
      },
      isPermanentError,
      onStatus: (s) => (status.value = s),
    });
    queues.set(userId, queue);
  }
  const q = queue;
  status.value = q.currentStatus;

  const flush = () => void q.flush();
  const onVisibility = () => document.visibilityState === 'hidden' && flush();
  window.addEventListener('online', flush);
  document.addEventListener('visibilitychange', onVisibility);
  const retry = setInterval(() => {
    if (q.currentStatus === 'offline' || q.currentStatus === 'pending') flush();
  }, 20_000);
  flush();

  onScopeDispose(() => {
    window.removeEventListener('online', flush);
    document.removeEventListener('visibilitychange', onVisibility);
    clearInterval(retry);
    flush();
  });

  return { queue: q, status };
}
