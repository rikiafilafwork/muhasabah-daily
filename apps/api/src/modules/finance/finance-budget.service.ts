import { HttpStatus, Injectable } from '@nestjs/common';
import {
  Prisma,
  type FinanceCategory as CategoryRow,
  type FinancePlan as PlanRow,
  type FinanceTemplateItem as TemplateRow,
} from '../../generated/prisma/client';
import {
  ErrorCode,
  FINANCE_TEMPLATE_MAX_ITEMS,
  monthOf,
  planDateFor,
  type ApplyTemplateResult,
  type FinancePlan,
  type FinanceTemplateItem,
  type Paginated,
  type UpdatePlanInput,
  type UpdateTemplateItemInput,
} from '@muhasabah/shared';
import { AppException } from '../../common/app.exception';
import { fromDbDate, toDbDate } from '../../common/date-only';
import { notFound } from '../../common/not-found';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { FinanceCategoriesService } from './finance-categories.service';
import { toTransaction } from './finance.service';
import type { CreatePlanDto, CreateTemplateItemDto, RealizePlanDto } from './finance.dto';
import type { Transaction } from '@muhasabah/shared';

type CategoryRef = Pick<CategoryRow, 'id' | 'name' | 'color' | 'type'>;
const categorySelect = { select: { id: true, name: true, color: true, type: true } } as const;

type TemplateWithCategory = TemplateRow & { category: CategoryRef };
type PlanWithRefs = PlanRow & {
  category: CategoryRef;
  transaction: { id: string; amount: bigint; date: Date } | null;
};
const planInclude = {
  category: categorySelect,
  transaction: { select: { id: true, amount: true, date: true } },
} as const;

const ref = (c: CategoryRef) => ({ id: c.id, name: c.name, color: c.color });

export function toTemplateItem(t: TemplateWithCategory): FinanceTemplateItem {
  return {
    id: t.id,
    name: t.name,
    type: t.category.type,
    amount: Number(t.amount),
    dayOfMonth: t.dayOfMonth,
    category: ref(t.category),
    position: t.position,
  };
}

export function toPlan(p: PlanWithRefs): FinancePlan {
  const amount = Number(p.amount);
  const tx = p.transaction
    ? {
        id: p.transaction.id,
        amount: Number(p.transaction.amount),
        date: fromDbDate(p.transaction.date),
      }
    : null;
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    amount,
    date: fromDbDate(p.date),
    month: p.month,
    category: ref(p.category),
    templateItemId: p.templateItemId,
    status: tx ? 'done' : 'pending',
    transaction: tx,
    difference: tx ? tx.amount - amount : null,
  };
}

const isPrismaError = (err: unknown, code: string) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === code;

@Injectable()
export class FinanceBudgetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly categories: FinanceCategoriesService,
  ) {}

  // ---------------------------------------------------------------- Template

  async listTemplate(userId: string): Promise<Paginated<FinanceTemplateItem>> {
    const rows = await this.prisma.financeTemplateItem.findMany({
      where: { userId },
      include: { category: categorySelect },
      orderBy: [{ dayOfMonth: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
    });
    return { items: rows.map(toTemplateItem), nextCursor: null };
  }

  async createTemplateItem(
    userId: string,
    input: CreateTemplateItemDto,
  ): Promise<FinanceTemplateItem> {
    await this.categories.findOwned(userId, input.categoryId);
    const count = await this.prisma.financeTemplateItem.count({ where: { userId } });
    if (count >= FINANCE_TEMPLATE_MAX_ITEMS) {
      throw new AppException(
        ErrorCode.FINANCE_TEMPLATE_FULL,
        `Template maksimal ${FINANCE_TEMPLATE_MAX_ITEMS} item`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const row = await this.prisma.financeTemplateItem.create({
      data: {
        userId,
        categoryId: input.categoryId,
        name: input.name,
        amount: BigInt(input.amount),
        dayOfMonth: input.dayOfMonth,
        position: count,
      },
      include: { category: categorySelect },
    });
    return toTemplateItem(row);
  }

  /** Mengubah template tidak mengubah rencana bulan yang sudah diterapkan. */
  async updateTemplateItem(
    userId: string,
    id: string,
    input: UpdateTemplateItemInput,
  ): Promise<FinanceTemplateItem> {
    await this.findTemplateItem(userId, id);
    if (input.categoryId) await this.categories.findOwned(userId, input.categoryId);
    const row = await this.prisma.financeTemplateItem.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.amount !== undefined ? { amount: BigInt(input.amount) } : {}),
        ...(input.dayOfMonth !== undefined ? { dayOfMonth: input.dayOfMonth } : {}),
      },
      include: { category: categorySelect },
    });
    return toTemplateItem(row);
  }

  async removeTemplateItem(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.financeTemplateItem.deleteMany({ where: { id, userId } });
    if (count === 0) throw notFound(ErrorCode.FINANCE_TEMPLATE_ITEM_NOT_FOUND, 'Item template');
  }

  // ---------------------------------------------------------------- Rencana

  async listPlans(userId: string, monthInput?: string): Promise<Paginated<FinancePlan>> {
    const month = monthInput ?? monthOf((await this.users.getClock(userId)).today);
    const rows = await this.prisma.financePlan.findMany({
      where: { userId, month },
      include: planInclude,
      orderBy: [{ date: 'asc' }, { type: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    return { items: rows.map(toPlan), nextCursor: null };
  }

  /**
   * Menyalin item template menjadi rencana di `month`. Item yang sudah ada di bulan itu
   * dilewati (indeks unik `templateItemId + month`), sehingga aman diulang.
   */
  async applyTemplate(userId: string, month: string): Promise<ApplyTemplateResult> {
    const template = await this.prisma.financeTemplateItem.findMany({
      where: { userId },
      include: { category: categorySelect },
    });
    const { count } = await this.prisma.financePlan.createMany({
      data: template.map((t) => ({
        userId,
        categoryId: t.categoryId,
        type: t.category.type,
        name: t.name,
        amount: t.amount,
        date: toDbDate(planDateFor(month, t.dayOfMonth)),
        month,
        templateItemId: t.id,
      })),
      skipDuplicates: true,
    });
    const { items } = await this.listPlans(userId, month);
    return { created: count, skipped: template.length - count, items };
  }

  async createPlan(userId: string, input: CreatePlanDto): Promise<FinancePlan> {
    const category = await this.categories.findOwned(userId, input.categoryId);
    const row = await this.prisma.financePlan.create({
      data: {
        userId,
        categoryId: category.id,
        type: category.type,
        name: input.name,
        amount: BigInt(input.amount),
        date: toDbDate(input.date),
        month: monthOf(input.date),
      },
      include: planInclude,
    });
    return toPlan(row);
  }

  async updatePlan(userId: string, id: string, input: UpdatePlanInput): Promise<FinancePlan> {
    await this.findPlan(userId, id);
    const data: Prisma.FinancePlanUncheckedUpdateInput = {};
    if (input.categoryId !== undefined) {
      const category = await this.categories.findOwned(userId, input.categoryId);
      data.categoryId = category.id;
      data.type = category.type;
    }
    if (input.name !== undefined) data.name = input.name;
    if (input.amount !== undefined) data.amount = BigInt(input.amount);
    if (input.date !== undefined) {
      data.date = toDbDate(input.date);
      data.month = monthOf(input.date);
    }
    try {
      const row = await this.prisma.financePlan.update({
        where: { id },
        data,
        include: planInclude,
      });
      return toPlan(row);
    } catch (err) {
      if (isPrismaError(err, 'P2002')) {
        throw new AppException(
          ErrorCode.FINANCE_PLAN_DUPLICATE,
          'Item template ini sudah ada di bulan tersebut',
          HttpStatus.CONFLICT,
        );
      }
      throw err;
    }
  }

  /** Menghapus rencana. Transaksi realisasinya (bila ada) tetap tercatat. */
  async removePlan(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.financePlan.deleteMany({ where: { id, userId } });
    if (count === 0) throw notFound(ErrorCode.FINANCE_PLAN_NOT_FOUND, 'Rencana');
  }

  /** Mencatat realisasi: membuat transaksi pada kategori rencana dan menautkannya. */
  async realize(userId: string, id: string, input: RealizePlanDto): Promise<Transaction> {
    const plan = await this.findPlan(userId, id);
    const realized = () =>
      new AppException(
        ErrorCode.FINANCE_PLAN_REALIZED,
        'Rencana ini sudah tercatat',
        HttpStatus.CONFLICT,
      );
    if (plan.transactionId) throw realized();
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.financeTransaction.create({
        data: {
          userId,
          categoryId: plan.categoryId,
          type: plan.type,
          amount: BigInt(input.amount),
          date: toDbDate(input.date),
          note: input.note ?? plan.name,
        },
      });
      // Klaim bersyarat agar dua klik bersamaan tidak membuat dua transaksi.
      const { count } = await tx.financePlan.updateMany({
        where: { id, transactionId: null },
        data: { transactionId: created.id },
      });
      if (count === 0) throw realized();
      const row = await tx.financeTransaction.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          category: { select: { id: true, name: true, color: true } },
          plan: { select: { id: true } },
        },
      });
      return toTransaction(row);
    });
  }

  /** Membatalkan realisasi: transaksinya dihapus dan rencana kembali belum terjadi. */
  async unrealize(userId: string, id: string): Promise<FinancePlan> {
    const plan = await this.findPlan(userId, id);
    if (!plan.transactionId) {
      throw new AppException(
        ErrorCode.FINANCE_PLAN_NOT_REALIZED,
        'Rencana ini belum tercatat',
        HttpStatus.CONFLICT,
      );
    }
    await this.prisma.financeTransaction.deleteMany({
      where: { id: plan.transactionId, userId },
    });
    const row = await this.prisma.financePlan.findUniqueOrThrow({
      where: { id },
      include: planInclude,
    });
    return toPlan(row);
  }

  private async findPlan(userId: string, id: string): Promise<PlanRow> {
    const p = await this.prisma.financePlan.findFirst({ where: { id, userId } });
    if (!p) throw notFound(ErrorCode.FINANCE_PLAN_NOT_FOUND, 'Rencana');
    return p;
  }

  private async findTemplateItem(userId: string, id: string): Promise<TemplateRow> {
    const t = await this.prisma.financeTemplateItem.findFirst({ where: { id, userId } });
    if (!t) throw notFound(ErrorCode.FINANCE_TEMPLATE_ITEM_NOT_FOUND, 'Item template');
    return t;
  }
}
