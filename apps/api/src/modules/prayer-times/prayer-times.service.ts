import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import {
  addDays,
  ErrorCode,
  getNextPrayer,
  PRAYER_LABELS,
  type NextPrayer,
  type PrayerKey,
  type PrayerTimes,
} from '@muhasabah/shared';
import { AppException } from '../../common/app.exception';
import { REDIS } from '../../redis/redis.module';
import { UsersService } from '../users/users.service';
import { ALADHAN_METHOD_KEMENAG, AladhanClient, type AladhanTimings } from './aladhan.client';
import { daysBetween, roundCoord, todayIn, ttlUntilEndOfDay } from './time-utils';

interface Location {
  latitude: number;
  longitude: number;
  timezone: string;
}

interface LastKnown extends AladhanTimings {
  date: string;
}

const LAST_KNOWN_TTL = 30 * 24 * 3600;
const DAY_MS = 86_400_000;

export function cacheKey(loc: Location, date: string): string {
  return `pt:${roundCoord(loc.latitude)},${roundCoord(loc.longitude)}:${date}:${ALADHAN_METHOD_KEMENAG}`;
}

export function lastKnownKey(loc: Location): string {
  return `pt:last:${roundCoord(loc.latitude)},${roundCoord(loc.longitude)}:${ALADHAN_METHOD_KEMENAG}`;
}

@Injectable()
export class PrayerTimesService {
  private readonly logger = new Logger(PrayerTimesService.name);

  constructor(
    private readonly users: UsersService,
    private readonly aladhan: AladhanClient,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async getForUser(userId: string, date?: string): Promise<PrayerTimes> {
    const loc = await this.getLocation(userId);
    return this.getForLocation(loc, date ?? todayIn(loc.timezone));
  }

  async getNextForUser(userId: string, now: Date = new Date()): Promise<NextPrayer> {
    const loc = await this.getLocation(userId);
    const today = todayIn(loc.timezone, now);
    const todays = await this.getForLocation(loc, today);
    const next = getNextPrayer(todays.timings, now);
    if (next) return next;

    // Setelah Isya: sholat berikutnya adalah Subuh esok hari.
    const tomorrow = await this.getForLocation(loc, addDays(today, 1));
    const at = Date.parse(tomorrow.timings.fajr);
    return {
      prayer: 'fajr',
      label: PRAYER_LABELS.fajr,
      at: new Date(at).toISOString(),
      secondsRemaining: Math.max(0, Math.floor((at - now.getTime()) / 1000)),
    };
  }

  async getForLocation(loc: Location, date: string): Promise<PrayerTimes> {
    const key = cacheKey(loc, date);
    const cached = await this.cacheGet<AladhanTimings>(key);
    if (cached) return this.build(loc, date, cached, { cached: true, stale: false });

    try {
      const fresh = await this.aladhan.getTimings({ ...loc, date });
      await this.cacheSet(key, fresh, ttlUntilEndOfDay(date, loc.timezone, new Date()));
      await this.cacheSet(
        lastKnownKey(loc),
        { ...fresh, date } satisfies LastKnown,
        LAST_KNOWN_TTL,
      );
      return this.build(loc, date, fresh, { cached: false, stale: false });
    } catch (err) {
      this.logger.warn(
        { err: (err as Error).message },
        'AlAdhan gagal, mencoba data cache terakhir',
      );
      const last = await this.cacheGet<LastKnown>(lastKnownKey(loc));
      if (last) {
        // Geser jadwal terakhir yang diketahui ke tanggal yang diminta (perkiraan, ditandai stale).
        const shift = daysBetween(last.date, date) * DAY_MS;
        const timings = Object.fromEntries(
          Object.entries(last.timings).map(([k, v]) => [
            k,
            new Date(Date.parse(v) + shift).toISOString(),
          ]),
        ) as Record<PrayerKey, string>;
        return this.build(
          loc,
          date,
          { timings, method: last.method },
          { cached: true, stale: true },
        );
      }
      throw new AppException(
        ErrorCode.PRAYER_TIMES_UNAVAILABLE,
        'Waktu sholat sedang tidak tersedia',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async getLocation(userId: string): Promise<Location> {
    const user = await this.users.findById(userId);
    if (user.latitude == null || user.longitude == null) {
      throw new AppException(
        ErrorCode.PROFILE_LOCATION_MISSING,
        'Atur lokasi di profil untuk melihat waktu sholat',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    return { latitude: user.latitude, longitude: user.longitude, timezone: user.timezone };
  }

  private build(
    loc: Location,
    date: string,
    data: AladhanTimings,
    flags: { cached: boolean; stale: boolean },
  ): PrayerTimes {
    return { date, timezone: loc.timezone, timings: data.timings, method: data.method, ...flags };
  }

  /** Redis bersifat cache: kegagalannya tidak boleh memutus permintaan. */
  private async cacheGet<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      this.logger.warn({ err: (err as Error).message }, 'Gagal membaca cache');
      return null;
    }
  }

  private async cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn({ err: (err as Error).message }, 'Gagal menulis cache');
    }
  }
}
