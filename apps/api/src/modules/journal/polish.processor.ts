import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { UnrecoverableError, type Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUES } from '../../queue/connection';
import { AI_PROVIDER, PermanentAiError, type AiProvider } from '../ai/ai-provider';
import { hashText, type PolishJobData } from './journal.service';

/**
 * Worker antrean `ai`: merapikan jurnal lalu menyimpan `polishedText` terpisah dari teks asli.
 * Log hanya berisi id dan status; isi jurnal tidak pernah dicatat (ARCHITECTURE.md 13).
 */
@Processor(QUEUES.ai, { concurrency: 2 })
export class PolishProcessor extends WorkerHost {
  private readonly logger = new Logger(PolishProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AI_PROVIDER) private readonly ai: AiProvider | null,
  ) {
    super();
  }

  async process(job: Job<PolishJobData>) {
    const entry = await this.prisma.journalEntry.findUnique({ where: { id: job.data.entryId } });
    if (!entry) return { skipped: 'deleted' };
    if (!this.ai) {
      await this.fail(entry.id, 'AI_DISABLED');
      throw new UnrecoverableError('AI tidak aktif');
    }

    let result;
    try {
      result = await this.ai.polish(entry.rawText);
    } catch (err) {
      if (err instanceof PermanentAiError) {
        await this.fail(entry.id, err.code);
        throw new UnrecoverableError(err.code);
      }
      throw err; // galat sementara: diulang BullMQ, status gagal dicatat di onFailed
    }

    if (!result.ok) {
      await this.fail(entry.id, result.code);
      this.logger.warn(
        { entryId: entry.id, code: result.code },
        'AI Polish tidak menghasilkan teks',
      );
      return { status: 'failed', code: result.code };
    }

    await this.prisma.journalEntry.update({
      where: { id: entry.id },
      data: {
        polishedText: result.text,
        polishedRawHash: hashText(entry.rawText),
        polishedAt: new Date(),
        polishStatus: 'done',
        polishError: null,
      },
    });
    this.logger.log({ entryId: entry.id, jobId: job.id }, 'AI Polish selesai');
    return { status: 'done' };
  }

  /** Setelah percobaan habis karena galat sementara, tandai gagal agar klien berhenti menunggu. */
  @OnWorkerEvent('failed')
  async onFailed(job: Job<PolishJobData> | undefined, err: Error) {
    if (!job) return;
    const exhausted = job.attemptsMade >= (job.opts.attempts ?? 1);
    this.logger.warn(
      { entryId: job.data.entryId, jobId: job.id, attempt: job.attemptsMade, error: err.name },
      'AI Polish gagal',
    );
    if (exhausted && !(err instanceof UnrecoverableError))
      await this.fail(job.data.entryId, 'AI_UNAVAILABLE');
  }

  private async fail(entryId: string, code: string) {
    await this.prisma.journalEntry.updateMany({
      where: { id: entryId },
      data: { polishStatus: 'failed', polishError: code },
    });
  }
}
