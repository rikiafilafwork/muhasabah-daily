/**
 * Seed dasar. Fase 2 menambahkan `habit_templates`, fase 3 `dhikr_items`.
 * Data Al-Qur'an memakai perintah terpisah (`seed:quran`, fase 5).
 * Semua seeder harus idempoten (upsert) sehingga aman dijalankan ulang.
 */
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    // Belum ada data dasar pada fase 1.
    console.log('Seed dasar: belum ada data untuk fase 1.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
