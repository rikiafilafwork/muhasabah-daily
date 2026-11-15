import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  ErrorCode,
  type PushConfig,
  type PushPayload,
  type PushSubscriptionInput,
} from '@muhasabah/shared';
import { AppException } from '../../common/app.exception';
import { AppConfig } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WebPushSender } from './web-push.sender';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
    private readonly sender: WebPushSender,
  ) {}

  get enabled(): boolean {
    return this.config.pushEnabled;
  }

  getConfig(): PushConfig {
    return {
      enabled: this.enabled,
      publicKey: this.enabled ? (this.config.get('VAPID_PUBLIC_KEY') ?? null) : null,
    };
  }

  /** Menyimpan langganan perangkat. Endpoint yang sama dipindah ke pengguna yang sedang masuk. */
  async subscribe(userId: string, input: PushSubscriptionInput, userAgent?: string) {
    this.assertEnabled();
    const data = {
      userId,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: userAgent?.slice(0, 300) ?? null,
    };
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      create: { endpoint: input.endpoint, ...data },
      update: data,
    });
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
  }

  async countForUser(userId: string): Promise<number> {
    return this.prisma.pushSubscription.count({ where: { userId } });
  }

  /** Mengirim ke semua perangkat pengguna. Langganan kedaluwarsa dihapus. */
  async sendToUser(userId: string, payload: PushPayload): Promise<number> {
    if (!this.enabled) return 0;
    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
    const body = JSON.stringify(payload);
    const results = await Promise.all(subs.map((s) => this.sender.send(s, body)));
    const gone = subs.filter((_, i) => results[i] === 'gone').map((s) => s.id);
    if (gone.length) {
      await this.prisma.pushSubscription.deleteMany({ where: { id: { in: gone } } });
      this.logger.log({ userId, removed: gone.length }, 'Langganan push kedaluwarsa dihapus');
    }
    const failed = results.filter((r) => r === 'failed').length;
    if (failed) this.logger.warn({ userId, failed }, 'Sebagian notifikasi gagal dikirim');
    return results.filter((r) => r === 'sent').length;
  }

  async sendTest(userId: string): Promise<number> {
    this.assertEnabled();
    if ((await this.countForUser(userId)) === 0) {
      throw new AppException(
        ErrorCode.PUSH_NO_SUBSCRIPTION,
        'Belum ada perangkat yang mengaktifkan notifikasi',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    return this.sendToUser(userId, {
      title: 'Notifikasi aktif',
      body: 'Pengingat sholat dan agenda akan muncul seperti ini.',
      url: '/settings',
      tag: 'test',
    });
  }

  private assertEnabled() {
    if (!this.enabled) {
      throw new AppException(
        ErrorCode.PUSH_DISABLED,
        'Notifikasi belum diaktifkan di server (kunci VAPID kosong)',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
