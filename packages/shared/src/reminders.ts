import { z } from 'zod';
import { OBLIGATORY_PRAYERS } from './prayer-times';

/** Pilihan pengingat agenda, dalam menit sebelum mulai (0 = saat mulai). */
export const EVENT_REMINDER_MINUTES = [0, 5, 10, 15, 30, 60, 1440] as const;
export type EventReminderMinutes = (typeof EVENT_REMINDER_MINUTES)[number];

export const eventReminderSchema = z
  .number()
  .int()
  .refine((v) => (EVENT_REMINDER_MINUTES as readonly number[]).includes(v), {
    message: 'Pilihan pengingat tidak dikenal',
  })
  .nullable();

export function eventReminderLabel(minutes: number | null): string {
  if (minutes === null) return 'Tanpa pengingat';
  if (minutes === 0) return 'Saat mulai';
  if (minutes === 1440) return '1 hari sebelumnya';
  if (minutes % 60 === 0) return `${minutes / 60} jam sebelumnya`;
  return `${minutes} menit sebelumnya`;
}

/** Sholat yang diingatkan saat waktunya masuk. */
export const prayerRemindersSchema = z
  .array(z.enum(OBLIGATORY_PRAYERS))
  .max(OBLIGATORY_PRAYERS.length)
  .transform((list) => OBLIGATORY_PRAYERS.filter((p) => list.includes(p)));

/**
 * Host layanan push browser yang diterima. Server hanya mengirim ke host ini,
 * agar endpoint langganan tidak bisa dipakai untuk memanggil alamat sembarang.
 */
export const PUSH_SERVICE_HOSTS = [
  'fcm.googleapis.com',
  'push.services.mozilla.com',
  'push.apple.com',
  'notify.windows.com',
] as const;

export function isAllowedPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.port !== '') return false;
  const host = url.hostname.toLowerCase();
  return PUSH_SERVICE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

export const pushSubscriptionSchema = z
  .object({
    endpoint: z
      .string()
      .max(1000)
      .refine(isAllowedPushEndpoint, { message: 'Layanan push tidak dikenal' }),
    keys: z
      .object({
        p256dh: z.string().min(1).max(200),
        auth: z.string().min(1).max(100),
      })
      .strict(),
  })
  .strict();
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;

export const pushUnsubscribeSchema = z.object({ endpoint: z.string().max(1000) }).strict();
export type PushUnsubscribeInput = z.infer<typeof pushUnsubscribeSchema>;

export interface PushConfig {
  /** `false` bila server belum punya kunci VAPID. */
  enabled: boolean;
  publicKey: string | null;
}

export interface PushTestResult {
  sent: number;
}

/** Isi notifikasi yang dibaca service worker. */
export interface PushPayload {
  title: string;
  body: string;
  /** Halaman yang dibuka saat notifikasi diklik. */
  url: string;
  /** Notifikasi dengan tag sama saling menggantikan. */
  tag: string;
}
