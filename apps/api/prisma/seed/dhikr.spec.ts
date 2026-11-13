import { DHIKR_CONTENT } from './dhikr-content';
import { fetchAyahs, normalizeArabic, stripBasmalah } from './dhikr';

describe('konten dzikir', () => {
  it('setiap dzikir punya rujukan, teks, dan jumlah bacaan', () => {
    for (const d of DHIKR_CONTENT) {
      expect(d.reference.trim()).not.toBe('');
      expect(d.arabic.trim()).not.toBe('');
      expect(d.latin.trim()).not.toBe('');
      expect(d.translation.trim()).not.toBe('');
      expect(d.repeat).toBeGreaterThanOrEqual(1);
      expect(d.groups.length).toBeGreaterThan(0);
    }
  });

  it('slug unik di dalam setiap grup', () => {
    for (const group of ['pagi', 'petang', 'tidur'] as const) {
      const slugs = DHIKR_CONTENT.filter((d) => d.groups.includes(group)).map((d) => d.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });
});

describe('normalizeArabic', () => {
  it("menyamakan rasm Utsmani dan imla'i", () => {
    expect(normalizeArabic('ٱلسَّمَٰوَٰتِ')).toBe(normalizeArabic('السَّمَاوَاتِ'));
    expect(normalizeArabic('يَـُٔودُهُۥ')).toBe(normalizeArabic('يَئُودُهُ'));
    expect(normalizeArabic('مَوْلَىٰنَا')).toBe(normalizeArabic('مَوْلَانَا'));
    expect(normalizeArabic('فِى')).toBe(normalizeArabic('فِي'));
  });
  it('tetap membedakan kata yang berbeda', () => {
    expect(normalizeArabic('قُلْ هُوَ اللَّهُ أَحَدٌ')).not.toBe(
      normalizeArabic('قُلْ هُوَ اللَّهُ الصَّمَدُ'),
    );
  });
});

describe('stripBasmalah', () => {
  it('memotong basmalah yang menempel di ayat pertama', () => {
    expect(stripBasmalah('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ قُلْ هُوَ ٱللَّهُ أَحَدٌ')).toBe(
      'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
    );
    expect(stripBasmalah('ٱللَّهُ ٱلصَّمَدُ')).toBe('ٱللَّهُ ٱلصَّمَدُ');
  });
});

describe('fetchAyahs', () => {
  it('memilih rentang ayat, memberi nomor, dan menggabungkan terjemah', async () => {
    const body = {
      code: 200,
      data: [
        {
          edition: { identifier: 'quran-uthmani' },
          ayahs: [
            {
              numberInSurah: 1,
              text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ قُلْ هُوَ ٱللَّهُ أَحَدٌ',
            },
            { numberInSurah: 2, text: 'ٱللَّهُ ٱلصَّمَدُ' },
          ],
        },
        {
          edition: { identifier: 'id.indonesian' },
          ayahs: [
            { numberInSurah: 1, text: 'Satu.' },
            { numberInSurah: 2, text: 'Dua.' },
          ],
        },
      ],
    };
    const fakeFetch = jest.fn(async () => new Response(JSON.stringify(body)));
    const r = await fetchAyahs(
      { surah: 112, from: 1, to: 2 },
      fakeFetch as unknown as typeof fetch,
    );
    expect(r.arabic).toBe('قُلْ هُوَ ٱللَّهُ أَحَدٌ ﴿١﴾ ٱللَّهُ ٱلصَّمَدُ ﴿٢﴾');
    expect(r.translation).toBe('Satu. Dua.');
  });
});
