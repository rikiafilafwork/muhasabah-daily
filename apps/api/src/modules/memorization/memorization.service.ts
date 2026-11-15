import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import {
  buildTikrarStages,
  ErrorCode,
  type MemorizationPlan,
  type Paginated,
  type StageInput,
  type UpdateMemorizationPlanInput,
} from '@muhasabah/shared';
import { AppException } from '../../common/app.exception';
import { notFound } from '../../common/not-found';
import { PrismaService } from '../../prisma/prisma.service';
import { QuranService } from '../quran/quran.service';
import type { CreatePlanDto } from './memorization.dto';

const include = {
  stages: { orderBy: { position: 'asc' } },
  surah: { select: { nameLatin: true } },
} satisfies Prisma.MemorizationPlanInclude;
type PlanRow = Prisma.MemorizationPlanGetPayload<{ include: typeof include }>;

function toPlan(p: PlanRow): MemorizationPlan {
  const total = p.stages.length;
  const current = Math.min(p.currentStage, total);
  return {
    id: p.id,
    surahId: p.surahId,
    surahName: p.surah.nameLatin,
    fromAyah: p.fromAyah,
    toAyah: p.toAyah,
    title: p.title,
    settings: {
      listenRepeat: p.listenRepeat,
      reciteRepeat: p.reciteRepeat,
      connectRepeat: p.connectRepeat,
    },
    currentStage: current,
    archived: p.archived,
    stages: p.stages.map((s) => ({
      position: s.position,
      kind: s.kind,
      fromAyah: s.fromAyah,
      toAyah: s.toAyah,
      repeat: s.repeat,
    })),
    progress: total ? Math.round((current / total) * 100) : 0,
    completed: total > 0 && current >= total,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

@Injectable()
export class MemorizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quran: QuranService,
  ) {}

  async list(userId: string, includeArchived = false): Promise<Paginated<MemorizationPlan>> {
    const rows = await this.prisma.memorizationPlan.findMany({
      where: { userId, ...(includeArchived ? {} : { archived: false }) },
      orderBy: [{ archived: 'asc' }, { createdAt: 'desc' }],
      include,
    });
    return { items: rows.map(toPlan), nextCursor: null };
  }

  async get(userId: string, id: string): Promise<MemorizationPlan> {
    return toPlan(await this.findOwned(userId, id));
  }

  async create(userId: string, input: CreatePlanDto): Promise<MemorizationPlan> {
    await this.quran.assertRange(input.surahId, input.fromAyah, input.toAyah);
    const stages = buildTikrarStages(input.fromAyah, input.toAyah, input.settings);
    const row = await this.prisma.memorizationPlan.create({
      data: {
        userId,
        surahId: input.surahId,
        fromAyah: input.fromAyah,
        toAyah: input.toAyah,
        title: input.title ?? null,
        ...input.settings,
        stages: { create: stages.map((s, position) => ({ ...s, position })) },
      },
      include,
    });
    return toPlan(row);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateMemorizationPlanInput,
  ): Promise<MemorizationPlan> {
    const plan = await this.findOwned(userId, id);
    if (input.currentStage !== undefined && input.currentStage > plan.stages.length) {
      throw new AppException(
        ErrorCode.VALIDATION_FAILED,
        'Tahap melebihi jumlah tahapan',
        HttpStatus.BAD_REQUEST,
      );
    }
    const row = await this.prisma.memorizationPlan.update({ where: { id }, data: input, include });
    return toPlan(row);
  }

  /**
   * Mengganti seluruh tahapan. Setiap tahap harus berada di dalam rentang rencana.
   * Progres disetel ulang ke awal karena urutan tahap berubah.
   */
  async setStages(userId: string, id: string, stages: StageInput[]): Promise<MemorizationPlan> {
    const plan = await this.findOwned(userId, id);
    const outside = stages.find((s) => s.fromAyah < plan.fromAyah || s.toAyah > plan.toAyah);
    if (outside) {
      throw new AppException(
        ErrorCode.AYAH_RANGE_INVALID,
        `Tahap harus di dalam ayat ${plan.fromAyah}–${plan.toAyah}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.prisma.$transaction([
      this.prisma.memorizationStage.deleteMany({ where: { planId: id } }),
      this.prisma.memorizationStage.createMany({
        data: stages.map((s, position) => ({ ...s, planId: id, position })),
      }),
      this.prisma.memorizationPlan.update({ where: { id }, data: { currentStage: 0 } }),
    ]);
    return this.get(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.memorizationPlan.deleteMany({ where: { id, userId } });
    if (count === 0) throw notFound(ErrorCode.MEMORIZATION_PLAN_NOT_FOUND, 'Rencana hafalan');
  }

  private async findOwned(userId: string, id: string): Promise<PlanRow> {
    const p = await this.prisma.memorizationPlan.findFirst({ where: { id, userId }, include });
    if (!p) throw notFound(ErrorCode.MEMORIZATION_PLAN_NOT_FOUND, 'Rencana hafalan');
    return p;
  }
}
