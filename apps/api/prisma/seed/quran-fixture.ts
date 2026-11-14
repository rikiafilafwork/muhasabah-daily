/**
 * Data Al-Qur'an kecil untuk test dan pemakaian tanpa internet: Al-Ikhlas, Al-Falaq,
 * dan An-Nas, disusun dari teks yang sudah ada di konten dzikir (tidak menambah teks
 * Al-Qur'an baru ke repo). Terjemah per ayat tidak tersedia di sini, jadi kolom terjemah
 * diisi penanda. Jalankan `seed:quran` tanpa `--fixture` untuk data lengkap.
 */
import type { PrismaClient } from '@prisma/client';
import { DHIKR_CONTENT } from './dhikr-content';

const SURAHS = [
  {
    id: 112,
    slug: 'al-ikhlas',
    nameLatin: 'Al-Ikhlaas',
    nameMeaning: 'Sincerity',
    nameArabic: 'سُورَةُ الإِخۡلَاصِ',
    firstAyah: 6222,
  },
  {
    id: 113,
    slug: 'al-falaq',
    nameLatin: 'Al-Falaq',
    nameMeaning: 'The Dawn',
    nameArabic: 'سُورَةُ الفَلَقِ',
    firstAyah: 6226,
  },
  {
    id: 114,
    slug: 'an-nas',
    nameLatin: 'An-Naas',
    nameMeaning: 'Mankind',
    nameArabic: 'سُورَةُ النَّاسِ',
    firstAyah: 6231,
  },
];

export async function seedQuranFixture(
  prisma: PrismaClient,
  audioBaseUrl = 'https://cdn.islamic.network/quran/audio/128/ar.alafasy',
) {
  for (const s of SURAHS) {
    const content = DHIKR_CONTENT.find((d) => d.slug === s.slug)!;
    const arabic = content.arabic.split(/\s*۝\s*/);
    const latin = content.latin.split(/(?<=\.)\s+/);
    const data = {
      nameArabic: s.nameArabic,
      nameLatin: s.nameLatin,
      nameMeaning: s.nameMeaning,
      revelationType: 'Meccan',
      ayahCount: arabic.length,
    };
    await prisma.surah.upsert({ where: { id: s.id }, create: { id: s.id, ...data }, update: data });
    for (const [i, text] of arabic.entries()) {
      const id = s.firstAyah + i;
      const row = {
        surahId: s.id,
        numberInSurah: i + 1,
        juz: 30,
        page: 604,
        arabic: text,
        latin: latin[i] ?? '',
        translationId: `(Data uji) Terjemah ${s.nameLatin} ayat ${i + 1}.`,
        audioUrl: `${audioBaseUrl}/${id}.mp3`,
      };
      await prisma.ayah.upsert({ where: { id }, create: { id, ...row }, update: row });
    }
  }
  return { surahs: SURAHS.length, ayahs: 15 };
}
