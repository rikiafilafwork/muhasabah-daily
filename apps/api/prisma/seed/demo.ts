/**
 * Data contoh untuk mencoba aplikasi dan membuat tangkapan layar.
 *
 * Membuat (atau membuat ulang) satu akun demo dengan riwayat empat minggu yang
 * dihitung relatif terhadap hari ini: habit, tugas, goal, agenda, sesi fokus,
 * dzikir, dan keuangan. Hasilnya deterministik (PRNG dengan seed tetap) agar tangkapan
 * layar konsisten. Butuh `seed` dasar (template habit dan dzikir) lebih dulu.
 */
import type { PrismaClient } from '../../src/generated/prisma/client';
import {
  DEFAULT_FINANCE_CATEGORIES,
  addDays,
  addMonths,
  monthRange,
  planDateFor,
  buildTikrarStages,
  extractRichDoc,
  formatAyahRef,
  toLocalDate,
  zonedTimeToUtc,
} from '@muhasabah/shared';
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

  // ---------------------------------------------------------------- Hafidz
  // Al-Mulk 1–5 bila data Al-Qur'an lengkap sudah diimpor; bila hanya data uji, Al-Ikhlas.
  const mulk = await prisma.surah.findUnique({ where: { id: 67 } });
  const ikhlas = await prisma.surah.findUnique({ where: { id: 112 } });
  const planSurah = mulk ?? ikhlas;
  if (planSurah) {
    const toAyah = mulk ? 5 : Math.min(4, planSurah.ayahCount);
    const settings = { listenRepeat: 5, reciteRepeat: 3, connectRepeat: 3 };
    const stages = buildTikrarStages(1, toAyah, settings);
    await prisma.memorizationPlan.create({
      data: {
        userId,
        surahId: planSurah.id,
        fromAyah: 1,
        toAyah,
        title: `Hafalan ${planSurah.nameLatin}`,
        ...settings,
        currentStage: Math.floor(stages.length * 0.4),
        createdAt: at(-6, '05:00'),
        stages: { create: stages.map((st, position) => ({ ...st, position })) },
      },
    });
  }

  // ---------------------------------------------------------------- Jurnal
  const journal = [
    [
      -2,
      'Alhamdulillah hari ini bisa sholat subuh berjamaah lagi. Masih sering menunda tilawah sampai malam, besok coba setelah subuh.',
    ],
    [
      -1,
      'Bimbingan skripsi lancar. Kurang sabar waktu macet di jalan, perlu lebih banyak istighfar. Syukur: sehat, keluarga baik, ada rezeki makan siang bersama teman.',
    ],
    [0, 'Pagi ini dzikir pagi tuntas. Target sore: revisi bab 3 dan olahraga 30 menit.'],
  ] as const;
  for (const [n, rawText] of journal) {
    await prisma.journalEntry.create({ data: { userId, date: d(day(n)), rawText } });
  }

  // ---------------------------------------------------------------- Catatan kajian
  const ref = (surahId: number, from: number, to: number, name: string) => ({
    type: 'ayahRef',
    attrs: { surahId, from, to, label: formatAyahRef(name, from, to) },
  });
  const para = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });
  const notes = [
    {
      title: 'Tafsir Surah Al-Mulk: ujian dan amal terbaik',
      speaker: 'Ustadz Abdullah',
      source: 'Masjid Raya, kajian Ahad pagi',
      date: day(-3),
      tags: ['tafsir', 'al-mulk'],
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Poin utama' }] },
        para(
          'Hidup dan mati diciptakan untuk menguji siapa yang paling baik amalnya, bukan yang paling banyak.',
        ),
        ...(mulk ? [ref(67, 1, 2, mulk.nameLatin)] : []),
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [para('Kualitas amal: ikhlas dan sesuai tuntunan.')] },
            { type: 'listItem', content: [para('Tadabbur ciptaan Allah menguatkan iman.')] },
          ],
        },
      ],
    },
    {
      title: 'Makna tauhid dalam Surah Al-Ikhlas',
      speaker: 'Ustadzah Aisyah',
      source: null,
      date: day(-10),
      tags: ['aqidah'],
      content: [
        para('Al-Ikhlas menegaskan keesaan Allah dan menafikan segala bentuk penyerupaan.'),
        ...(ikhlas ? [ref(112, 1, 4, ikhlas.nameLatin)] : []),
      ],
    },
  ];
  for (const n of notes) {
    const doc = { type: 'doc' as const, content: n.content };
    const { text, ayahRefs } = extractRichDoc(doc);
    await prisma.lectureNote.create({
      data: {
        userId,
        title: n.title,
        speaker: n.speaker,
        source: n.source,
        date: d(n.date),
        tags: n.tags,
        content: doc,
        contentText: text,
        ayahRefs: ayahRefs as unknown as object[],
      },
    });
  }

  // ---------------------------------------------------------------- Keuangan
  // Tiga bulan terakhir (bulan ini sampai hari ini) agar ringkasan dan grafik terisi.
  const cats: Record<string, string> = {};
  for (const [position, c] of DEFAULT_FINANCE_CATEGORIES.entries()) {
    const row = await prisma.financeCategory.create({ data: { ...c, userId, position } });
    cats[c.name] = row.id;
  }
  const round = (n: number, step: number) => Math.round(n / step) * step;
  const txs: {
    name: string;
    type: 'income' | 'expense';
    amount: number;
    date: string;
    note?: string;
  }[] = [];
  const thisMonth = today.slice(0, 7);
  for (let back = 2; back >= 0; back--) {
    const m = addMonths(thisMonth, -back);
    const { to } = monthRange(m);
    const last = back === 0 ? today : to;
    const inMonth = (dayOfMonth: number) => `${m}-${String(dayOfMonth).padStart(2, '0')}`;
    const lastDay = Number(last.slice(8, 10));
    const add = (name: string, amount: number, dayOfMonth: number, note?: string) => {
      if (dayOfMonth > lastDay) return;
      const type = DEFAULT_FINANCE_CATEGORIES.find((c) => c.name === name)!.type;
      txs.push({ name, type, amount, date: inMonth(dayOfMonth), note });
    };
    add('Gaji', 8_500_000, 1, 'Gaji bulanan');
    if (back !== 1) add('Usaha', round(1_200_000 + rand() * 900_000, 50_000), 14, 'Jualan buku');
    add('Tagihan', 450_000, 3, 'Listrik dan air');
    add('Tagihan', 300_000, 5, 'Internet');
    add('Zakat', 212_500, 2, 'Zakat penghasilan');
    add('Sedekah & infak', 100_000, 7, 'Kotak infak masjid');
    add('Sedekah & infak', 150_000, 21, 'Santunan yatim');
    add('Pendidikan', 350_000, 10, 'Kursus bahasa Arab');
    for (let day = 1; day <= lastDay; day++) {
      if (rand() < 0.75) add('Makan', round(25_000 + rand() * 60_000, 1000), day);
      if (rand() < 0.35) add('Transportasi', round(15_000 + rand() * 40_000, 1000), day);
      if (rand() < 0.12)
        add('Belanja', round(80_000 + rand() * 400_000, 5000), day, 'Belanja bulanan');
    }
    if (back === 2) add('Kesehatan', 275_000, 18, 'Periksa gigi');
  }
  await prisma.financeTransaction.createMany({
    data: txs.map((t) => ({
      userId,
      categoryId: cats[t.name]!,
      type: t.type,
      amount: BigInt(t.amount),
      date: d(t.date),
      note: t.note ?? null,
    })),
  });

  // Template bulanan diterapkan ke tiga bulan; rencana yang transaksinya sudah ada
  // (catatan = nama item) ditautkan sebagai realisasi. Listrik sengaja dianggarkan lebih
  // kecil dari tagihannya agar selisih terlihat.
  const templateSpecs = [
    { name: 'Gaji bulanan', category: 'Gaji', amount: 8_500_000, day: 1 },
    { name: 'Zakat penghasilan', category: 'Zakat', amount: 212_500, day: 2 },
    { name: 'Listrik dan air', category: 'Tagihan', amount: 400_000, day: 3 },
    { name: 'Internet', category: 'Tagihan', amount: 300_000, day: 5 },
    { name: 'Kotak infak masjid', category: 'Sedekah & infak', amount: 100_000, day: 7 },
    { name: 'Kursus bahasa Arab', category: 'Pendidikan', amount: 350_000, day: 10 },
    { name: 'Belanja bulanan', category: 'Belanja', amount: 600_000, day: 25 },
  ];
  for (const [position, t] of templateSpecs.entries()) {
    const item = await prisma.financeTemplateItem.create({
      data: {
        userId,
        categoryId: cats[t.category]!,
        name: t.name,
        amount: BigInt(t.amount),
        dayOfMonth: t.day,
        position,
      },
    });
    for (let back = 2; back >= 0; back--) {
      const m = addMonths(thisMonth, -back);
      const tx = await prisma.financeTransaction.findFirst({
        where: { userId, note: t.name, date: { gte: d(`${m}-01`), lte: d(monthRange(m).to) } },
        select: { id: true },
      });
      await prisma.financePlan.create({
        data: {
          userId,
          categoryId: cats[t.category]!,
          type: DEFAULT_FINANCE_CATEGORIES.find((c) => c.name === t.category)!.type,
          name: t.name,
          amount: BigInt(t.amount),
          date: d(planDateFor(m, t.day)),
          month: m,
          templateItemId: item.id,
          transactionId: tx?.id ?? null,
        },
      });
    }
  }

  return { userId, email: DEMO_EMAIL, password: DEMO_PASSWORD };
}
