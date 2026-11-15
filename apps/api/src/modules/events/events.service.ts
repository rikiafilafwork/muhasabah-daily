import { HttpStatus, Injectable } from '@nestjs/common';
import type { Event } from '../../generated/prisma/client';
import {
  ErrorCode,
  type CalendarEvent,
  type Paginated,
  type UpdateEventInput,
} from '@muhasabah/shared';
import { AppException } from '../../common/app.exception';
import { notFound } from '../../common/not-found';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateEventDto, EventsQueryDto } from './events.dto';

export function toCalendarEvent(e: Event): CalendarEvent {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    startAt: e.startAt.toISOString(),
    endAt: e.endAt.toISOString(),
    allDay: e.allDay,
    color: e.color,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Event yang beririsan dengan rentang `[from, to)`. */
  async list(userId: string, query: EventsQueryDto): Promise<Paginated<CalendarEvent>> {
    const events = await this.prisma.event.findMany({
      where: {
        userId,
        startAt: { lt: new Date(query.to) },
        endAt: { gte: new Date(query.from) },
      },
      orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
      take: 1000,
    });
    return { items: events.map(toCalendarEvent), nextCursor: null };
  }

  async get(userId: string, id: string): Promise<CalendarEvent> {
    return toCalendarEvent(await this.findOwned(userId, id));
  }

  async create(userId: string, input: CreateEventDto): Promise<CalendarEvent> {
    const e = await this.prisma.event.create({
      data: {
        userId,
        title: input.title,
        description: input.description ?? null,
        location: input.location ?? null,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
        allDay: input.allDay,
        color: input.color,
      },
    });
    return toCalendarEvent(e);
  }

  async update(userId: string, id: string, input: UpdateEventInput): Promise<CalendarEvent> {
    const current = await this.findOwned(userId, id);
    const startAt = input.startAt ? new Date(input.startAt) : current.startAt;
    const endAt = input.endAt ? new Date(input.endAt) : current.endAt;
    if (endAt < startAt) {
      throw new AppException(
        ErrorCode.VALIDATION_FAILED,
        'Waktu selesai harus setelah waktu mulai',
        HttpStatus.BAD_REQUEST,
        [{ path: 'endAt', message: 'Waktu selesai harus setelah waktu mulai' }],
      );
    }
    const e = await this.prisma.event.update({
      where: { id },
      data: { ...input, startAt, endAt },
    });
    return toCalendarEvent(e);
  }

  async remove(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.event.deleteMany({ where: { id, userId } });
    if (count === 0) throw notFound(ErrorCode.EVENT_NOT_FOUND, 'Agenda');
  }

  private async findOwned(userId: string, id: string): Promise<Event> {
    const e = await this.prisma.event.findFirst({ where: { id, userId } });
    if (!e) throw notFound(ErrorCode.EVENT_NOT_FOUND, 'Agenda');
    return e;
  }
}
