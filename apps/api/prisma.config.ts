import { defineConfig } from 'prisma/config';

/**
 * Konfigurasi Prisma CLI (migrate, generate). Prisma 7 tidak lagi membaca .env otomatis:
 * skrip pnpm memuatnya lewat `dotenv run`, sedangkan Docker dan test menyetel variabelnya
 * langsung. `prisma generate` tidak butuh koneksi, jadi URL boleh kosong saat build.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL ?? '' },
});
