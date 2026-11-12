import { z } from 'zod';
import { idSchema, optionalText } from './common';
import { isoDateSchema } from './prayer-times';

export const goalHabitLinkSchema = z
  .object({ habitId: idSchema, weight: z.number().int().min(1).max(1000).default(1) })
  .strict();

const goalHabitsSchema = z
  .array(goalHabitLinkSchema)
  .max(20)
  .refine((list) => new Set(list.map((l) => l.habitId)).size === list.length, {
    message: 'Habit tidak boleh dobel',
  });

const goalFields = {
  title: z.string().trim().min(1, 'Judul wajib diisi').max(150),
  description: optionalText(2000),
  target: z.number().int().min(1).max(1_000_000),
  unit: optionalText(30),
  manualValue: z.number().int().min(0).max(1_000_000),
  /** Log habit tertaut dihitung sejak tanggal ini (lokal). */
  startDate: isoDateSchema,
  deadline: isoDateSchema.nullable(),
};

export const createGoalSchema = z
  .object({
    ...goalFields,
    manualValue: goalFields.manualValue.default(0),
    startDate: goalFields.startDate.optional(),
    deadline: goalFields.deadline.optional(),
    habits: goalHabitsSchema.optional(),
  })
  .strict();
export type CreateGoalInput = z.input<typeof createGoalSchema>;

export const updateGoalSchema = z.object(goalFields).partial().strict();
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

export const setGoalHabitsSchema = z.object({ habits: goalHabitsSchema }).strict();
export type SetGoalHabitsInput = z.input<typeof setGoalHabitsSchema>;

export interface GoalProgress {
  /** Nilai yang diisi manual. */
  manual: number;
  /** Kontribusi dari habit tertaut (Σ log × bobot). */
  fromHabits: number;
  /** manual + fromHabits, dibatasi pada target. */
  total: number;
  /** 0–100, dibulatkan ke bawah. */
  percent: number;
  achieved: boolean;
}

export interface GoalHabit {
  habitId: string;
  name: string;
  weight: number;
  doneCount: number;
  contribution: number;
}

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  target: number;
  unit: string | null;
  manualValue: number;
  startDate: string;
  deadline: string | null;
  createdAt: string;
  habits: GoalHabit[];
  progress: GoalProgress;
}

/**
 * Progres goal: `nilaiManual + Σ (log habit tertaut × bobot)`, dibatasi pada target
 * (ARCHITECTURE.md 8.3). Fungsi murni.
 */
export function computeGoalProgress(input: {
  target: number;
  manualValue: number;
  habits: { weight: number; doneCount: number }[];
}): GoalProgress {
  const fromHabits = input.habits.reduce((sum, h) => sum + h.weight * h.doneCount, 0);
  const total = Math.min(input.target, input.manualValue + fromHabits);
  return {
    manual: input.manualValue,
    fromHabits,
    total,
    percent: input.target > 0 ? Math.floor((total / input.target) * 100) : 0,
    achieved: total >= input.target,
  };
}
