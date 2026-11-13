/**
 * `pnpm --filter api seed:demo` — membuat ulang akun demo beserta datanya.
 * Ditolak saat NODE_ENV=production agar tidak tercampur dengan data asli.
 */
import { PrismaClient } from '@prisma/client';
import { seedDemo } from './demo';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('seed:demo tidak dijalankan pada NODE_ENV=production.');
  }
  const prisma = new PrismaClient();
  try {
    const [templates, dhikr] = await Promise.all([
      prisma.habitTemplate.count(),
      prisma.dhikrItem.count(),
    ]);
    if (!templates || !dhikr) {
      throw new Error('Jalankan `pnpm --filter api seed` lebih dulu (template habit dan dzikir).');
    }
    const demo = await seedDemo(prisma);
    console.log(`Akun demo siap: ${demo.email} / ${demo.password}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
