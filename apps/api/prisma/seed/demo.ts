/**
 * Data contoh untuk mencoba aplikasi dan membuat tangkapan layar.
 *
 * Membuat (atau membuat ulang) satu akun demo dengan riwayat empat minggu yang
 * dihitung relatif terhadap hari ini: habit, tugas, goal, agenda, sesi fokus,
 * dan dzikir. Hasilnya deterministik (PRNG dengan seed tetap) agar tangkapan
 * layar konsisten. Butuh `seed` dasar (template habit dan dzikir) lebih dulu.
 */
import type { PrismaClient } from '@prisma/client';
import { addDays, toLocalDate, zonedTimeToUtc } from '@muhasabah/shared';
import { hashPassword } from '../../src/modules/auth/password';

export const DEMO_EMAIL = 'demo@muhasabah.local';
export const DEMO_PASSWORD = 'demo12345';
const TZ = 'Asia/Jakarta';
const HISTORY_DAYS = 28;

/** PRNG kecil (mulberry32) agar data contoh selalu sama. */
function prng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const d = (date: string) => new Date(`${date}T00:00:00.000Z`);

export interface DemoResult {
  userId: string;
  email: string;
  password: string;
}

export async function seedDemo(prisma: PrismaClient, now: Date = new Date()): Promise<DemoResult> {
  const rand = prng(20261113);
  const today = toLocalDate(now, TZ);
  const day = (n: number) => addDays(today, n);
  const at = (n: number, time: string) => zonedTimeToUtc(day(n), time, TZ);

  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });
  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      passwordHash: await hashPassword(DEMO_PASSWORD),
      name: 'Abdullah',
      city: 'Jakarta',
      latitude: -6.2088,
      longitude: 106.8456,
      timezone: TZ,
      theme: 'system',
    },
  });
  const userId = user.id;

  // ---------------------------------------------------------------- Habit
  const habitSpecs = [
    {
      templateId: 'sholat-tepat-waktu',
      name: 'Sholat 5 waktu tepat waktu',
      color: 'emerald',
      rate: 0.9,
    },
    { templateId: 'dzikir-pagi', name: 'Dzikir pagi', color: 'sky', rate: 0.8 },
    { templateId: 'tilawah-1-halaman', name: 'Tilawah 1 halaman', color: 'violet', rate: 0.75 },
    { templateId: 'sholat-dhuha', name: 'Sholat Dhuha', color: 'amber', rate: 0.55 },
    { templateId: 'olahraga-30', name: 'Olahraga 30 menit', color: 'rose', rate: 0.4 },
  ] as const;
  const habits: Record<string, string> = {};
  for (const [position, h] of habitSpecs.entries()) {
    const habit = await prisma.habit.create({
      data: {
        userId,
        templateId: h.templateId,
        name: h.name,
        color: h.color,
        position,
        startDate: d(day(-(HISTORY_DAYS - 1))),
      },
    });
    habits[h.templateId] = habit.id;
    const logs = [];
    for (let n = -(HISTORY_DAYS - 1); n <= 0; n++) {
      // Hari ini sebagian sudah dicentang; minggu terakhir sedikit lebih baik (tren naik).
      const boost = n > -7 ? 0.1 : 0;
      const doneToday = n === 0 ? position < 2 : rand() < h.rate + boost;
      if (doneToday) logs.push({ habitId: habit.id, date: d(day(n)) });
    }
    await prisma.habitLog.createMany({ data: logs });
  }

  // ---------------------------------------------------------------- Proyek & tugas
  const project = async (name: string, color: 'violet' | 'sky' | 'amber', position: number) =>
    (await prisma.project.create({ data: { userId, name, color, position } })).id;
  const kajian = await project('Kajian Pekanan', 'violet', 0);
  const skripsi = await project('Skripsi', 'sky', 1);
  const rumah = await project('Rumah', 'amber', 2);

  type TaskSpec = {
    title: string;
    projectId?: string;
    priority?: 'none' | 'low' | 'medium' | 'high';
    due?: number;
    focus?: boolean;
    doneDaysAgo?: number;
    notes?: string;
  };
  const tasks: TaskSpec[] = [
    {
      title: 'Siapkan materi tafsir Surah Al-Mulk',
      projectId: kajian,
      priority: 'high',
      due: 0,
      focus: true,
    },
    {
      title: 'Revisi bab 3 metodologi',
      projectId: skripsi,
      priority: 'high',
      due: 1,
      focus: true,
      notes: 'Masukan pembimbing: perjelas teknik sampling.',
    },
    {
      title: 'Kirim draf ke pembimbing',
      projectId: skripsi,
      priority: 'medium',
      due: 3,
      focus: true,
    },
    { title: 'Konfirmasi pemateri kajian Ahad', projectId: kajian, priority: 'medium', due: -1 },
    { title: 'Bayar tagihan listrik', projectId: rumah, priority: 'medium', due: 2 },
    { title: 'Beli kitab Riyadhus Shalihin', priority: 'low', due: 6 },
    { title: 'Servis motor', projectId: rumah, priority: 'low' },
    { title: 'Baca jurnal referensi tentang wakaf produktif', projectId: skripsi },
    { title: 'Susun daftar hadir kajian', projectId: kajian, doneDaysAgo: 1 },
    { title: 'Olah data kuesioner', projectId: skripsi, priority: 'high', doneDaysAgo: 2 },
    { title: 'Belanja bulanan', projectId: rumah, doneDaysAgo: 3 },
  ];
  const taskIds: string[] = [];
  for (const [i, t] of tasks.entries()) {
    const created = await prisma.task.create({
      data: {
        userId,
        title: t.title,
        notes: t.notes ?? null,
        projectId: t.projectId ?? null,
        priority: t.priority ?? 'none',
        dueDate: t.due === undefined ? null : d(day(t.due)),
        focusDate: t.focus ? d(today) : null,
        completedAt: t.doneDaysAgo === undefined ? null : at(-t.doneDaysAgo, '16:00'),
        createdAt: at(-14 + i, '08:00'),
      },
    });
    taskIds.push(created.id);
  }

  // ---------------------------------------------------------------- Goals
  await prisma.goal.create({
    data: {
      userId,
      title: "Khatam Al-Qur'an",
      description: 'Satu halaman setiap hari, ditambah bacaan di luar habit.',
      target: 604,
      unit: 'halaman',
      manualValue: 180,
      startDate: d(day(-(HISTORY_DAYS - 1))),
      deadline: d(day(120)),
      habits: { create: [{ habitId: habits['tilawah-1-halaman']!, weight: 1 }] },
    },
  });
  await prisma.goal.create({
    data: {
      userId,
      title: 'Dhuha 40 hari',
      target: 40,
      unit: 'hari',
      startDate: d(day(-(HISTORY_DAYS - 1))),
      habits: { create: [{ habitId: habits['sholat-dhuha']!, weight: 1 }] },
    },
  });
  await prisma.goal.create({
    data: {
      userId,
      title: 'Olahraga 20 kali',
      description: 'Target bulan ini.',
      target: 20,
      unit: 'kali',
      manualValue: 2,
      startDate: d(day(-(HISTORY_DAYS - 1))),
      deadline: d(day(10)),
      habits: { create: [{ habitId: habits['olahraga-30']!, weight: 1 }] },
    },
  });

  // ---------------------------------------------------------------- Agenda
  const event = (title: string, n: number, start: string, end: string, extra: object = {}) => ({
    userId,
    title,
    startAt: at(n, start),
    endAt: at(n, end),
    ...extra,
  });
  await prisma.event.createMany({
    data: [
      event('Rapat tim penelitian', 0, '09:00', '10:00', { color: 'sky', location: 'Ruang 204' }),
      event('Kajian tafsir', 0, '12:30', '13:30', { color: 'violet', location: 'Masjid Raya' }),
      event('Bimbingan skripsi', 1, '10:00', '11:00', { color: 'sky' }),
      event('Olahraga pagi', 2, '06:00', '07:00', { color: 'emerald' }),
      event('Kajian Ahad', 3, '08:00', '10:00', { color: 'violet', location: 'Masjid Al-Ikhlas' }),
      event('Arisan keluarga', -2, '16:00', '18:00', { color: 'amber' }),
      {
        userId,
        title: 'Silaturahmi ke rumah orang tua',
        startAt: at(4, '00:00'),
        endAt: at(6, '00:00'),
        allDay: true,
        color: 'amber' as const,
      },
    ],
  });

  // ---------------------------------------------------------------- Sesi fokus
  const sessions = [];
  for (let n = -13; n <= 0; n++) {
    const count = n === 0 ? 2 : Math.floor(rand() * 5);
    for (let k = 0; k < count; k++) {
      // Sesi hari ini dibuat pagi-pagi agar tidak tampak "di masa depan" pada tangkapan layar.
      const start = at(n, `${String((n === 0 ? 6 : 8) + k * 2).padStart(2, '0')}:30`);
      const completed = rand() > 0.15;
      const focused = completed ? 1500 : 600 + Math.floor(rand() * 600);
      sessions.push({
        userId,
        taskId: taskIds[k % 3] ?? null,
        startedAt: start,
        endedAt: new Date(start.getTime() + (completed ? 1500 : focused) * 1000),
        date: d(day(n)),
        plannedSeconds: 1500,
        focusedSeconds: focused,
        status: completed ? ('completed' as const) : ('cancelled' as const),
      });
    }
  }
  await prisma.focusSession.createMany({ data: sessions });

  // ---------------------------------------------------------------- Dzikir
  const items = await prisma.dhikrItem.findMany({
    select: { id: true, group: true, repeat: true },
  });
  const dhikrLogs = [];
  for (let n = -6; n <= 0; n++) {
    for (const item of items) {
      if (item.group === 'tidur' && n === 0) continue;
      if (item.group === 'petang' && n === 0) continue;
      const chance = item.group === 'pagi' ? 0.85 : 0.6;
      if (rand() > chance) continue;
      const partial = n === 0 && rand() < 0.3;
      dhikrLogs.push({
        userId,
        dhikrId: item.id,
        date: d(day(n)),
        count: partial ? Math.max(1, Math.floor(item.repeat / 2)) : item.repeat,
      });
    }
  }
  await prisma.dhikrLog.createMany({ data: dhikrLogs });

  return { userId, email: DEMO_EMAIL, password: DEMO_PASSWORD };
}
