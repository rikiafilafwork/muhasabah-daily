import { describe, expect, it } from 'vitest';
import { createEventSchema, eventsQuerySchema, updateEventSchema } from './events';
import { computeGoalProgress, createGoalSchema } from './goals';
import { createHabitSchema, habitsQuerySchema } from './habits';
import { createTaskSchema, tasksQuerySchema, updateTaskSchema } from './tasks';
import { dateRange, diffDays } from './date';

describe('events', () => {
  const base = { title: 'Kajian', startAt: '2026-11-12T12:00:00Z', endAt: '2026-11-12T13:00:00Z' };
  it('mengisi default dan menolak selesai sebelum mulai', () => {
    expect(createEventSchema.parse(base)).toMatchObject({ allDay: false, color: 'emerald' });
    expect(createEventSchema.safeParse({ ...base, endAt: '2026-11-12T11:00:00Z' }).success).toBe(
      false,
    );
    expect(updateEventSchema.safeParse({ startAt: base.endAt, endAt: base.startAt }).success).toBe(
      false,
    );
    expect(updateEventSchema.safeParse({ title: 'Baru' }).success).toBe(true);
  });
  it('membatasi rentang kueri', () => {
    expect(
      eventsQuerySchema.safeParse({ from: base.startAt, to: '2027-06-01T00:00:00Z' }).success,
    ).toBe(false);
    expect(eventsQuerySchema.safeParse({ from: base.startAt, to: base.endAt }).success).toBe(true);
  });
});

describe('tasks', () => {
  it('menolak userId dari klien', () => {
    expect(createTaskSchema.safeParse({ title: 'x', userId: 'abc' }).success).toBe(false);
    expect(updateTaskSchema.safeParse({ userId: 'abc' }).success).toBe(false);
  });
  it('mengubah query string menjadi tipe', () => {
    expect(tasksQuerySchema.parse({ focusToday: 'true', limit: '10' })).toMatchObject({
      focusToday: true,
      limit: 10,
      status: 'open',
    });
  });
});

describe('habits', () => {
  it('butuh nama atau template', () => {
    expect(createHabitSchema.safeParse({}).success).toBe(false);
    expect(createHabitSchema.safeParse({ templateId: 'dzikir-pagi' }).success).toBe(true);
  });
  it('memvalidasi rentang', () => {
    expect(habitsQuerySchema.safeParse({ from: '2026-11-10', to: '2026-11-01' }).success).toBe(
      false,
    );
    expect(habitsQuerySchema.safeParse({ from: '2026-01-01', to: '2026-12-31' }).success).toBe(
      false,
    );
    expect(habitsQuerySchema.parse({ includeInactive: 'false' })).toMatchObject({
      includeInactive: false,
    });
    expect(habitsQuerySchema.safeParse({ bogus: '1' }).success).toBe(false);
  });
});

describe('goals', () => {
  it('menghitung progres manual + habit dan membatasi pada target', () => {
    expect(
      computeGoalProgress({
        target: 30,
        manualValue: 5,
        habits: [
          { weight: 2, doneCount: 4 },
          { weight: 1, doneCount: 3 },
        ],
      }),
    ).toEqual({ manual: 5, fromHabits: 11, total: 16, percent: 53, achieved: false });
    expect(
      computeGoalProgress({ target: 10, manualValue: 8, habits: [{ weight: 5, doneCount: 1 }] }),
    ).toMatchObject({
      total: 10,
      percent: 100,
      achieved: true,
    });
  });
  it('menolak habit dobel', () => {
    const habits = [
      { habitId: 'a1', weight: 1 },
      { habitId: 'a1', weight: 2 },
    ];
    expect(createGoalSchema.safeParse({ title: 'x', target: 10, habits }).success).toBe(false);
  });
});

describe('date', () => {
  it('dateRange dan diffDays', () => {
    expect(dateRange('2026-11-29', '2026-12-02')).toEqual([
      '2026-11-29',
      '2026-11-30',
      '2026-12-01',
      '2026-12-02',
    ]);
    expect(dateRange('2026-11-02', '2026-11-01')).toEqual([]);
    expect(diffDays('2026-11-01', '2026-11-12')).toBe(11);
  });
});
