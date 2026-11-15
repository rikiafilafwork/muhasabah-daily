import { Injectable } from '@nestjs/common';
import type { Project as ProjectRow } from '../../generated/prisma/client';
import {
  ErrorCode,
  type Paginated,
  type Project,
  type UpdateProjectInput,
} from '@muhasabah/shared';
import { notFound } from '../../common/not-found';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateProjectDto } from './tasks.dto';

type ProjectWithCount = ProjectRow & { _count: { tasks: number } };

function toProject(p: ProjectWithCount): Project {
  return {
    id: p.id,
    name: p.name,
    color: p.color,
    archived: p.archived,
    position: p.position,
    openTaskCount: p._count.tasks,
    createdAt: p.createdAt.toISOString(),
  };
}

const withOpenCount = { _count: { select: { tasks: { where: { completedAt: null } } } } } as const;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, includeArchived = false): Promise<Paginated<Project>> {
    const rows = await this.prisma.project.findMany({
      where: { userId, ...(includeArchived ? {} : { archived: false }) },
      orderBy: [{ archived: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
      include: withOpenCount,
    });
    return { items: rows.map(toProject), nextCursor: null };
  }

  async create(userId: string, input: CreateProjectDto): Promise<Project> {
    const last = await this.prisma.project.aggregate({
      where: { userId },
      _max: { position: true },
    });
    const row = await this.prisma.project.create({
      data: {
        userId,
        name: input.name,
        color: input.color,
        position: (last._max.position ?? -1) + 1,
      },
      include: withOpenCount,
    });
    return toProject(row);
  }

  async update(userId: string, id: string, input: UpdateProjectInput): Promise<Project> {
    await this.assertOwned(userId, id);
    const row = await this.prisma.project.update({
      where: { id },
      data: input,
      include: withOpenCount,
    });
    return toProject(row);
  }

  /** Menghapus proyek. Tugasnya tidak ikut terhapus, melainkan pindah ke Inbox (tanpa proyek). */
  async remove(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.project.deleteMany({ where: { id, userId } });
    if (count === 0) throw notFound(ErrorCode.PROJECT_NOT_FOUND, 'Proyek');
  }

  async assertOwned(userId: string, id: string): Promise<void> {
    const found = await this.prisma.project.count({ where: { id, userId } });
    if (!found) throw notFound(ErrorCode.PROJECT_NOT_FOUND, 'Proyek');
  }
}
