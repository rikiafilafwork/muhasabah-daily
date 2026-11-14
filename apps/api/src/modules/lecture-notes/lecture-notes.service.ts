import { HttpStatus, Injectable } from '@nestjs/common';
import type { LectureNote as NoteRow, Prisma } from '@prisma/client';
import {
  ErrorCode,
  extractRichDoc,
  type AyahRef,
  type LectureNote,
  type LectureNoteSummary,
  type Paginated,
  type RichNode,
  type UpdateLectureNoteInput,
} from '@muhasabah/shared';
import { AppException } from '../../common/app.exception';
import { fromDbDate, toDbDate } from '../../common/date-only';
import { notFound } from '../../common/not-found';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateLectureNoteDto, LectureNotesQueryDto } from './lecture-notes.dto';

type Doc = { type: 'doc'; content: RichNode[] };

function toSummary(n: NoteRow): LectureNoteSummary {
  return {
    id: n.id,
    title: n.title,
    speaker: n.speaker,
    date: fromDbDate(n.date),
    tags: n.tags,
    preview: n.contentText.replace(/\s+/g, ' ').slice(0, 160),
    ayahRefs: n.ayahRefs as unknown as AyahRef[],
    updatedAt: n.updatedAt.toISOString(),
  };
}

function toNote(n: NoteRow): LectureNote {
  return {
    ...toSummary(n),
    source: n.source,
    content: n.content as unknown as Doc,
    createdAt: n.createdAt.toISOString(),
  };
}

/** Kolom turunan dari dokumen editor: teks untuk pencarian dan daftar rujukan ayat. */
function derived(content: Doc) {
  const { text, ayahRefs } = extractRichDoc(content);
  return {
    content: content as unknown as Prisma.InputJsonValue,
    contentText: text,
    ayahRefs: ayahRefs as unknown as Prisma.InputJsonValue,
  };
}

const normalizeTags = (tags: string[]) => [...new Set(tags.map((t) => t.toLowerCase()))];

@Injectable()
export class LectureNotesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, q: LectureNotesQueryDto): Promise<Paginated<LectureNoteSummary>> {
    if (q.cursor && !(await this.prisma.lectureNote.count({ where: { id: q.cursor, userId } }))) {
      throw new AppException(
        ErrorCode.INVALID_CURSOR,
        'Kursor tidak valid',
        HttpStatus.BAD_REQUEST,
      );
    }
    const where: Prisma.LectureNoteWhereInput = { userId };
    if (q.q) {
      where.OR = [
        { title: { contains: q.q, mode: 'insensitive' } },
        { contentText: { contains: q.q, mode: 'insensitive' } },
        { speaker: { contains: q.q, mode: 'insensitive' } },
        { tags: { has: q.q.toLowerCase() } },
      ];
    }
    const rows = await this.prisma.lectureNote.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > q.limit;
    const items = rows.slice(0, q.limit);
    return { items: items.map(toSummary), nextCursor: hasMore ? items.at(-1)!.id : null };
  }

  async get(userId: string, id: string): Promise<LectureNote> {
    return toNote(await this.findOwned(userId, id));
  }

  async create(userId: string, input: CreateLectureNoteDto): Promise<LectureNote> {
    const row = await this.prisma.lectureNote.create({
      data: {
        userId,
        title: input.title,
        speaker: input.speaker ?? null,
        source: input.source ?? null,
        date: toDbDate(input.date),
        tags: normalizeTags(input.tags),
        ...derived(input.content as Doc),
      },
    });
    return toNote(row);
  }

  async update(userId: string, id: string, input: UpdateLectureNoteInput): Promise<LectureNote> {
    await this.findOwned(userId, id);
    const { content, date, tags, ...rest } = input;
    const row = await this.prisma.lectureNote.update({
      where: { id },
      data: {
        ...rest,
        ...(date ? { date: toDbDate(date) } : {}),
        ...(tags ? { tags: normalizeTags(tags) } : {}),
        ...(content ? derived(content as Doc) : {}),
      },
    });
    return toNote(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.lectureNote.deleteMany({ where: { id, userId } });
    if (count === 0) throw notFound(ErrorCode.LECTURE_NOTE_NOT_FOUND, 'Catatan kajian');
  }

  private async findOwned(userId: string, id: string): Promise<NoteRow> {
    const n = await this.prisma.lectureNote.findFirst({ where: { id, userId } });
    if (!n) throw notFound(ErrorCode.LECTURE_NOTE_NOT_FOUND, 'Catatan kajian');
    return n;
  }
}
