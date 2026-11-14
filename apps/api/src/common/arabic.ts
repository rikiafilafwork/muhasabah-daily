/** Utilitas teks Arab yang dipakai seeder dzikir dan importer Al-Qur'an. */

/**
 * Menormalkan teks Arab untuk perbandingan kasar: menghapus harakat dan tanda waqaf,
 * menyeragamkan alif/hamzah/ya/ta marbutah, lalu menghapus alif dan kursi hamzah karena
 * rasm Utsmani sering menulisnya berbeda (mis. ٱلسَّمَٰوَٰتِ vs السَّمَاوَاتِ, يَـُٔودُهُۥ vs يَئُودُهُ,
 * مَوْلَىٰنَا vs مَوْلَانَا). Hanya untuk mendeteksi perbedaan besar, bukan pengganti tinjauan.
 */
export function normalizeArabic(text: string): string {
  return text
    .normalize('NFC')
    .replace(/ى\u0670/g, '')
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u06DD\uFEFF]/g, '')
    .replace(/[ٱأإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ئ/g, '')
    .replace(/ؤ/g, 'و')
    .replace(/ء/g, '')
    .replace(/ة/g, 'ه')
    .replace(/ا/g, '')
    .replace(/[^\u0621-\u064A]/g, '');
}

const BASMALAH_NORMALIZED = 'بسمللهلرحمنلرحيم';

/** Edisi Utsmani menempelkan basmalah pada ayat pertama tiap surah (kecuali Al-Fatihah). */
export function stripBasmalah(text: string): string {
  const words = text.trim().split(/\s+/);
  return normalizeArabic(words.slice(0, 4).join('')) === BASMALAH_NORMALIZED
    ? words.slice(4).join(' ')
    : text;
}

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export const toArabicDigits = (n: number) =>
  String(n).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]!);
