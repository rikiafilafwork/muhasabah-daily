import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Driver adapter PostgreSQL untuk Prisma 7. Batas waktu koneksi 5 detik menyamai
 * perilaku Prisma 6 (driver `pg` bawaannya tanpa batas waktu).
 */
export function createPrismaAdapter(url = process.env.DATABASE_URL): PrismaPg {
  if (!url) throw new Error('DATABASE_URL belum diatur.');
  return new PrismaPg({ connectionString: url, connectionTimeoutMillis: 5_000 });
}

/** Klien Prisma mandiri untuk skrip seed dan CLI (di luar container NestJS). */
export function createPrismaClient(url?: string): PrismaClient {
  return new PrismaClient({ adapter: createPrismaAdapter(url) });
}
