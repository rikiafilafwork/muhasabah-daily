import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { AppConfig } from '../config/app-config.service';
import { QUEUE_PREFIX, QUEUES, redisConnection } from './connection';

export { QUEUES } from './connection';

/**
 * Koneksi dan antrean BullMQ. Worker berjalan di proses API yang sama (ADR 10);
 * processor tiap antrean didaftarkan oleh modul fiturnya.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        connection: redisConnection(config.get('REDIS_URL')),
        prefix: QUEUE_PREFIX,
        defaultJobOptions: { removeOnComplete: 100, removeOnFail: 100 },
      }),
    }),
    BullModule.registerQueue({ name: QUEUES.seed }, { name: QUEUES.ai }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
