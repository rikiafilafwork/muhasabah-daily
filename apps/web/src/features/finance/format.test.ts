import { describe, expect, it } from 'vitest';
import { balanceLabel, compactRupiah, percentChange, signedAmount } from './format';

describe('format keuangan', () => {
  it('nominal bertanda dan selisih', () => {
    expect(signedAmount('income', 5000)).toBe('+Rp 5.000');
    expect(signedAmount('expense', 5000)).toBe('−Rp 5.000');
    expect(balanceLabel(-99_000)).toBe('−Rp 99.000');
    expect(balanceLabel(0)).toBe('Rp 0');
  });
  it('bentuk ringkas dan persentase', () => {
    expect(compactRupiah(1_500_000)).toBe('1,5 jt');
    expect(compactRupiah(250_000)).toBe('250 rb');
    expect(compactRupiah(2_000_000_000)).toBe('2 M');
    expect(compactRupiah(500)).toBe('500');
    expect(percentChange(120, 100)).toBe(20);
    expect(percentChange(50, 0)).toBeNull();
  });
});
