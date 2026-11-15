/**
 * Seed dasar: library habit dan konten dzikir. Data Al-Qur'an lengkap memakai
 * perintah terpisah (`seed:quran`, fase 5). Semua seeder idempoten (upsert).
 *
 * `--offline` memakai teks bawaan tanpa menghubungi AlQuran Cloud.
 */
import { createPrismaClient } from '../../src/prisma/create-client';
import { seedDhikr } from './dhikr';
import { seedHabitTemplates } from './habit-templates';

async function main() {
  const prisma = createPrismaClient();
  const online = !process.argv.includes('--offline');
  try {
    console.log(`habit_templates: ${await seedHabitTemplates(prisma)} baris`);
    const dhikr = await seedDhikr(prisma, { online, log: (m) => console.warn(m) });
    console.log(
      `dhikr_items: ${dhikr.rows} baris; ayat terverifikasi ${dhikr.verified}, ` +
        `berbeda ${dhikr.mismatches.length}, cadangan offline ${dhikr.offlineFallbacks.length}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
