import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  computeGoalProgress,
  ErrorCode,
  type Goal,
  type Paginated,
  type UpdateGoalInput,
} from '@muhasabah/shared';
import { fromDbDate, fromDbDateOrNull, toDbDate } from '../../common/date-only';
import { notFound } from '../../common/not-found';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import type { CreateGoalDto } from './goals.dto';

const goalInclude = {
  habits: { include: { habit: { select: { id: true, name: true } } }, orderBy: { habitId: 'asc' } },
} satisfies Prisma.GoalInclude;

type GoalRow = Prisma.GoalGetPayload<{ include: typeof goalInclude }>;

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  async list(userId: string): Promise<Paginated<Goal>> {
    const rows = await this.prisma.goal.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      include: goalInclude,
    });
    return { items: await this.withProgress(rows), nextCursor: null };
  }

  async get(userId: string, id: string): Promise<Goal> {
    const row = await this.prisma.goal.findFirst({ where: { id, userId }, include: goalInclude });
    if (!row) throw notFound(ErrorCode.GOAL_NOT_FOUND, 'Goal');
    return (await this.withProgress([row]))[0];
  }

  async create(userId: string, input: CreateGoalDto): Promise<Goal> {
    const { today } = await this.users.getClock(userId);
    const links = input.habits ?? [];
    await this.assertHabitsOwned(
      userId,
      links.map((l) => l.habitId),
    );
    const row = await this.prisma.goal.create({
      data: {
        userId,
        title: input.title,
        description: input.description ?? null,
        target: input.target,
        unit: input.unit ?? null,
        manualValue: input.manualValue,
        startDate: toDbDate(input.startDate ?? today),
        deadline: input.deadline ? toDbDate(input.deadline) : null,
        habits: { create: links.map((l) => ({ habitId: l.habitId, weight: l.weight })) },
      },
    });
    return this.get(userId, row.id);
  }

  async update(userId: string, id: string, input: UpdateGoalInput): Promise<Goal> {
    await this.assertOwned(userId, id);
    const { startDate, deadline, ...rest } = input;
    await this.prisma.goal.update({
      where: { id },
      data: {
        ...rest,
        ...(startDate ? { startDate: toDbDate(startDate) } : {}),
        ...(deadline !== undefined ? { deadline: deadline ? toDbDate(deadline) : null } : {}),
      },
    });
    return this.get(userId, id);
  }

  /** Mengganti seluruh tautan habit goal. Habit harus milik pengguna yang sama. */
  async setHabits(
    userId: string,
    id: string,
    links: { habitId: string; weight: number }[],
  ): Promise<Goal> {
    await this.assertOwned(userId, id);
    await this.assertHabitsOwned(
      userId,
      links.map((l) => l.habitId),
    );
    await this.prisma.$transaction([
      this.prisma.goalHabit.deleteMany({ where: { goalId: id } }),
      this.prisma.goalHabit.createMany({
        data: links.map((l) => ({ goalId: id, habitId: l.habitId, weight: l.weight })),
      }),
    ]);
    return this.get(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.goal.deleteMany({ where: { id, userId } });
    if (count === 0) throw notFound(ErrorCode.GOAL_NOT_FOUND, 'Goal');
  }

  private async withProgress(rows: GoalRow[]): Promise<Goal[]> {
    const habitIds = [...new Set(rows.flatMap((g) => g.habits.map((h) => h.habitId)))];
    const earliest = rows.reduce<Date | null>(
      (min, g) => (min === null || g.startDate < min ? g.startDate : min),
      null,
    );
    const logs = habitIds.length
      ? await this.prisma.habitLog.findMany({
          where: { habitId: { in: habitIds }, done: true, date: { gte: earliest ?? undefined } },
          select: { habitId: true, date: true },
        })
      : [];

    return rows.map((g) => {
      const habits = g.habits.map((link) => {
        const doneCount = logs.filter(
          (l) => l.habitId === link.habitId && l.date >= g.startDate,
        ).length;
        return {
          habitId: link.habitId,
          name: link.habit.name,
          weight: link.weight,
          doneCount,
          contribution: doneCount * link.weight,
        };
      });
      return {
        id: g.id,
        title: g.title,
        description: g.description,
        target: g.target,
        unit: g.unit,
        manualValue: g.manualValue,
        startDate: fromDbDate(g.startDate),
        deadline: fromDbDateOrNull(g.deadline),
        createdAt: g.createdAt.toISOString(),
        habits,
        progress: computeGoalProgress({ target: g.target, manualValue: g.manualValue, habits }),
      };
    });
  }

  private async assertOwned(userId: string, id: string): Promise<void> {
    if (!(await this.prisma.goal.count({ where: { id, userId } }))) {
      throw notFound(ErrorCode.GOAL_NOT_FOUND, 'Goal');
    }
  }

  private async assertHabitsOwned(userId: string, habitIds: string[]): Promise<void> {
    if (!habitIds.length) return;
    const owned = await this.prisma.habit.count({ where: { id: { in: habitIds }, userId } });
    if (owned !== new Set(habitIds).size) throw notFound(ErrorCode.HABIT_NOT_FOUND, 'Habit');
  }
}
