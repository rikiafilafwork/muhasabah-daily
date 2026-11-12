/**
 * Seed dasar. Fase 3 menambahkan `dhikr_items`. Data Al-Qur'an memakai perintah
 * terpisah (`seed:quran`, fase 5). Semua seeder idempoten (upsert).
 */
import { PrismaClient } from '@prisma/client';
import { seedHabitTemplates } from './habit-templates';

async function main() {
  const prisma = new PrismaClient();
  try {
    const n = await seedHabitTemplates(prisma);
    console.log(`habit_templates: ${n} baris`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
