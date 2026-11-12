import type { CreateTaskInput, TasksQuery } from '@muhasabah/shared';

/** Tampilan daftar tugas. `project:<id>` untuk satu proyek. */
export type TaskView =
  'focus' | 'today' | 'overdue' | 'upcoming' | 'inbox' | 'done' | `project:${string}`;

export const BUILTIN_VIEWS: { id: TaskView; label: string; empty: string }[] = [
  {
    id: 'focus',
    label: 'Fokus hari ini',
    empty: 'Belum ada tugas fokus. Tandai bintang pada tugas penting hari ini.',
  },
  {
    id: 'today',
    label: 'Jatuh tempo hari ini',
    empty: 'Tidak ada tugas yang jatuh tempo hari ini.',
  },
  { id: 'overdue', label: 'Terlambat', empty: 'Alhamdulillah, tidak ada tugas terlambat.' },
  { id: 'upcoming', label: 'Mendatang', empty: 'Belum ada tugas terjadwal.' },
  { id: 'inbox', label: 'Inbox', empty: 'Inbox kosong.' },
  { id: 'done', label: 'Selesai', empty: 'Belum ada tugas yang selesai.' },
];

export function parseView(raw: unknown): TaskView {
  if (typeof raw !== 'string') return 'focus';
  if (raw.startsWith('project:') && raw.length > 8) return raw as TaskView;
  return BUILTIN_VIEWS.some((v) => v.id === raw) ? (raw as TaskView) : 'focus';
}

/** Kueri API untuk sebuah tampilan. Fungsi murni. */
export function queryForView(view: TaskView): TasksQuery {
  switch (view) {
    case 'focus':
      return { focusToday: true };
    case 'today':
      return { due: 'today' };
    case 'overdue':
      return { due: 'overdue' };
    case 'upcoming':
      return { due: 'upcoming' };
    case 'inbox':
      return { projectId: 'none' };
    case 'done':
      return { status: 'done' };
    default:
      return { projectId: view.slice('project:'.length) };
  }
}

/** Nilai awal tugas baru yang ditambahkan dari sebuah tampilan. */
export function defaultsForView(view: TaskView, today: string): Partial<CreateTaskInput> {
  if (view === 'focus') return { focusToday: true };
  if (view === 'today') return { dueDate: today };
  if (view.startsWith('project:')) return { projectId: view.slice('project:'.length) };
  return {};
}
