import { HttpStatus, Injectable } from '@nestjs/common';
import type { Habit as HabitRow } from '../../generated/prisma/client';
import {
  addDays,
  ErrorCode,
  type Habit,
  type HabitCategory,
  type HabitInsights,
  type HabitTemplate,
  type Paginated,
  type UpdateHabitInput,
} from '@muhasabah/shared';
import { AppException } from '../../common/app.exception';
import { fromDbDate, toDbDate } from '../../common/date-only';
import { notFound } from '../../common/not-found';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { computeHabitStats, summarizeHabitStats } from './habit-insights';
import type { CreateHabitDto, HabitInsightsQueryDto, HabitsQueryDto } from './habits.dto';

/** Default rentang: 7 hari terakhir untuk grid, 30 hari untuk insight. */
const DEFAULT_GRID_DAYS = 7;
const DEFAULT_INSIGHT_DAYS = 30;

function toHabit(h: HabitRow, logs: Date[]): Habit {
  return {
    id: h.id,
    name: h.name,
    templateId: h.templateId,
    color: h.color,
    position: h.position,
    active: h.active,
    startDate: fromDbDate(h.startDate),
    createdAt: h.createdAt.toISOString(),
    logs: logs.map(fromDbDate).sort(),
  };
}

@Injectable()
export class HabitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  async templates(): Promise<Paginated<HabitTemplate>> {
    const rows = await this.prisma.habitTemplate.findMany({
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
    return {
      items: rows.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category as HabitCategory,
        description: t.description,
        reference: t.reference,
      })),
      nextCursor: null,
    };
  }

  async list(userId: string, q: HabitsQueryDto): Promise<Paginated<Habit>> {
    const { today } = await this.users.getClock(userId);
    const to = q.to ?? today;
    const from = q.from ?? addDays(to, -(DEFAULT_GRID_DAYS - 1));
    const rows = await this.prisma.habit.findMany({
      where: { userId, ...(q.includeInactive ? {} : { active: true }) },
      orderBy: [{ active: 'desc' }, { position: 'asc' }, { createdAt: 'asc' }],
      include: {
        logs: {
          where: { done: true, date: { gte: toDbDate(from), lte: toDbDate(to) } },
          select: { date: true },
        },
      },
    });
    return {
      items: rows.map((h) =>
        toHabit(
          h,
          h.logs.map((l) => l.date),
        ),
      ),
      nextCursor: null,
    };
  }

  async create(userId: string, input: CreateHabitDto): Promise<Habit> {
    const { today } = await this.users.getClock(userId);
    let name = input.name;
    if (input.templateId) {
      const template = await this.prisma.habitTemplate.findUnique({
        where: { id: input.templateId },
      });
      if (!template) throw notFound(ErrorCode.HABIT_TEMPLATE_NOT_FOUND, 'Template habit');
      name ??= template.name;
    }
    const last = await this.prisma.habit.aggregate({ where: { userId }, _max: { position: true } });
    const row = await this.prisma.habit.create({
      data: {
        userId,
        name: name!,
        templateId: input.templateId ?? null,
        color: input.color,
        startDate: toDbDate(input.startDate ?? today),
        position: (last._max.position ?? -1) + 1,
      },
    });
    return toHabit(row, []);
  }

  async update(userId: string, id: string, input: UpdateHabitInput): Promise<Habit> {
    await this.findOwned(userId, id);
    const { startDate, ...rest } = input;
    const row = await this.prisma.habit.update({
      where: { id },
      data: { ...rest, ...(startDate ? { startDate: toDbDate(startDate) } : {}) },
    });
    return toHabit(row, []);
  }

  async remove(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.habit.deleteMany({ where: { id, userId } });
    if (count === 0) throw notFound(ErrorCode.HABIT_NOT_FOUND, 'Habit');
  }

  /** Mencentang atau membatalkan centang habit pada satu tanggal. Idempoten. */
  async setLog(userId: string, id: string, date: string, done: boolean) {
    const habit = await this.findOwned(userId, id);
    const { today } = await this.users.getClock(userId);
    if (date > today) {
      throw new AppException(
        ErrorCode.HABIT_LOG_FUTURE_DATE,
        'Tidak bisa mencentang tanggal yang belum tiba',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    if (date < fromDbDate(habit.startDate)) {
      throw new AppException(
        ErrorCode.HABIT_LOG_BEFORE_START,
        'Tanggal sebelum habit dimulai. Ubah tanggal mulai habit terlebih dahulu.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const key = { habitId_date: { habitId: id, date: toDbDate(date) } };
    if (done) {
      await this.prisma.habitLog.upsert({
        where: key,
        create: { habitId: id, date: toDbDate(date), done: true },
        update: { done: true },
      });
    } else {
      await this.prisma.habitLog.deleteMany({ where: { habitId: id, date: toDbDate(date) } });
    }
    return { habitId: id, date, done };
  }

  async insights(userId: string, q: HabitInsightsQueryDto): Promise<HabitInsights> {
    const { today } = await this.users.getClock(userId);
    const to = q.to ?? today;
    const from = q.from ?? addDays(to, -(DEFAULT_INSIGHT_DAYS - 1));

    // Semua log sampai `to` dimuat agar streak berjalan dan proyeksi tidak terpotong rentang.
    const habits = await this.prisma.habit.findMany({
      where: { userId, active: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      include: {
        logs: {
          where: { done: true, date: { lte: toDbDate(today > to ? today : to) } },
          select: { date: true },
        },
      },
    });

    const perHabit = habits.map((h) => ({
      habitId: h.id,
      name: h.name,
      ...computeHabitStats({
        startDate: fromDbDate(h.startDate),
        doneDates: h.logs.map((l) => fromDbDate(l.date)),
        from,
        to,
        today,
      }),
    }));

    return { from, to, summary: summarizeHabitStats(perHabit), habits: perHabit };
  }

  private async findOwned(userId: string, id: string): Promise<HabitRow> {
    const h = await this.prisma.habit.findFirst({ where: { id, userId } });
    if (!h) throw notFound(ErrorCode.HABIT_NOT_FOUND, 'Habit');
    return h;
  }
}
