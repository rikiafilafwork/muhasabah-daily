import { HttpStatus, Injectable } from '@nestjs/common';
import {
  DHIKR_GROUPS,
  ErrorCode,
  type DhikrGroup,
  type DhikrList,
  type DhikrSummary,
} from '@muhasabah/shared';
import { AppException } from '../../common/app.exception';
import { toDbDate } from '../../common/date-only';
import { notFound } from '../../common/not-found';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class DhikrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  /** Konten satu grup beserta hitungan pengguna pada tanggal tersebut. */
  async list(userId: string, group: DhikrGroup, date?: string): Promise<DhikrList> {
    const day = date ?? (await this.users.getClock(userId)).today;
    const items = await this.prisma.dhikrItem.findMany({
      where: { group },
      orderBy: { position: 'asc' },
      include: { logs: { where: { userId, date: toDbDate(day) }, select: { count: true } } },
    });
    return {
      date: day,
      group,
      nextCursor: null,
      items: items.map(({ logs, ...item }) => ({ ...item, count: logs[0]?.count ?? 0 })),
    };
  }

  async summary(userId: string, date?: string): Promise<DhikrSummary> {
    const day = date ?? (await this.users.getClock(userId)).today;
    const items = await this.prisma.dhikrItem.findMany({
      select: {
        group: true,
        repeat: true,
        logs: { where: { userId, date: toDbDate(day) }, select: { count: true } },
      },
    });
    return {
      date: day,
      groups: DHIKR_GROUPS.map((group) => {
        const inGroup = items.filter((i) => i.group === group);
        return {
          group,
          total: inGroup.length,
          completed: inGroup.filter((i) => (i.logs[0]?.count ?? 0) >= i.repeat).length,
        };
      }),
    };
  }

  /**
   * Menetapkan hitungan (bukan menambah), sehingga aman dikirim ulang dari antrean
   * klien saat offline. `count: 0` menghapus log.
   */
  async setCount(userId: string, dhikrId: string, date: string, count: number) {
    const { today } = await this.users.getClock(userId);
    if (date > today) {
      throw new AppException(
        ErrorCode.DHIKR_LOG_FUTURE_DATE,
        'Tidak bisa mencatat dzikir untuk tanggal yang belum tiba',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const exists = await this.prisma.dhikrItem.count({ where: { id: dhikrId } });
    if (!exists) throw notFound(ErrorCode.DHIKR_NOT_FOUND, 'Dzikir');

    const key = { userId, dhikrId, date: toDbDate(date) };
    if (count === 0) {
      await this.prisma.dhikrLog.deleteMany({ where: key });
    } else {
      await this.prisma.dhikrLog.upsert({
        where: { userId_dhikrId_date: key },
        create: { ...key, count },
        update: { count },
      });
    }
    return { dhikrId, date, count };
  }
}
