import type { PrismaClient } from '../../generated/prisma/client';
import { AYAH_COUNT, SURAH_COUNT } from '@muhasabah/shared';
import { stripBasmalah } from '../../common/arabic';

/** Edisi AlQuran Cloud yang diimpor (lihat DATA_SOURCES.md). */
export const EDITIONS = {
  arabic: 'quran-uthmani',
  translation: 'id.indonesian',
  latin: 'en.transliteration',
} as const;

interface CloudAyah {
  number: number;
  numberInSurah: number;
  juz: number;
  page: number;
  text: string;
}
interface CloudSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  ayahs: CloudAyah[];
}

export interface QuranImportOptions {
  baseUrl: string;
  audioBaseUrl: string;
  fetch?: typeof fetch;
  onProgress?: (percent: number, message: string) => void | Promise<void>;
}

export interface QuranImportResult {
  surahs: number;
  ayahs: number;
}

async function fetchEdition(opts: QuranImportOptions, edition: string): Promise<CloudSurah[]> {
  const res = await (opts.fetch ?? fetch)(`${opts.baseUrl.replace(/\/$/, '')}/quran/${edition}`, {
    signal: AbortSignal.timeout(120_000),
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`AlQuran Cloud membalas ${res.status} untuk ${edition}`);
  const body = (await res.json()) as { code: number; data?: { surahs?: CloudSurah[] } };
  const surahs = body.data?.surahs;
  if (body.code !== 200 || !surahs) throw new Error(`Respons ${edition} tidak valid`);
  return surahs;
}

/** Memastikan ketiga edisi lengkap dan nomor ayatnya sejajar. Fungsi murni. */
export function validateEditions(
  arabic: CloudSurah[],
  translation: CloudSurah[],
  latin: CloudSurah[],
): void {
  for (const [name, list] of [
    ['arab', arabic],
    ['terjemah', translation],
    ['latin', latin],
  ] as const) {
    if (list.length !== SURAH_COUNT)
      throw new Error(`Edisi ${name}: ${list.length} surah, seharusnya ${SURAH_COUNT}`);
    const total = list.reduce((n, s) => n + s.ayahs.length, 0);
    if (total !== AYAH_COUNT)
      throw new Error(`Edisi ${name}: ${total} ayat, seharusnya ${AYAH_COUNT}`);
  }
  arabic.forEach((s, i) => {
    s.ayahs.forEach((a, j) => {
      if (
        translation[i]!.ayahs[j]!.number !== a.number ||
        latin[i]!.ayahs[j]!.number !== a.number
      ) {
        throw new Error(`Nomor ayat tidak sejajar di surah ${s.number}`);
      }
    });
  });
}

/**
 * Membersihkan teks Arab dari sumber: membuang BOM (ada di ayat pertama Al-Fatihah) dan
 * basmalah yang ditempelkan edisi Utsmani pada ayat pertama tiap surah selain Al-Fatihah.
 */
export function cleanArabic(surahId: number, numberInSurah: number, text: string): string {
  const t = text.replace(/^\uFEFF/, '').trim();
  return surahId !== 1 && numberInSurah === 1 ? stripBasmalah(t) : t;
}

/**
 * Mengunduh teks Arab (Utsmani), terjemah Kemenag, dan transliterasi dari AlQuran Cloud,
 * lalu meng-upsert ke tabel `surahs` dan `ayahs`. Idempoten: aman dijalankan ulang.
 * File audio tidak diunduh; hanya URL-nya yang disimpan.
 */
export async function importQuran(
  prisma: PrismaClient,
  opts: QuranImportOptions,
): Promise<QuranImportResult> {
  const progress = async (p: number, m: string) => opts.onProgress?.(p, m);
  await progress(0, 'Mengunduh teks Arab');
  const arabic = await fetchEdition(opts, EDITIONS.arabic);
  await progress(15, 'Mengunduh terjemah');
  const translation = await fetchEdition(opts, EDITIONS.translation);
  await progress(30, 'Mengunduh transliterasi');
  const latin = await fetchEdition(opts, EDITIONS.latin);
  validateEditions(arabic, translation, latin);

  await progress(40, 'Menyimpan surah');
  await prisma.$transaction(
    arabic.map((s) => {
      const data = {
        nameArabic: s.name,
        nameLatin: s.englishName,
        nameMeaning: s.englishNameTranslation,
        revelationType: s.revelationType,
        ayahCount: s.ayahs.length,
      };
      return prisma.surah.upsert({
        where: { id: s.number },
        create: { id: s.number, ...data },
        update: data,
      });
    }),
  );

  const rows = arabic.flatMap((s, i) =>
    s.ayahs.map((a, j) => ({
      id: a.number,
      surahId: s.number,
      numberInSurah: a.numberInSurah,
      juz: a.juz,
      page: a.page,
      arabic: cleanArabic(s.number, a.numberInSurah, a.text),
      latin: latin[i]!.ayahs[j]!.text,
      translationId: translation[i]!.ayahs[j]!.text,
      audioUrl: `${opts.audioBaseUrl.replace(/\/$/, '')}/${a.number}.mp3`,
    })),
  );

  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    await prisma.$transaction(
      chunk.map(({ id, ...data }) =>
        prisma.ayah.upsert({ where: { id }, create: { id, ...data }, update: data }),
      ),
    );
    await progress(
      40 + Math.round(((i + chunk.length) / rows.length) * 60),
      `Menyimpan ayat ${i + chunk.length}/${rows.length}`,
    );
  }
  return { surahs: arabic.length, ayahs: rows.length };
}
