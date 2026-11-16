import { HttpStatus, Injectable } from '@nestjs/common';
import {
  Prisma,
  type FinanceCategory as CategoryRow,
  type FinanceTransaction as TransactionRow,
} from '../../generated/prisma/client';
import {
  ErrorCode,
  addMonths,
  monthOf,
  monthRange,
  type FinanceMonthly,
  type FinanceSummary,
  type MonthTotals,
  type Paginated,
  type Transaction,
  type TransactionType,
  type UpdateTransactionInput,
} from '@muhasabah/shared';
import { AppException } from '../../common/app.exception';
import { fromDbDate, toDbDate } from '../../common/date-only';
import { notFound } from '../../common/not-found';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { FinanceCategoriesService } from './finance-categories.service';
import type {
  CreateTransactionDto,
  FinanceMonthlyQueryDto,
  TransactionsQueryDto,
} from './finance.dto';

type TransactionWithCategory = TransactionRow & {
  category: Pick<CategoryRow, 'id' | 'name' | 'color'>;
};

const withCategory = { category: { select: { id: true, name: true, color: true } } } as const;

export function toTransaction(t: TransactionWithCategory): Transaction {
  return {
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    date: fromDbDate(t.date),
    note: t.note,
    category: t.category,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

/** Rentang kolom `date` untuk satu bulan. */
function monthWhere(month: string) {
  const { from, to } = monthRange(month);
  return { gte: toDbDate(from), lte: toDbDate(to) };
}

/** Menjumlahkan baris `{type, total}` menjadi total bulanan. Fungsi murni agar mudah dites. */
export function totalsOf(
  month: string,
  rows: { type: TransactionType; total: bigint | number | null }[],
): MonthTotals {
  let income = 0;
  let expense = 0;
  for (const r of rows) {
    const v = Number(r.total ?? 0);
    if (r.type === 'income') income += v;
    else expense += v;
  }
  return { month, income, expense, balance: income - expense };
}

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly categories: FinanceCategoriesService,
  ) {}

  private async currentMonth(userId: string): Promise<string> {
    const { today } = await this.users.getClock(userId);
    return monthOf(today);
  }

  async list(userId: string, q: TransactionsQueryDto): Promise<Paginated<Transaction>> {
    const month = q.month ?? (await this.currentMonth(userId));
    if (q.cursor) {
      const owned = await this.prisma.financeTransaction.count({
        where: { id: q.cursor, userId },
      });
      if (!owned) {
        throw new AppException(
          ErrorCode.INVALID_CURSOR,
          'Kursor tidak valid',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    const rows = await this.prisma.financeTransaction.findMany({
      where: {
        userId,
        date: monthWhere(month),
        ...(q.type ? { type: q.type } : {}),
        ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      include: withCategory,
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > q.limit;
    const items = rows.slice(0, q.limit);
    return {
      items: items.map(toTransaction),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  async get(userId: string, id: string): Promise<Transaction> {
    return toTransaction(await this.findOwned(userId, id));
  }

  async create(userId: string, input: CreateTransactionDto): Promise<Transaction> {
    const category = await this.categories.findOwned(userId, input.categoryId);
    const row = await this.prisma.financeTransaction.create({
      data: {
        userId,
        categoryId: category.id,
        type: category.type,
        amount: BigInt(input.amount),
        date: toDbDate(input.date),
        note: input.note ?? null,
      },
      include: withCategory,
    });
    return toTransaction(row);
  }

  async update(userId: string, id: string, input: UpdateTransactionInput): Promise<Transaction> {
    await this.findOwned(userId, id);
    const data: Prisma.FinanceTransactionUncheckedUpdateInput = {};
    if (input.categoryId !== undefined) {
      // Jenis transaksi selalu mengikuti kategori.
      const category = await this.categories.findOwned(userId, input.categoryId);
      data.categoryId = category.id;
      data.type = category.type;
    }
    if (input.amount !== undefined) data.amount = BigInt(input.amount);
    if (input.date !== undefined) data.date = toDbDate(input.date);
    if (input.note !== undefined) data.note = input.note;
    const row = await this.prisma.financeTransaction.update({
      where: { id },
      data,
      include: withCategory,
    });
    return toTransaction(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.financeTransaction.deleteMany({ where: { id, userId } });
    if (count === 0) throw notFound(ErrorCode.TRANSACTION_NOT_FOUND, 'Transaksi');
  }

  async summary(userId: string, monthInput?: string): Promise<FinanceSummary> {
    const month = monthInput ?? (await this.currentMonth(userId));
    const prev = addMonths(month, -1);

    const [current, previous, byCategory] = await Promise.all([
      this.prisma.financeTransaction.groupBy({
        by: ['type'],
        where: { userId, date: monthWhere(month) },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.financeTransaction.groupBy({
        by: ['type'],
        where: { userId, date: monthWhere(prev) },
        _sum: { amount: true },
      }),
      this.prisma.financeTransaction.groupBy({
        by: ['categoryId'],
        where: { userId, date: monthWhere(month) },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    const cats = await this.prisma.financeCategory.findMany({
      where: { userId, id: { in: byCategory.map((r) => r.categoryId) } },
      select: { id: true, name: true, color: true, type: true },
    });
    const catById = new Map(cats.map((c) => [c.id, c]));

    return {
      ...totalsOf(
        month,
        current.map((r) => ({ type: r.type, total: r._sum.amount })),
      ),
      transactionCount: current.reduce((n, r) => n + r._count._all, 0),
      previous: totalsOf(
        prev,
        previous.map((r) => ({ type: r.type, total: r._sum.amount })),
      ),
      byCategory: byCategory
        .flatMap((r) => {
          const c = catById.get(r.categoryId);
          if (!c) return [];
          return [
            {
              categoryId: c.id,
              name: c.name,
              color: c.color,
              type: c.type,
              total: Number(r._sum.amount ?? 0),
              count: r._count._all,
            },
          ];
        })
        .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'id')),
    };
  }

  async monthly(userId: string, q: FinanceMonthlyQueryDto): Promise<FinanceMonthly> {
    const to = q.to ?? (await this.currentMonth(userId));
    const from = addMonths(to, -(q.months - 1));
    const rows = await this.prisma.$queryRaw<
      { month: string; type: TransactionType; total: bigint }[]
    >(Prisma.sql`
      SELECT to_char("date", 'YYYY-MM') AS month, "type"::text AS type, SUM("amount")::bigint AS total
      FROM "finance_transactions"
      WHERE "userId" = ${userId}
        AND "date" >= ${monthRange(from).from}::date
        AND "date" <= ${monthRange(to).to}::date
      GROUP BY 1, 2
    `);
    const months = Array.from({ length: q.months }, (_, i) => addMonths(from, i));
    return {
      months: months.map((m) =>
        totalsOf(
          m,
          rows.filter((r) => r.month === m),
        ),
      ),
    };
  }

  private async findOwned(userId: string, id: string): Promise<TransactionWithCategory> {
    const t = await this.prisma.financeTransaction.findFirst({
      where: { id, userId },
      include: withCategory,
    });
    if (!t) throw notFound(ErrorCode.TRANSACTION_NOT_FOUND, 'Transaksi');
    return t;
  }
}
