import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, type OnApplicationBootstrap } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';
import { AppConfig } from '../../config/app-config.service';
import { QUEUES } from '../../queue/connection';
import { RemindersService } from './reminders.service';

const SCHEDULER_ID = 'reminders-tick';

/** Worker antrean `reminders`: satu job berulang tiap menit memeriksa pengingat jatuh tempo. */
@Processor(QUEUES.reminders, { concurrency: 1 })
export class RemindersProcessor extends WorkerHost implements OnApplicationBootstrap {
  private readonly logger = new Logger(RemindersProcessor.name);

  constructor(
    private readonly reminders: RemindersService,
    private readonly config: AppConfig,
    @InjectQueue(QUEUES.reminders) private readonly queue: Queue,
  ) {
    super();
  }

  async onApplicationBootstrap() {
    const on = this.config.pushEnabled && this.config.get('REMINDERS_SCHEDULER') === 'on';
    if (!on) {
      await this.queue.removeJobScheduler(SCHEDULER_ID).catch(() => undefined);
      if (!this.config.pushEnabled) this.logger.log('Pengingat mati: kunci VAPID belum diatur');
      return;
    }
    await this.queue.upsertJobScheduler(
      SCHEDULER_ID,
      { every: 60_000 },
      { name: 'tick', opts: { removeOnComplete: 10, removeOnFail: 50 } },
    );
  }

  async process(_job: Job) {
    const result = await this.reminders.tick(new Date());
    if (result.events || result.prayers) this.logger.log(result, 'Pengingat terkirim');
    return result;
  }
}
