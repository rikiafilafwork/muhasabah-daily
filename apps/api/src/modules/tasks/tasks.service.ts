import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma, Task as TaskRow } from '@prisma/client';
import { ErrorCode, type Paginated, type Task, type UpdateTaskInput } from '@muhasabah/shared';
import { AppException } from '../../common/app.exception';
import { fromDbDate, fromDbDateOrNull, toDbDate } from '../../common/date-only';
import { notFound } from '../../common/not-found';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ProjectsService } from './projects.service';
import type { CreateTaskDto, TasksQueryDto } from './tasks.dto';

export function toTask(t: TaskRow, today: string): Task {
  return {
    id: t.id,
    title: t.title,
    notes: t.notes,
    projectId: t.projectId,
    priority: t.priority,
    dueDate: fromDbDateOrNull(t.dueDate),
    focusToday: t.focusDate !== null && fromDbDate(t.focusDate) === today,
    completed: t.completedAt !== null,
    completedAt: t.completedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

/** Membangun filter kueri tugas. Fungsi murni agar mudah dites. */
export function buildTaskWhere(
  userId: string,
  q: TasksQueryDto,
  today: string,
): Prisma.TaskWhereInput {
  const todayDb = toDbDate(today);
  const where: Prisma.TaskWhereInput = { userId };
  const and: Prisma.TaskWhereInput[] = [];

  if (q.status === 'open') where.completedAt = null;
  if (q.status === 'done') where.completedAt = { not: null };
  if (q.projectId) where.projectId = q.projectId === 'none' ? null : q.projectId;

  if (q.focusToday === true) where.focusDate = todayDb;
  if (q.focusToday === false)
    and.push({ OR: [{ focusDate: null }, { focusDate: { not: todayDb } }] });

  switch (q.due) {
    case 'today':
      where.dueDate = todayDb;
      break;
    case 'overdue':
      where.dueDate = { lt: todayDb };
      break;
    case 'upcoming':
      where.dueDate = { gt: todayDb };
      break;
    case 'none':
      where.dueDate = null;
      break;
  }
  if (and.length) where.AND = and;
  return where;
}

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly projects: ProjectsService,
  ) {}

  async list(userId: string, q: TasksQueryDto): Promise<Paginated<Task>> {
    const { today } = await this.users.getClock(userId);
    if (q.cursor) {
      const owned = await this.prisma.task.count({ where: { id: q.cursor, userId } });
      if (!owned) {
        throw new AppException(
          ErrorCode.INVALID_CURSOR,
          'Kursor tidak valid',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const orderBy: Prisma.TaskOrderByWithRelationInput[] =
      q.status === 'done'
        ? [{ completedAt: 'desc' }, { id: 'asc' }]
        : [
            { dueDate: { sort: 'asc', nulls: 'last' } },
            { priority: 'desc' },
            { createdAt: 'asc' },
            { id: 'asc' },
          ];

    const rows = await this.prisma.task.findMany({
      where: buildTaskWhere(userId, q, today),
      orderBy,
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > q.limit;
    const items = rows.slice(0, q.limit);
    return {
      items: items.map((t) => toTask(t, today)),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  async get(userId: string, id: string): Promise<Task> {
    const { today } = await this.users.getClock(userId);
    return toTask(await this.findOwned(userId, id), today);
  }

  async create(userId: string, input: CreateTaskDto): Promise<Task> {
    const { today } = await this.users.getClock(userId);
    if (input.projectId) await this.projects.assertOwned(userId, input.projectId);
    const row = await this.prisma.task.create({
      data: {
        userId,
        title: input.title,
        notes: input.notes ?? null,
        projectId: input.projectId ?? null,
        priority: input.priority,
        dueDate: input.dueDate ? toDbDate(input.dueDate) : null,
        focusDate: input.focusToday ? toDbDate(today) : null,
      },
    });
    return toTask(row, today);
  }

  async update(userId: string, id: string, input: UpdateTaskInput): Promise<Task> {
    const { today } = await this.users.getClock(userId);
    const current = await this.findOwned(userId, id);
    if (input.projectId) await this.projects.assertOwned(userId, input.projectId);

    const { completed, focusToday, dueDate, ...rest } = input;
    const data: Prisma.TaskUncheckedUpdateInput = { ...rest };
    if (dueDate !== undefined) data.dueDate = dueDate ? toDbDate(dueDate) : null;
    if (focusToday !== undefined) data.focusDate = focusToday ? toDbDate(today) : null;
    if (completed !== undefined) {
      // Pertahankan waktu selesai asli bila tugas sudah selesai sebelumnya.
      data.completedAt = completed ? (current.completedAt ?? new Date()) : null;
    }

    const row = await this.prisma.task.update({ where: { id }, data });
    return toTask(row, today);
  }

  async remove(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.task.deleteMany({ where: { id, userId } });
    if (count === 0) throw notFound(ErrorCode.TASK_NOT_FOUND, 'Tugas');
  }

  private async findOwned(userId: string, id: string): Promise<TaskRow> {
    const t = await this.prisma.task.findFirst({ where: { id, userId } });
    if (!t) throw notFound(ErrorCode.TASK_NOT_FOUND, 'Tugas');
    return t;
  }
}
