import type { PrismaClient } from '@prisma/client';

interface TemplateSeed {
  id: string;
  name: string;
  category: 'ibadah' | 'kesehatan' | 'produktivitas' | 'keluarga' | 'keuangan' | 'diri';
  description?: string;
  /** Rujukan dalil. Hanya diisi bila sumbernya jelas; lihat DATA_SOURCES.md. */
  reference?: string;
}

/**
 * Library habit bawaan. `id` adalah slug stabil: jangan diubah setelah rilis
 * karena habit pengguna merujuk ke sini.
 */
export const HABIT_TEMPLATES: TemplateSeed[] = [
  // ---- Ibadah
  {
    id: 'sholat-tepat-waktu',
    name: 'Sholat 5 waktu tepat waktu',
    category: 'ibadah',
    description: 'Menunaikan sholat wajib di awal waktu.',
  },
  {
    id: 'sholat-berjamaah',
    name: 'Sholat berjamaah',
    category: 'ibadah',
    description: 'Minimal satu sholat wajib berjamaah.',
    reference: 'HR. Bukhari no. 645 dan Muslim no. 650',
  },
  { id: 'subuh-berjamaah', name: 'Subuh berjamaah', category: 'ibadah' },
  {
    id: 'sholat-rawatib',
    name: 'Sholat sunnah rawatib',
    category: 'ibadah',
    description: '12 rakaat rawatib dalam sehari.',
    reference: 'HR. Muslim no. 728',
  },
  { id: 'sholat-dhuha', name: 'Sholat Dhuha', category: 'ibadah', reference: 'HR. Muslim no. 720' },
  { id: 'tahajud', name: 'Sholat Tahajud', category: 'ibadah', reference: 'QS. Al-Isra: 79' },
  { id: 'witir', name: 'Sholat Witir', category: 'ibadah' },
  {
    id: 'tilawah-1-halaman',
    name: 'Tilawah 1 halaman',
    category: 'ibadah',
    reference: 'HR. Muslim no. 804',
  },
  {
    id: 'tilawah-1-juz',
    name: 'Tilawah 1 juz',
    category: 'ibadah',
    reference: 'HR. Muslim no. 804',
  },
  {
    id: 'murajaah-hafalan',
    name: "Muraja'ah hafalan",
    category: 'ibadah',
    description: "Mengulang hafalan Al-Qur'an yang sudah ada.",
  },
  { id: 'tadabbur-terjemah', name: 'Baca terjemah atau tafsir', category: 'ibadah' },
  { id: 'dzikir-pagi', name: 'Dzikir pagi', category: 'ibadah', reference: 'QS. Al-Ahzab: 41–42' },
  {
    id: 'dzikir-petang',
    name: 'Dzikir petang',
    category: 'ibadah',
    reference: 'QS. Al-Ahzab: 41–42',
  },
  {
    id: 'istighfar-100',
    name: 'Istighfar 100 kali',
    category: 'ibadah',
    reference: 'HR. Muslim no. 2702',
  },
  {
    id: 'shalawat-100',
    name: 'Shalawat 100 kali',
    category: 'ibadah',
    reference: 'HR. Muslim no. 408',
  },
  {
    id: 'puasa-senin-kamis',
    name: 'Puasa Senin–Kamis',
    category: 'ibadah',
    description: 'Centang pada hari Senin dan Kamis.',
    reference: 'HR. Tirmidzi no. 747',
  },
  {
    id: 'sedekah-harian',
    name: 'Sedekah harian',
    category: 'ibadah',
    reference: 'QS. Al-Baqarah: 261',
  },
  { id: 'doa-sebelum-tidur', name: 'Doa dan dzikir sebelum tidur', category: 'ibadah' },
  {
    id: 'ilmu-agama',
    name: 'Belajar ilmu agama 15 menit',
    category: 'ibadah',
    description: 'Kajian, buku, atau rekaman ceramah.',
  },

  // ---- Kesehatan
  { id: 'minum-air', name: 'Minum 8 gelas air', category: 'kesehatan' },
  { id: 'olahraga-30', name: 'Olahraga 30 menit', category: 'kesehatan' },
  { id: 'jalan-7000', name: 'Jalan 7.000 langkah', category: 'kesehatan' },
  { id: 'tidur-cukup', name: 'Tidur sebelum pukul 22.00', category: 'kesehatan' },
  { id: 'bangun-sebelum-subuh', name: 'Bangun sebelum Subuh', category: 'kesehatan' },
  { id: 'sayur-buah', name: 'Makan sayur dan buah', category: 'kesehatan' },
  { id: 'kurangi-gula', name: 'Tanpa minuman manis', category: 'kesehatan' },
  { id: 'peregangan', name: 'Peregangan 10 menit', category: 'kesehatan' },

  // ---- Produktivitas
  {
    id: 'rencana-harian',
    name: 'Rencanakan hari',
    category: 'produktivitas',
    description: 'Pilih tugas fokus hari ini setelah Subuh.',
  },
  {
    id: 'muhasabah-malam',
    name: 'Muhasabah malam',
    category: 'produktivitas',
    description: 'Tinjau hari ini sebelum tidur: apa yang baik, apa yang perlu diperbaiki.',
  },
  { id: 'deep-work', name: 'Kerja fokus 2 jam', category: 'produktivitas' },
  { id: 'baca-buku', name: 'Baca buku 10 halaman', category: 'produktivitas' },
  { id: 'belajar-skill', name: 'Belajar keterampilan baru 30 menit', category: 'produktivitas' },
  { id: 'pagi-tanpa-ponsel', name: 'Satu jam pertama tanpa ponsel', category: 'produktivitas' },
  { id: 'batasi-medsos', name: 'Media sosial maksimal 30 menit', category: 'produktivitas' },
  { id: 'menulis-jurnal', name: 'Menulis jurnal', category: 'produktivitas' },

  // ---- Keluarga & sosial
  { id: 'hubungi-orang-tua', name: 'Menghubungi orang tua', category: 'keluarga' },
  { id: 'waktu-keluarga', name: 'Waktu berkualitas dengan keluarga', category: 'keluarga' },
  { id: 'bantu-pekerjaan-rumah', name: 'Membantu pekerjaan rumah', category: 'keluarga' },
  { id: 'silaturahmi', name: 'Menyapa kerabat atau teman', category: 'keluarga' },
  { id: 'tebar-salam', name: 'Menebar salam', category: 'keluarga' },

  // ---- Keuangan
  { id: 'catat-pengeluaran', name: 'Mencatat pengeluaran', category: 'keuangan' },
  { id: 'menabung', name: 'Menyisihkan tabungan', category: 'keuangan' },
  { id: 'tanpa-belanja-impulsif', name: 'Tanpa belanja impulsif', category: 'keuangan' },

  // ---- Pengembangan diri
  { id: 'syukur-3-hal', name: 'Menulis 3 hal yang disyukuri', category: 'diri' },
  {
    id: 'jaga-lisan',
    name: 'Menjaga lisan',
    category: 'diri',
    description: 'Tanpa ghibah dan kata-kata kasar hari ini.',
  },
  { id: 'tepat-janji', name: 'Menepati janji dan waktu', category: 'diri' },
];

/** Upsert idempoten: aman dijalankan berulang kali. */
export async function seedHabitTemplates(prisma: PrismaClient): Promise<number> {
  await prisma.$transaction(
    HABIT_TEMPLATES.map((t, position) =>
      prisma.habitTemplate.upsert({
        where: { id: t.id },
        create: {
          ...t,
          description: t.description ?? null,
          reference: t.reference ?? null,
          position,
        },
        update: {
          name: t.name,
          category: t.category,
          description: t.description ?? null,
          reference: t.reference ?? null,
          position,
        },
      }),
    ),
  );
  return HABIT_TEMPLATES.length;
}
