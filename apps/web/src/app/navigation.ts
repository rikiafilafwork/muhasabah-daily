/** Menu navigasi utama. Modul yang belum dibangun ditandai fase pengerjaannya. */
export interface NavItem {
  label: string;
  to: string;
  icon: string;
  phase?: number;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Beranda', to: '/', icon: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z' },
  { label: 'Jadwal', to: '/schedule', icon: 'M4 5h16v16H4zM4 9h16M8 3v4M16 3v4' },
  { label: 'To-Do', to: '/tasks', icon: 'M9 11l3 3 8-8M4 12v7h14' },
  { label: 'Habit', to: '/habits', icon: 'M5 13l4 4L19 7' },
  {
    label: 'Goals',
    to: '/goals',
    icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  },
  {
    label: 'Fokus',
    to: '/focus',
    icon: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  },
  {
    label: 'Dzikir',
    to: '/dhikr',
    icon: 'M12 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 6v12M7 14h10',
  },
  {
    label: 'Hafidz',
    to: '/memorization',
    icon: 'M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2zM8 7h6',
    phase: 5,
  },
  { label: 'Jurnal', to: '/journal', icon: 'M4 4h12l4 4v12H4zM8 12h8M8 16h5', phase: 5 },
  {
    label: 'Kajian',
    to: '/lecture-notes',
    icon: 'M3 6l9-3 9 3-9 3zM6 8v6c0 2 3 4 6 4s6-2 6-4V8',
    phase: 5,
  },
];
