import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AppConfig } from '../config/app-config.service';

/** Nama antrean BullMQ (ARCHITECTURE.md 4.5). */
export const QUEUES = {
  seed: 'seed',
  ai: 'ai',
  reminders: 'reminders',
} as const;

/**
 * Koneksi BullMQ. Pada v0.1 worker berjalan di proses API yang sama;
 * processor tiap antrean didaftarkan oleh modul fiturnya (fase 5–6).
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => {
        const url = new URL(config.get('REDIS_URL'));
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port || 6379),
            username: url.username || undefined,
            password: url.password || undefined,
            db: url.pathname.length > 1 ? Number(url.pathname.slice(1)) : undefined,
          },
          prefix: 'muhasabah',
        };
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
