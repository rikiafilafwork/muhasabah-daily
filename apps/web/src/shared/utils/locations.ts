/** Kota-kota umum di Indonesia untuk mengisi lokasi dengan cepat. */
export interface CityPreset {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export const CITY_PRESETS: CityPreset[] = [
  { name: 'Banda Aceh', latitude: 5.5483, longitude: 95.3238, timezone: 'Asia/Jakarta' },
  { name: 'Medan', latitude: 3.5952, longitude: 98.6722, timezone: 'Asia/Jakarta' },
  { name: 'Padang', latitude: -0.9471, longitude: 100.4172, timezone: 'Asia/Jakarta' },
  { name: 'Pekanbaru', latitude: 0.5071, longitude: 101.4478, timezone: 'Asia/Jakarta' },
  { name: 'Palembang', latitude: -2.9761, longitude: 104.7754, timezone: 'Asia/Jakarta' },
  { name: 'Bandar Lampung', latitude: -5.3971, longitude: 105.2668, timezone: 'Asia/Jakarta' },
  { name: 'Jakarta', latitude: -6.2088, longitude: 106.8456, timezone: 'Asia/Jakarta' },
  { name: 'Bogor', latitude: -6.595, longitude: 106.8166, timezone: 'Asia/Jakarta' },
  { name: 'Bandung', latitude: -6.9175, longitude: 107.6191, timezone: 'Asia/Jakarta' },
  { name: 'Semarang', latitude: -6.9667, longitude: 110.4167, timezone: 'Asia/Jakarta' },
  { name: 'Yogyakarta', latitude: -7.7956, longitude: 110.3695, timezone: 'Asia/Jakarta' },
  { name: 'Surabaya', latitude: -7.2575, longitude: 112.7521, timezone: 'Asia/Jakarta' },
  { name: 'Malang', latitude: -7.9666, longitude: 112.6326, timezone: 'Asia/Jakarta' },
  { name: 'Pontianak', latitude: -0.0263, longitude: 109.3425, timezone: 'Asia/Pontianak' },
  { name: 'Denpasar', latitude: -8.6705, longitude: 115.2126, timezone: 'Asia/Makassar' },
  { name: 'Mataram', latitude: -8.5833, longitude: 116.1167, timezone: 'Asia/Makassar' },
  { name: 'Balikpapan', latitude: -1.2379, longitude: 116.8529, timezone: 'Asia/Makassar' },
  { name: 'Banjarmasin', latitude: -3.3186, longitude: 114.5944, timezone: 'Asia/Makassar' },
  { name: 'Makassar', latitude: -5.1477, longitude: 119.4327, timezone: 'Asia/Makassar' },
  { name: 'Manado', latitude: 1.4748, longitude: 124.8421, timezone: 'Asia/Makassar' },
  { name: 'Ambon', latitude: -3.6954, longitude: 128.1814, timezone: 'Asia/Jayapura' },
  { name: 'Jayapura', latitude: -2.5337, longitude: 140.7181, timezone: 'Asia/Jayapura' },
];

export const INDONESIAN_TIMEZONES = [
  { value: 'Asia/Jakarta', label: 'WIB (Asia/Jakarta)' },
  { value: 'Asia/Pontianak', label: 'WIB (Asia/Pontianak)' },
  { value: 'Asia/Makassar', label: 'WITA (Asia/Makassar)' },
  { value: 'Asia/Jayapura', label: 'WIT (Asia/Jayapura)' },
];

/** Semua zona waktu yang dikenal browser, dengan zona Indonesia di urutan atas. */
export function timezoneOptions(): { value: string; label: string }[] {
  const id = new Set(INDONESIAN_TIMEZONES.map((t) => t.value));
  let all: string[];
  try {
    all = (Intl as unknown as { supportedValuesOf(k: string): string[] }).supportedValuesOf(
      'timeZone',
    );
  } catch {
    all = [];
  }
  return [
    ...INDONESIAN_TIMEZONES,
    ...all.filter((tz) => !id.has(tz)).map((tz) => ({ value: tz, label: tz })),
  ];
}
