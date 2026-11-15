/**
 * `pnpm --filter api seed:quran` — impor data Al-Qur'an (ARCHITECTURE.md 8.4).
 *
 *   (tanpa opsi)  Antrekan job `quran` di antrean `seed`; dikerjakan worker di proses API
 *                 (`pnpm dev` harus berjalan). Menunggu sampai selesai dan menampilkan progres.
 *   --direct      Jalankan impor langsung di proses ini, tanpa API dan antrean.
 *   --fixture     Isi data uji kecil (3 surah) tanpa internet. Untuk test dan demo offline.
 *   --if-empty    Lewati bila data lengkap sudah ada (dipakai entrypoint Docker).
 */
import { createPrismaClient } from '../../src/prisma/create-client';
import { AYAH_COUNT } from '@muhasabah/shared';
import { Queue, QueueEvents } from 'bullmq';
import { QUEUE_PREFIX, QUEUES, redisConnection } from '../../src/queue/connection';
import { importQuran } from '../../src/modules/quran/quran-import';
import { seedQuranFixture } from './quran-fixture';

const env = (k: string, d?: string) => process.env[k] || d || '';
const baseUrl = env('ALQURAN_CLOUD_BASE_URL', 'https://api.alquran.cloud/v1');
const audioBaseUrl = env(
  'QURAN_AUDIO_BASE_URL',
  'https://cdn.islamic.network/quran/audio/128/ar.alafasy',
);

async function viaQueue() {
  const connection = redisConnection(env('REDIS_URL', 'redis://localhost:6379'));
  const queue = new Queue(QUEUES.seed, { connection, prefix: QUEUE_PREFIX });
  const events = new QueueEvents(QUEUES.seed, { connection, prefix: QUEUE_PREFIX });
  try {
    await events.waitUntilReady();
    const job = await queue.add('quran', {}, { attempts: 1 });
    console.log(`Job ${job.id} diantrekan di antrean "${QUEUES.seed}". Menunggu worker API…`);
    events.on('progress', ({ jobId, data }) => {
      if (jobId === job.id && data && typeof data === 'object' && 'message' in data) {
        const p = data as { percent: number; message: string };
        console.log(`  ${String(p.percent).padStart(3)}%  ${p.message}`);
      }
    });
    const started = setTimeout(async () => {
      if ((await job.getState()) === 'waiting') {
        console.warn(
          'Belum ada worker yang mengambil job. Pastikan API berjalan (`pnpm dev`) atau pakai --direct.',
        );
      }
    }, 15_000);
    const result = await job.waitUntilFinished(events, 15 * 60_000);
    clearTimeout(started);
    return result as { surahs: number; ayahs: number };
  } finally {
    await events.close();
    await queue.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--if-empty')) {
    const prisma = createPrismaClient();
    try {
      if ((await prisma.ayah.count()) >= AYAH_COUNT) {
        console.log("Data Al-Qur'an sudah lengkap, impor dilewati.");
        return;
      }
    } finally {
      await prisma.$disconnect();
    }
  }
  if (args.includes('--fixture')) {
    const prisma = createPrismaClient();
    try {
      const r = await seedQuranFixture(prisma, audioBaseUrl);
      console.log(`Data uji: ${r.surahs} surah, ${r.ayahs} ayat.`);
    } finally {
      await prisma.$disconnect();
    }
    return;
  }
  if (args.includes('--direct')) {
    const prisma = createPrismaClient();
    try {
      const r = await importQuran(prisma, {
        baseUrl,
        audioBaseUrl,
        onProgress: (p, m) => console.log(`  ${String(p).padStart(3)}%  ${m}`),
      });
      console.log(`Selesai: ${r.surahs} surah, ${r.ayahs} ayat.`);
    } finally {
      await prisma.$disconnect();
    }
    return;
  }
  const r = await viaQueue();
  console.log(`Selesai: ${r.surahs} surah, ${r.ayahs} ayat.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
