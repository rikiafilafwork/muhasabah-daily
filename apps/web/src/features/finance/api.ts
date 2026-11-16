import type {
  CreateFinanceCategoryInput,
  CreateTransactionInput,
  FinanceCategory,
  FinanceMonthly,
  FinanceSummary,
  Paginated,
  Transaction,
  TransactionsQuery,
  UpdateFinanceCategoryInput,
  UpdateTransactionInput,
} from '@muhasabah/shared';
import { http } from '@/api/http';

export const financeApi = {
  categories: (includeArchived = false) =>
    http.get<Paginated<FinanceCategory>>('/finance/categories', {
      query: { includeArchived: includeArchived || undefined },
    }),
  createCategory: (input: CreateFinanceCategoryInput) =>
    http.post<FinanceCategory>('/finance/categories', input),
  updateCategory: (id: string, input: UpdateFinanceCategoryInput) =>
    http.patch<FinanceCategory>(`/finance/categories/${id}`, input),
  removeCategory: (id: string) => http.delete<void>(`/finance/categories/${id}`),

  transactions: (query: TransactionsQuery) =>
    http.get<Paginated<Transaction>>('/finance/transactions', { query: { ...query } }),
  create: (input: CreateTransactionInput) => http.post<Transaction>('/finance/transactions', input),
  update: (id: string, input: UpdateTransactionInput) =>
    http.patch<Transaction>(`/finance/transactions/${id}`, input),
  remove: (id: string) => http.delete<void>(`/finance/transactions/${id}`),

  summary: (month?: string) => http.get<FinanceSummary>('/finance/summary', { query: { month } }),
  monthly: (to?: string, months = 12) =>
    http.get<FinanceMonthly>('/finance/monthly', { query: { to, months } }),
};
