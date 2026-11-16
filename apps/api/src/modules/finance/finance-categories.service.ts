import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, type FinanceCategory as CategoryRow } from '../../generated/prisma/client';
import {
  DEFAULT_FINANCE_CATEGORIES,
  ErrorCode,
  type FinanceCategory,
  type Paginated,
  type UpdateFinanceCategoryInput,
} from '@muhasabah/shared';
import { AppException } from '../../common/app.exception';
import { notFound } from '../../common/not-found';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateFinanceCategoryDto } from './finance.dto';

type CategoryWithCount = CategoryRow & { _count: { transactions: number } };

function toCategory(c: CategoryWithCount): FinanceCategory {
  return {
    id: c.id,
    type: c.type,
    name: c.name,
    color: c.color,
    archived: c.archived,
    position: c.position,
    transactionCount: c._count.transactions,
  };
}

const withCount = { _count: { select: { transactions: true } } } as const;

const nameTaken = () =>
  new AppException(
    ErrorCode.FINANCE_CATEGORY_TAKEN,
    'Nama kategori sudah dipakai',
    HttpStatus.CONFLICT,
  );

const isUniqueViolation = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';

@Injectable()
export class FinanceCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Membuat kategori bawaan bila pengguna belum punya kategori sama sekali.
   * Aman dipanggil bersamaan: duplikat dilewati oleh indeks unik.
   */
  async ensureDefaults(userId: string): Promise<void> {
    const count = await this.prisma.financeCategory.count({ where: { userId } });
    if (count > 0) return;
    await this.prisma.financeCategory.createMany({
      data: DEFAULT_FINANCE_CATEGORIES.map((c, i) => ({ ...c, userId, position: i })),
      skipDuplicates: true,
    });
  }

  async list(userId: string, includeArchived = false): Promise<Paginated<FinanceCategory>> {
    await this.ensureDefaults(userId);
    const rows = await this.prisma.financeCategory.findMany({
      where: { userId, ...(includeArchived ? {} : { archived: false }) },
      orderBy: [{ type: 'asc' }, { archived: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
      include: withCount,
    });
    return { items: rows.map(toCategory), nextCursor: null };
  }

  async create(userId: string, input: CreateFinanceCategoryDto): Promise<FinanceCategory> {
    await this.ensureDefaults(userId);
    const last = await this.prisma.financeCategory.aggregate({
      where: { userId, type: input.type },
      _max: { position: true },
    });
    try {
      const row = await this.prisma.financeCategory.create({
        data: { userId, ...input, position: (last._max.position ?? -1) + 1 },
        include: withCount,
      });
      return toCategory(row);
    } catch (err) {
      if (isUniqueViolation(err)) throw nameTaken();
      throw err;
    }
  }

  async update(
    userId: string,
    id: string,
    input: UpdateFinanceCategoryInput,
  ): Promise<FinanceCategory> {
    await this.findOwned(userId, id);
    try {
      const row = await this.prisma.financeCategory.update({
        where: { id },
        data: input,
        include: withCount,
      });
      return toCategory(row);
    } catch (err) {
      if (isUniqueViolation(err)) throw nameTaken();
      throw err;
    }
  }

  /** Kategori yang sudah dipakai transaksi tidak bisa dihapus; arsipkan saja. */
  async remove(userId: string, id: string): Promise<void> {
    await this.findOwned(userId, id);
    const inUse = () =>
      new AppException(
        ErrorCode.FINANCE_CATEGORY_IN_USE,
        'Kategori masih dipakai transaksi. Arsipkan saja agar riwayat tetap utuh.',
        HttpStatus.CONFLICT,
      );
    const used = await this.prisma.financeTransaction.count({ where: { categoryId: id } });
    if (used > 0) throw inUse();
    try {
      await this.prisma.financeCategory.delete({ where: { id } });
    } catch (err) {
      // Transaksi baru masuk di antara pengecekan dan penghapusan (foreign key).
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw inUse();
      }
      throw err;
    }
  }

  async findOwned(userId: string, id: string): Promise<CategoryRow> {
    const c = await this.prisma.financeCategory.findFirst({ where: { id, userId } });
    if (!c) throw notFound(ErrorCode.FINANCE_CATEGORY_NOT_FOUND, 'Kategori');
    return c;
  }
}
