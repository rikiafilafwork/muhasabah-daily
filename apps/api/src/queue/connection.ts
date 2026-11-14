import type { ConnectionOptions } from 'bullmq';

/** Prefix kunci BullMQ di Redis. */
export const QUEUE_PREFIX = 'muhasabah';

/** Nama antrean BullMQ (ARCHITECTURE.md 4.5). */
export const QUEUES = {
  seed: 'seed',
  ai: 'ai',
  reminders: 'reminders',
} as const;

/** Opsi koneksi BullMQ dari `REDIS_URL`. Dipakai API dan skrip CLI. */
export function redisConnection(redisUrl: string): ConnectionOptions {
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    db: url.pathname.length > 1 ? Number(url.pathname.slice(1)) : undefined,
  };
}
