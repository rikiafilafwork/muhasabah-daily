import type {
  ApplyTemplateResult,
  CreatePlanInput,
  CreateTemplateItemInput,
  FinancePlan,
  FinanceTemplateItem,
  RealizePlanInput,
  UpdatePlanInput,
  UpdateTemplateItemInput,
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

export const budgetApi = {
  template: () => http.get<Paginated<FinanceTemplateItem>>('/finance/template'),
  createTemplateItem: (input: CreateTemplateItemInput) =>
    http.post<FinanceTemplateItem>('/finance/template', input),
  updateTemplateItem: (id: string, input: UpdateTemplateItemInput) =>
    http.patch<FinanceTemplateItem>(`/finance/template/${id}`, input),
  removeTemplateItem: (id: string) => http.delete<void>(`/finance/template/${id}`),

  plans: (month: string) =>
    http.get<Paginated<FinancePlan>>('/finance/plans', { query: { month } }),
  applyTemplate: (month: string) =>
    http.post<ApplyTemplateResult>('/finance/plans/apply-template', { month }),
  createPlan: (input: CreatePlanInput) => http.post<FinancePlan>('/finance/plans', input),
  updatePlan: (id: string, input: UpdatePlanInput) =>
    http.patch<FinancePlan>(`/finance/plans/${id}`, input),
  removePlan: (id: string) => http.delete<void>(`/finance/plans/${id}`),
  realize: (id: string, input: RealizePlanInput) =>
    http.post<Transaction>(`/finance/plans/${id}/realize`, input),
  unrealize: (id: string) => http.delete<FinancePlan>(`/finance/plans/${id}/realize`),
};
