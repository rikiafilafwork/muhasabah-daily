import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import {
  addDays,
  ErrorCode,
  toLocalDate,
  type FocusSession,
  type FocusSessionList,
} from '@muhasabah/shared';
import { fromDbDate, toDbDate } from '../../common/date-only';
import { notFound } from '../../common/not-found';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { summarizeFocus } from './focus-summary';
import type { CreateFocusSessionDto, FocusSessionsQueryDto } from './focus.dto';

const DEFAULT_RANGE_DAYS = 7;
const include = { task: { select: { title: true } } } satisfies Prisma.FocusSessionInclude;
type Row = Prisma.FocusSessionGetPayload<{ include: typeof include }>;

function toSession(s: Row): FocusSession {
  return {
    id: s.id,
    startedAt: s.startedAt.toISOString(),
    endedAt: s.endedAt.toISOString(),
    date: fromDbDate(s.date),
    plannedSeconds: s.plannedSeconds,
    focusedSeconds: s.focusedSeconds,
    status: s.status,
    taskId: s.taskId,
    taskTitle: s.task?.title ?? null,
    label: s.label,
  };
}

@Injectable()
export class FocusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  async create(userId: string, input: CreateFocusSessionDto): Promise<FocusSession> {
    const { timezone } = await this.users.getClock(userId);
    if (input.taskId) {
      const owned = await this.prisma.task.count({ where: { id: input.taskId, userId } });
      if (!owned) throw notFound(ErrorCode.TASK_NOT_FOUND, 'Tugas');
    }
    const startedAt = new Date(input.startedAt);
    const row = await this.prisma.focusSession.create({
      data: {
        userId,
        taskId: input.taskId ?? null,
        label: input.label ?? null,
        startedAt,
        endedAt: new Date(input.endedAt),
        date: toDbDate(toLocalDate(startedAt, timezone)),
        plannedSeconds: input.plannedSeconds,
        focusedSeconds: input.focusedSeconds,
        status: input.status,
      },
      include,
    });
    return toSession(row);
  }

  async list(userId: string, q: FocusSessionsQueryDto): Promise<FocusSessionList> {
    const { today } = await this.users.getClock(userId);
    const to = q.to ?? today;
    const from = q.from ?? addDays(to, -(DEFAULT_RANGE_DAYS - 1));
    const rows = await this.prisma.focusSession.findMany({
      where: { userId, date: { gte: toDbDate(from), lte: toDbDate(to) } },
      orderBy: [{ startedAt: 'desc' }, { id: 'asc' }],
      include,
      take: 2000,
    });
    const items = rows.map(toSession);
    return { items, nextCursor: null, summary: summarizeFocus(from, to, items) };
  }

  async remove(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.focusSession.deleteMany({ where: { id, userId } });
    if (count === 0) throw notFound(ErrorCode.FOCUS_SESSION_NOT_FOUND, 'Sesi fokus');
  }
}
