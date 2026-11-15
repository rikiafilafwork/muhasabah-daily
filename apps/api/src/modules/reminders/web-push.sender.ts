import { Injectable } from '@nestjs/common';
import webpush from 'web-push';
import { AppConfig } from '../../config/app-config.service';

export interface StoredSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Hasil kirim: `gone` berarti langganan sudah tidak berlaku dan perlu dihapus. */
export type SendResult = 'sent' | 'gone' | 'failed';

/** Pembungkus tipis `web-push` agar bisa diganti tiruan di test. */
@Injectable()
export class WebPushSender {
  constructor(private readonly config: AppConfig) {}

  async send(sub: StoredSubscription, body: string): Promise<SendResult> {
    const publicKey = this.config.get('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get('VAPID_PRIVATE_KEY');
    if (!publicKey || !privateKey) return 'failed';
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        body,
        {
          TTL: 15 * 60,
          urgency: 'high',
          timeout: 10_000,
          vapidDetails: { subject: this.config.get('VAPID_SUBJECT'), publicKey, privateKey },
        },
      );
      return 'sent';
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      return status === 404 || status === 410 ? 'gone' : 'failed';
    }
  }
}
