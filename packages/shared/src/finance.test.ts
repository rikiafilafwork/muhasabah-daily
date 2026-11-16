import { describe, expect, it } from 'vitest';
import {
  addMonths,
  createTransactionSchema,
  formatAmountInput,
  formatRupiah,
  monthRange,
  monthSchema,
  parseRupiah,
} from './finance';

describe('finance', () => {
  it('mengurai isian nominal', () => {
    expect(parseRupiah('1.500.000')).toBe(1_500_000);
    expect(parseRupiah('Rp 25.000')).toBe(25_000);
    expect(parseRupiah('1,000')).toBe(1000);
    expect(parseRupiah('007')).toBe(7);
    expect(parseRupiah('')).toBeNull();
    expect(parseRupiah('abc')).toBeNull();
    expect(parseRupiah('99999999999999999999')).toBeNull();
  });

  it('memformat Rupiah', () => {
    expect(formatRupiah(1_500_000)).toBe('Rp 1.500.000');
    expect(formatRupiah(0)).toBe('Rp 0');
    expect(formatRupiah(-2500)).toMatch(/^-Rp 2\.500$/);
    expect(formatAmountInput(1_500_000)).toBe('1.500.000');
    expect(formatAmountInput(null)).toBe('');
  });

  it('aritmetika bulan', () => {
    expect(addMonths('2026-11', 1)).toBe('2026-12');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-11', -23)).toBe('2024-12');
    expect(monthRange('2026-02')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(monthRange('2028-02').to).toBe('2028-02-29');
    expect(monthRange('2026-11').to).toBe('2026-11-30');
  });

  it('memvalidasi bulan dan transaksi', () => {
    expect(monthSchema.safeParse('2026-11').success).toBe(true);
    expect(monthSchema.safeParse('2026-13').success).toBe(false);
    expect(monthSchema.safeParse('2026-1').success).toBe(false);
    const base = { amount: 1000, date: '2026-11-16', categoryId: 'abc123' };
    expect(createTransactionSchema.safeParse(base).success).toBe(true);
    expect(createTransactionSchema.safeParse({ ...base, amount: 0 }).success).toBe(false);
    expect(createTransactionSchema.safeParse({ ...base, type: 'income' }).success).toBe(false);
  });
});

describe('anggaran', () => {
  it('tanggal rencana dipotong ke akhir bulan', async () => {
    const { planDateFor } = await import('./finance');
    expect(planDateFor('2026-02', 31)).toBe('2026-02-28');
    expect(planDateFor('2028-02', 30)).toBe('2028-02-29');
    expect(planDateFor('2026-11', 5)).toBe('2026-11-05');
    expect(planDateFor('2026-12', 31)).toBe('2026-12-31');
  });
  it('selisih anggaran per jenis', async () => {
    const { budgetGap } = await import('./finance');
    expect(budgetGap('expense', 1000, 800)).toBe(200);
    expect(budgetGap('expense', 1000, 1200)).toBe(-200);
    expect(budgetGap('income', 1000, 1200)).toBe(200);
    expect(budgetGap('income', 1000, 900)).toBe(-100);
  });
});
