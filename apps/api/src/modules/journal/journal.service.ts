import { InjectQueue } from '@nestjs/bullmq';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { JournalEntry as EntryRow } from '../../generated/prisma/client';
import type { Queue } from 'bullmq';
import { createHash } from 'node:crypto';
import type Redis from 'ioredis';
import {
  addDays,
  ErrorCode,
  type AiStatus,
  type JournalEntry,
  type JournalSummary,
  type Paginated,
} from '@muhasabah/shared';
import { AppException } from '../../common/app.exception';
import { fromDbDate, toDbDate } from '../../common/date-only';
import { AppConfig } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUES } from '../../queue/connection';
import { REDIS } from '../../redis/redis.module';
import { AI_PROVIDER, type AiProvider } from '../ai/ai-provider';
import { UsersService } from '../users/users.service';

export const hashText = (text: string) => createHash('sha256').update(text).digest('hex');

export interface PolishJobData {
  entryId: string;
}

function toEntry(date: string, row: EntryRow | null): JournalEntry {
  if (!row) {
    return {
      date,
      rawText: '',
      polishedText: null,
      polishStatus: 'none',
      polishError: null,
      polishStale: false,
      updatedAt: null,
    };
  }
  return {
    date,
    rawText: row.rawText,
    polishedText: row.polishedText,
    polishStatus: row.polishStatus,
    polishError: row.polishError,
    polishStale: row.polishedText !== null && row.polishedRawHash !== hashText(row.rawText),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class JournalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly config: AppConfig,
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(AI_PROVIDER) private readonly ai: AiProvider | null,
    @InjectQueue(QUEUES.ai) private readonly queue: Queue<PolishJobData>,
  ) {}

  async list(userId: string, from?: string, to?: string): Promise<Paginated<JournalSummary>> {
    const { today } = await this.users.getClock(userId);
    const end = to ?? today;
    const start = from ?? addDays(end, -29);
    const rows = await this.prisma.journalEntry.findMany({
      where: { userId, date: { gte: toDbDate(start), lte: toDbDate(end) } },
      orderBy: { date: 'desc' },
      select: { date: true, rawText: true, polishedText: true },
    });
    return {
      items: rows.map((r) => ({
        date: fromDbDate(r.date),
        preview: r.rawText.replace(/\s+/g, ' ').trim().slice(0, 140),
        hasPolished: r.polishedText !== null,
      })),
      nextCursor: null,
    };
  }

  async get(userId: string, date: string): Promise<JournalEntry> {
    return toEntry(date, await this.find(userId, date));
  }

  /** Menyimpan teks asli. Teks kosong menghapus entri beserta versi rapinya. */
  async save(userId: string, date: string, rawText: string): Promise<JournalEntry> {
    await this.assertNotFuture(userId, date);
    if (!rawText.trim()) {
      await this.prisma.journalEntry.deleteMany({ where: { userId, date: toDbDate(date) } });
      return toEntry(date, null);
    }
    const row = await this.prisma.journalEntry.upsert({
      where: { userId_date: { userId, date: toDbDate(date) } },
      create: { userId, date: toDbDate(date), rawText },
      update: { rawText },
    });
    return toEntry(date, row);
  }

  async aiStatus(userId: string): Promise<AiStatus> {
    const { today } = await this.users.getClock(userId);
    const used = Number((await this.redis.get(this.quotaKey(userId, today))) ?? 0);
    return {
      enabled: this.ai !== null,
      provider: this.ai?.name ?? null,
      dailyLimit: this.config.get('AI_DAILY_LIMIT'),
      usedToday: used,
      maxInputChars: this.config.get('AI_MAX_INPUT_CHARS'),
    };
  }

  /**
   * Meminta AI Polish. Diproses di antrean `ai`; klien memantau lewat `GET /journal/:date`.
   * Teks jurnal hanya dikirim ke penyedia AI melalui jalur ini, atas permintaan pengguna.
   */
  async requestPolish(userId: string, date: string): Promise<JournalEntry> {
    if (!this.ai) {
      throw new AppException(
        ErrorCode.AI_DISABLED,
        'AI Polish tidak aktif di server ini',
        HttpStatus.NOT_IMPLEMENTED,
      );
    }
    const entry = await this.find(userId, date);
    if (!entry || !entry.rawText.trim()) {
      throw new AppException(
        ErrorCode.JOURNAL_EMPTY,
        'Tulis jurnal terlebih dahulu',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const max = this.config.get('AI_MAX_INPUT_CHARS');
    if (entry.rawText.length > max) {
      throw new AppException(
        ErrorCode.JOURNAL_TOO_LONG,
        `Jurnal terlalu panjang untuk dirapikan (maksimal ${max} karakter)`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    // Permintaan ulang saat masih diproses tidak menambah kuota.
    if (entry.polishStatus === 'pending') return toEntry(date, entry);

    const { today } = await this.users.getClock(userId);
    const key = this.quotaKey(userId, today);
    const used = await this.redis.incr(key);
    if (used === 1) await this.redis.expire(key, 2 * 24 * 3600);
    if (used > this.config.get('AI_DAILY_LIMIT')) {
      await this.redis.decr(key);
      throw new AppException(
        ErrorCode.AI_DAILY_LIMIT,
        'Batas AI Polish hari ini sudah tercapai',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const row = await this.prisma.journalEntry.update({
      where: { id: entry.id },
      data: { polishStatus: 'pending', polishError: null },
    });
    await this.queue.add(
      'polish',
      { entryId: entry.id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: 50,
      },
    );
    return toEntry(date, row);
  }

  /** Membuang versi rapi; teks asli tidak berubah. */
  async discardPolish(userId: string, date: string): Promise<JournalEntry> {
    const entry = await this.find(userId, date);
    if (!entry)
      throw new AppException(
        ErrorCode.JOURNAL_NOT_FOUND,
        'Jurnal tidak ditemukan',
        HttpStatus.NOT_FOUND,
      );
    const row = await this.prisma.journalEntry.update({
      where: { id: entry.id },
      data: {
        polishedText: null,
        polishedRawHash: null,
        polishedAt: null,
        polishStatus: 'none',
        polishError: null,
      },
    });
    return toEntry(date, row);
  }

  private find(userId: string, date: string) {
    return this.prisma.journalEntry.findUnique({
      where: { userId_date: { userId, date: toDbDate(date) } },
    });
  }

  private async assertNotFuture(userId: string, date: string) {
    const { today } = await this.users.getClock(userId);
    if (date > today) {
      throw new AppException(
        ErrorCode.JOURNAL_FUTURE_DATE,
        'Tidak bisa menulis jurnal untuk tanggal yang belum tiba',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  private quotaKey(userId: string, date: string) {
    return `ai:quota:${userId}:${date}`;
  }
}
