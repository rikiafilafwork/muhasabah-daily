/** Menu navigasi aplikasi, dikelompokkan untuk header desktop dan tab bar mobile. */
export type NavGroup = 'utama' | 'produktivitas' | 'ibadah' | 'refleksi';

export interface NavItem {
  label: string;
  to: string;
  icon: string;
  group: NavGroup;
  /** Keterangan singkat untuk lembar "Lainnya". */
  hint: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Beranda',
    to: '/',
    group: 'utama',
    hint: 'Ringkasan hari ini',
    icon: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
  },
  {
    label: 'Jadwal',
    to: '/schedule',
    group: 'produktivitas',
    hint: 'Agenda di sekitar sholat',
    icon: 'M4 5h16v16H4zM4 9h16M8 3v4M16 3v4',
  },
  {
    label: 'To-Do',
    to: '/tasks',
    group: 'produktivitas',
    hint: 'Tugas dan proyek',
    icon: 'M9 11l3 3 8-8M4 12v7h14',
  },
  {
    label: 'Habit',
    to: '/habits',
    group: 'produktivitas',
    hint: 'Kebiasaan harian',
    icon: 'M5 13l4 4L19 7',
  },
  {
    label: 'Goals',
    to: '/goals',
    group: 'produktivitas',
    hint: 'Target jangka panjang',
    icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  },
  {
    label: 'Fokus',
    to: '/focus',
    group: 'produktivitas',
    hint: 'Timer fokus',
    icon: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  },
  {
    label: 'Dzikir',
    to: '/dhikr',
    group: 'ibadah',
    hint: 'Pagi, petang, setelah sholat',
    icon: 'M12 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 6v12M7 14h10',
  },
  {
    label: 'Hafidz',
    to: '/memorization',
    group: 'ibadah',
    hint: "Hafalan & murajaah Al-Qur'an",
    icon: 'M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2zM8 7h6',
  },
  {
    label: 'Jurnal',
    to: '/journal',
    group: 'refleksi',
    hint: 'Muhasabah harian',
    icon: 'M4 4h12l4 4v12H4zM8 12h8M8 16h5',
  },
  {
    label: 'Kajian',
    to: '/lecture-notes',
    group: 'refleksi',
    hint: 'Catatan kajian',
    icon: 'M3 6l9-3 9 3-9 3zM6 8v6c0 2 3 4 6 4s6-2 6-4V8',
  },
];

export const GROUP_LABELS: Record<NavGroup, string> = {
  utama: 'Utama',
  produktivitas: 'Produktivitas',
  ibadah: 'Ibadah',
  refleksi: 'Refleksi',
};

const byPath = (to: string) => NAV_ITEMS.find((i) => i.to === to)!;

/** Tautan yang tampil langsung di header desktop; sisanya masuk menu "Lainnya". */
export const DESKTOP_PRIMARY = ['/', '/schedule', '/tasks', '/habits', '/dhikr', '/journal'].map(
  byPath,
);
export const DESKTOP_MORE = NAV_ITEMS.filter((i) => !DESKTOP_PRIMARY.includes(i));

/** Empat tab tetap di tab bar mobile; tab kelima membuka lembar "Lainnya". */
export const MOBILE_TABS = ['/', '/schedule', '/dhikr', '/journal'].map(byPath);

export const SETTINGS_ICON =
  'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z';

/** Apakah rute aktif termasuk dalam item (memperhitungkan sub-rute, mis. /lecture-notes/new). */
export function isActive(item: NavItem, path: string): boolean {
  return item.to === '/' ? path === '/' : path === item.to || path.startsWith(`${item.to}/`);
}
