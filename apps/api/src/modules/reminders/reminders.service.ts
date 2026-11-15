import { Inject, Injectable, Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import { OBLIGATORY_PRAYERS, toLocalDate, type ObligatoryPrayer } from '@muhasabah/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS } from '../../redis/redis.module';
import { PrayerTimesService } from '../prayer-times/prayer-times.service';
import { PushService } from './push.service';
import { eventMessage, prayerMessage } from './reminder-messages';

/**
 * Pengingat yang terlambat lebih dari ini (mis. API sempat mati) tidak dikirim lagi,
 * agar pengguna tidak menerima tumpukan notifikasi basi.
 */
export const REMINDER_GRACE_MS = 10 * 60_000;
const PRAYER_DEDUPE_TTL = 2 * 24 * 3600;

export interface TickResult {
  events: number;
  prayers: number;
}

/** Dijalankan tiap menit oleh antrean `reminders`. Aman dipanggil berulang (idempoten). */
@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
    private readonly prayerTimes: PrayerTimesService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async tick(now: Date = new Date()): Promise<TickResult> {
    if (!this.push.enabled) return { events: 0, prayers: 0 };
    const [events, prayers] = await Promise.all([
      this.sendEventReminders(now),
      this.sendPrayerReminders(now),
    ]);
    return { events, prayers };
  }

  async sendEventReminders(now: Date): Promise<number> {
    const due = await this.prisma.event.findMany({
      where: {
        remindAt: { lte: now, gt: new Date(now.getTime() - REMINDER_GRACE_MS) },
        reminderSentAt: null,
        user: { pushSubscriptions: { some: {} } },
      },
      include: { user: { select: { timezone: true } } },
      orderBy: { remindAt: 'asc' },
      take: 500,
    });
    let sent = 0;
    for (const e of due) {
      // Klaim dulu: proses lain (atau tick berikutnya) tidak akan mengirim ulang.
      const { count } = await this.prisma.event.updateMany({
        where: { id: e.id, reminderSentAt: null, remindAt: e.remindAt },
        data: { reminderSentAt: now },
      });
      if (count === 0) continue;
      if ((await this.push.sendToUser(e.userId, eventMessage(e, e.user.timezone))) > 0) sent++;
    }
    return sent;
  }

  async sendPrayerReminders(now: Date): Promise<number> {
    const users = await this.prisma.user.findMany({
      where: {
        prayerReminders: { isEmpty: false },
        latitude: { not: null },
        longitude: { not: null },
        pushSubscriptions: { some: {} },
      },
      select: {
        id: true,
        city: true,
        latitude: true,
        longitude: true,
        timezone: true,
        prayerReminders: true,
      },
    });
    let sent = 0;
    for (const u of users) {
      const date = toLocalDate(now, u.timezone);
      let timings;
      try {
        const pt = await this.prayerTimes.getForLocation(
          { latitude: u.latitude!, longitude: u.longitude!, timezone: u.timezone },
          date,
        );
        // Jadwal perkiraan dari cache lama tidak dipakai untuk notifikasi.
        if (pt.stale) continue;
        timings = pt.timings;
      } catch (err) {
        this.logger.warn({ userId: u.id, err: (err as Error).message }, 'Waktu sholat gagal');
        continue;
      }
      const enabled = OBLIGATORY_PRAYERS.filter((p) => u.prayerReminders.includes(p));
      for (const prayer of enabled) {
        const at = new Date(timings[prayer]);
        const late = now.getTime() - at.getTime();
        if (late < 0 || late >= REMINDER_GRACE_MS) continue;
        if (!(await this.claimPrayer(u.id, date, prayer))) continue;
        const n = await this.push.sendToUser(u.id, prayerMessage(prayer, at, u.timezone, u.city));
        if (n > 0) sent++;
      }
    }
    return sent;
  }

  /** `true` bila pengingat sholat ini belum pernah dikirim. Redis gagal = jangan kirim. */
  private async claimPrayer(userId: string, date: string, prayer: ObligatoryPrayer) {
    try {
      const ok = await this.redis.set(
        `rem:prayer:${userId}:${date}:${prayer}`,
        '1',
        'EX',
        PRAYER_DEDUPE_TTL,
        'NX',
      );
      return ok === 'OK';
    } catch (err) {
      this.logger.warn({ err: (err as Error).message }, 'Redis gagal, pengingat sholat dilewati');
      return false;
    }
  }
}
