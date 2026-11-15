import { z } from 'zod';

const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

/**
 * Skema variabel lingkungan. Aplikasi menolak berjalan bila variabel wajib
 * hilang atau tidak valid (ARCHITECTURE.md bagian 9).
 */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(32, 'minimal 32 karakter'),
    JWT_REFRESH_SECRET: z.string().min(32, 'minimal 32 karakter'),
    JWT_ACCESS_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(15 * 60),
    /** Nilai `trust proxy` Express. Bawaan: alamat loopback dan jaringan privat (Docker). */
    TRUST_PROXY: z.preprocess(
      emptyToUndefined,
      z.string().default('loopback, linklocal, uniquelocal'),
    ),
    /** Flag Secure cookie refresh: auto (ikut protokol permintaan), true, atau false. */
    COOKIE_SECURE: z.enum(['auto', 'true', 'false']).default('auto'),
    /** Permintaan /auth per menit per IP (refresh: tiga kali lipat). */
    AUTH_RATE_LIMIT: z.coerce.number().int().positive().default(10),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
    ALADHAN_BASE_URL: z.preprocess(emptyToUndefined, z.url().default('https://api.aladhan.com/v1')),
    ALADHAN_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
    ALQURAN_CLOUD_BASE_URL: z.preprocess(
      emptyToUndefined,
      z.url().default('https://api.alquran.cloud/v1'),
    ),
    QURAN_AUDIO_BASE_URL: z.preprocess(
      emptyToUndefined,
      z.url().default('https://cdn.islamic.network/quran/audio/128/ar.alafasy'),
    ),
    /** Penyedia AI untuk AI Polish. Kosong berarti fitur mati. */
    AI_PROVIDER: z.preprocess(emptyToUndefined, z.enum(['anthropic']).optional()),
    AI_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
    AI_MODEL: z.preprocess(emptyToUndefined, z.string().default('claude-opus-5-5')),
    AI_DAILY_LIMIT: z.coerce.number().int().nonnegative().default(10),
    AI_MAX_INPUT_CHARS: z.coerce.number().int().positive().default(8000),
    /** Kunci VAPID Web Push (pengingat). Kosong berarti pengingat mati. */
    VAPID_PUBLIC_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
    VAPID_PRIVATE_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
    /** Kontak pengelola untuk layanan push (`mailto:` atau URL https). */
    VAPID_SUBJECT: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .regex(/^(mailto:|https:\/\/)/, 'harus diawali mailto: atau https://')
        .default('mailto:admin@muhasabah.invalid'),
    ),
    /** Matikan penjadwal pengingat (mis. untuk test). */
    REMINDERS_SCHEDULER: z.enum(['on', 'off']).default('on'),
    CORS_ORIGIN: z.preprocess(emptyToUndefined, z.string().default('http://localhost:5173')),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
  })
  .refine((e) => e.JWT_ACCESS_SECRET !== e.JWT_REFRESH_SECRET, {
    message: 'JWT_REFRESH_SECRET harus berbeda dari JWT_ACCESS_SECRET',
    path: ['JWT_REFRESH_SECRET'],
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Konfigurasi lingkungan tidak valid:\n${lines.join('\n')}`);
  }
  return result.data;
}
