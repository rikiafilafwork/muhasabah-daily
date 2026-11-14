import { shouldUseSecureCookie } from './refresh-cookie';

describe('shouldUseSecureCookie', () => {
  it('auto mengikuti protokol permintaan', () => {
    expect(shouldUseSecureCookie('auto', true)).toBe(true);
    expect(shouldUseSecureCookie('auto', false)).toBe(false);
    expect(shouldUseSecureCookie(undefined, false)).toBe(false);
  });
  it('true dan false memaksa', () => {
    expect(shouldUseSecureCookie('true', false)).toBe(true);
    expect(shouldUseSecureCookie('false', true)).toBe(false);
  });
});
