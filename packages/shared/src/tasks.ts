import { z } from 'zod';
import { colorSchema, idSchema, optionalText, type Color } from './common';
import { isoDateSchema } from './prayer-times';

export const PRIORITIES = ['none', 'low', 'medium', 'high'] as const;
export const prioritySchema = z.enum(PRIORITIES);
export type Priority = z.infer<typeof prioritySchema>;
export const PRIORITY_LABELS: Record<Priority, string> = {
  none: 'Tanpa prioritas',
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
};

// ---- Proyek ----

const projectFields = {
  name: z.string().trim().min(1, 'Nama proyek wajib diisi').max(100),
  color: colorSchema,
};

export const createProjectSchema = z
  .object({ ...projectFields, color: projectFields.color.default('sky') })
  .strict();
export type CreateProjectInput = z.input<typeof createProjectSchema>;

export const updateProjectSchema = z
  .object({ ...projectFields, archived: z.boolean(), position: z.number().int().min(0) })
  .partial()
  .strict();
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export interface Project {
  id: string;
  name: string;
  color: Color;
  archived: boolean;
  position: number;
  openTaskCount: number;
  createdAt: string;
}

// ---- Tugas ----

const taskFields = {
  title: z.string().trim().min(1, 'Judul tugas wajib diisi').max(300),
  notes: optionalText(5000),
  projectId: idSchema.nullable(),
  priority: prioritySchema,
  dueDate: isoDateSchema.nullable(),
  /** `true` menandai tugas sebagai fokus untuk hari ini (tanggal lokal pengguna). */
  focusToday: z.boolean(),
};

export const createTaskSchema = z
  .object({
    ...taskFields,
    projectId: taskFields.projectId.optional(),
    priority: taskFields.priority.default('none'),
    dueDate: taskFields.dueDate.optional(),
    focusToday: taskFields.focusToday.optional(),
  })
  .strict();
export type CreateTaskInput = z.input<typeof createTaskSchema>;

export const updateTaskSchema = z
  .object({ ...taskFields, completed: z.boolean() })
  .partial()
  .strict();
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const TASK_DUE_FILTERS = ['today', 'overdue', 'upcoming', 'none'] as const;
export const TASK_STATUSES = ['open', 'done', 'all'] as const;

export const tasksQuerySchema = z
  .object({
    /** Id proyek, atau `none` untuk tugas tanpa proyek (Inbox). */
    projectId: z.union([z.literal('none'), idSchema]).optional(),
    focusToday: z.stringbool().optional(),
    due: z.enum(TASK_DUE_FILTERS).optional(),
    status: z.enum(TASK_STATUSES).default('open'),
    cursor: idSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();
/** Bentuk kueri dari sisi klien (sebelum diubah menjadi query string). */
export interface TasksQuery {
  projectId?: string;
  focusToday?: boolean;
  due?: (typeof TASK_DUE_FILTERS)[number];
  status?: (typeof TASK_STATUSES)[number];
  cursor?: string;
  limit?: number;
}

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  projectId: string | null;
  priority: Priority;
  dueDate: string | null;
  focusToday: boolean;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
