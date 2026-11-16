import { createZodDto } from 'nestjs-zod';
import {
  createFinanceCategorySchema,
  createTransactionSchema,
  financeCategoriesQuerySchema,
  financeMonthlyQuerySchema,
  financeSummaryQuerySchema,
  transactionsQuerySchema,
  updateFinanceCategorySchema,
  updateTransactionSchema,
} from '@muhasabah/shared';

export class CreateFinanceCategoryDto extends createZodDto(createFinanceCategorySchema) {}
export class UpdateFinanceCategoryDto extends createZodDto(updateFinanceCategorySchema) {}
export class FinanceCategoriesQueryDto extends createZodDto(financeCategoriesQuerySchema) {}
export class CreateTransactionDto extends createZodDto(createTransactionSchema) {}
export class UpdateTransactionDto extends createZodDto(updateTransactionSchema) {}
export class TransactionsQueryDto extends createZodDto(transactionsQuerySchema) {}
export class FinanceSummaryQueryDto extends createZodDto(financeSummaryQuerySchema) {}
export class FinanceMonthlyQueryDto extends createZodDto(financeMonthlyQuerySchema) {}
