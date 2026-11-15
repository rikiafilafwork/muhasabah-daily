import type { PrismaClient } from '../../src/generated/prisma/client';
import { normalizeArabic, stripBasmalah, toArabicDigits } from '../../src/common/arabic';
import { DHIKR_CONTENT, type DhikrSeed, type QuranRef } from './dhikr-content';

const ALQURAN_CLOUD = process.env.ALQURAN_CLOUD_BASE_URL ?? 'https://api.alquran.cloud/v1';

interface FetchedAyahs {
  arabic: string;
  translation: string;
}

interface CloudEdition {
  edition: { identifier: string };
  ayahs: { numberInSurah: number; text: string }[];
}

/** Mengambil ayat (rasm Utsmani) dan terjemah Kemenag dari AlQuran Cloud. */
export async function fetchAyahs(
  ref: QuranRef,
  fetchImpl: typeof fetch = fetch,
): Promise<FetchedAyahs> {
  const url = `${ALQURAN_CLOUD}/surah/${ref.surah}/editions/quran-uthmani,id.indonesian`;
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`AlQuran Cloud membalas ${res.status}`);
  const body = (await res.json()) as { code: number; data: CloudEdition[] };
  const pick = (id: string) => {
    const edition = body.data.find((e) => e.edition.identifier === id);
    if (!edition) throw new Error(`Edisi ${id} tidak ada`);
    return edition.ayahs.filter((a) => a.numberInSurah >= ref.from && a.numberInSurah <= ref.to);
  };
  const arabic = pick('quran-uthmani')
    .map((a) => {
      const text = ref.surah !== 1 && a.numberInSurah === 1 ? stripBasmalah(a.text) : a.text;
      return `${text.trim()} ﴿${toArabicDigits(a.numberInSurah)}﴾`;
    })
    .join(' ');
  const translation = pick('id.indonesian')
    .map((a) => a.text.trim())
    .join(' ');
  if (!arabic || !translation) throw new Error('Ayat tidak ditemukan');
  return { arabic, translation };
}

export interface SeedDhikrOptions {
  /** `false` memakai teks bawaan saja (untuk test dan saat tanpa internet). */
  online?: boolean;
  log?: (msg: string) => void;
}

export interface SeedDhikrResult {
  rows: number;
  verified: number;
  mismatches: string[];
  offlineFallbacks: string[];
}

/** Upsert idempoten konten dzikir. */
export async function seedDhikr(
  prisma: PrismaClient,
  { online = true, log = () => undefined }: SeedDhikrOptions = {},
): Promise<SeedDhikrResult> {
  const result: SeedDhikrResult = { rows: 0, verified: 0, mismatches: [], offlineFallbacks: [] };
  const cache = new Map<string, FetchedAyahs>();

  async function resolve(item: DhikrSeed): Promise<{ arabic: string; translation: string }> {
    if (!item.quran || !online) return item;
    const key = `${item.quran.surah}:${item.quran.from}-${item.quran.to}`;
    try {
      let fetched = cache.get(key);
      if (!fetched) {
        fetched = await fetchAyahs(item.quran);
        cache.set(key, fetched);
        if (
          normalizeArabic(fetched.arabic.replace(/﴿[^﴾]*﴾/g, '')) !== normalizeArabic(item.arabic)
        ) {
          result.mismatches.push(key);
          log(
            `Peringatan: teks bawaan ${item.title} (${key}) berbeda dari AlQuran Cloud; memakai teks sumber.`,
          );
        } else {
          result.verified++;
        }
      }
      return fetched;
    } catch (err) {
      if (!result.offlineFallbacks.includes(key)) {
        result.offlineFallbacks.push(key);
        log(`AlQuran Cloud gagal untuk ${key} (${(err as Error).message}); memakai teks bawaan.`);
      }
      return item;
    }
  }

  const rows = [];
  for (const group of ['pagi', 'petang', 'tidur'] as const) {
    let position = 0;
    for (const item of DHIKR_CONTENT.filter((d) => d.groups.includes(group))) {
      const { arabic, translation } = await resolve(item);
      rows.push({
        id: `${group}-${item.slug}`,
        group,
        position: position++,
        title: item.title,
        arabic,
        latin: item.latin,
        translation,
        reference: item.reference,
        note: item.note ?? null,
        repeat: item.repeat,
      });
    }
  }

  await prisma.$transaction(
    rows.map(({ id, ...data }) =>
      prisma.dhikrItem.upsert({ where: { id }, create: { id, ...data }, update: data }),
    ),
  );
  // Hapus item yang tidak lagi ada di konten (log ikut terhapus lewat cascade).
  await prisma.dhikrItem.deleteMany({ where: { id: { notIn: rows.map((r) => r.id) } } });
  result.rows = rows.length;
  return result;
}

export { normalizeArabic, stripBasmalah };
