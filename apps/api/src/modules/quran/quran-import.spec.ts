import { AYAH_COUNT } from '@muhasabah/shared';
import { cleanArabic, importQuran, validateEditions } from './quran-import';

const BASMALAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

describe('cleanArabic', () => {
  it('membuang BOM dan basmalah yang menempel', () => {
    expect(cleanArabic(1, 1, `\uFEFF${BASMALAH}`)).toBe(BASMALAH);
    expect(cleanArabic(112, 1, `${BASMALAH} قُلْ هُوَ ٱللَّهُ أَحَدٌ`)).toBe('قُلْ هُوَ ٱللَّهُ أَحَدٌ');
    expect(cleanArabic(112, 2, 'ٱللَّهُ ٱلصَّمَدُ')).toBe('ٱللَّهُ ٱلصَّمَدُ');
  });
});

/** Membuat edisi tiruan lengkap (114 surah, 6236 ayat) dengan teks pendek. */
function fakeEdition(prefix: string) {
  const surahs = [];
  let number = 1;
  for (let s = 1; s <= 114; s++) {
    const count = s === 114 ? AYAH_COUNT - (number - 1) : 54;
    const ayahs = Array.from({ length: count }, (_, i) => ({
      number: number++,
      numberInSurah: i + 1,
      juz: 1,
      page: 1,
      text: `${prefix} ${s}:${i + 1}`,
    }));
    surahs.push({
      number: s,
      name: `س${s}`,
      englishName: `S${s}`,
      englishNameTranslation: `M${s}`,
      revelationType: 'Meccan',
      ayahs,
    });
  }
  return surahs;
}

describe('validateEditions', () => {
  it('menolak edisi yang tidak lengkap atau tidak sejajar', () => {
    const ok = fakeEdition('a');
    expect(() => validateEditions(ok, fakeEdition('t'), fakeEdition('l'))).not.toThrow();
    expect(() => validateEditions(ok.slice(1), ok, ok)).toThrow(/113 surah/);
    const shifted = fakeEdition('t');
    shifted[5]!.ayahs[0]!.number = 99999;
    expect(() => validateEditions(ok, shifted, ok)).toThrow(/tidak sejajar/);
  });
});

describe('importQuran', () => {
  it('mengunduh tiga edisi dan meng-upsert surah serta ayat', async () => {
    const editions: Record<string, unknown> = {
      'quran-uthmani': fakeEdition('ar'),
      'id.indonesian': fakeEdition('id'),
      'en.transliteration': fakeEdition('lt'),
    };
    const fetchMock = jest.fn(async (url: string) => {
      const edition = url.split('/').pop()!;
      return new Response(JSON.stringify({ code: 200, data: { surahs: editions[edition] } }));
    });
    const upserts: {
      model: string;
      args: { where: { id: number }; create: Record<string, unknown> };
    }[] = [];
    const prisma = {
      surah: { upsert: (args: never) => (upserts.push({ model: 'surah', args }), args) },
      ayah: { upsert: (args: never) => (upserts.push({ model: 'ayah', args }), args) },
      $transaction: async (ops: unknown[]) => ops,
    };
    const progress: number[] = [];
    const result = await importQuran(prisma as never, {
      baseUrl: 'https://example.test/v1/',
      audioBaseUrl: 'https://audio.test/x',
      fetch: fetchMock as unknown as typeof fetch,
      onProgress: (p) => void progress.push(p),
    });
    expect(result).toEqual({ surahs: 114, ayahs: AYAH_COUNT });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.test/v1/quran/quran-uthmani',
      expect.anything(),
    );
    const ayah = upserts.find((u) => u.model === 'ayah' && u.args.where.id === 55)!.args.create;
    expect(ayah).toMatchObject({
      surahId: 2,
      numberInSurah: 1,
      arabic: 'ar 2:1',
      latin: 'lt 2:1',
      translationId: 'id 2:1',
      audioUrl: 'https://audio.test/x/55.mp3',
    });
    expect(progress.at(-1)).toBe(100);
  });
});
