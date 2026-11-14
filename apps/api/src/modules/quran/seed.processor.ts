import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { AppConfig } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUES } from '../../queue/connection';
import { importQuran } from './quran-import';

/** Worker antrean `seed`. Job `quran` mengimpor data Al-Qur'an (ARCHITECTURE.md 8.4). */
@Processor(QUEUES.seed, { concurrency: 1 })
export class SeedProcessor extends WorkerHost {
  private readonly logger = new Logger(SeedProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'quran') throw new Error(`Job seed tidak dikenal: ${job.name}`);
    const result = await importQuran(this.prisma, {
      baseUrl: this.config.get('ALQURAN_CLOUD_BASE_URL'),
      audioBaseUrl: this.config.get('QURAN_AUDIO_BASE_URL'),
      onProgress: async (percent, message) => {
        await job.updateProgress({ percent, message });
      },
    });
    this.logger.log({ jobId: job.id, ...result }, "Impor Al-Qur'an selesai");
    return result;
  }
}
