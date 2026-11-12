import { validateEnv } from './env';

const valid = {
  DATABASE_URL: 'postgresql://x',
  REDIS_URL: 'redis://localhost:6379',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};

describe('validateEnv', () => {
  it('mengisi default', () => {
    const env = validateEnv({ ...valid, AI_PROVIDER: '' });
    expect(env.PORT).toBe(3000);
    expect(env.ALADHAN_BASE_URL).toBe('https://api.aladhan.com/v1');
    expect(env.AI_PROVIDER).toBeUndefined();
    expect(env.AI_DAILY_LIMIT).toBe(10);
  });

  it('menolak bila variabel wajib hilang', () => {
    expect(() => validateEnv({ ...valid, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
  });

  it('menolak secret yang sama', () => {
    expect(() => validateEnv({ ...valid, JWT_REFRESH_SECRET: valid.JWT_ACCESS_SECRET })).toThrow(
      /JWT_REFRESH_SECRET/,
    );
  });
});
