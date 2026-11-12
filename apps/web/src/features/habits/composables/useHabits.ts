import { ref, type Ref, watch } from 'vue';
import type { Habit, HabitTemplate } from '@muhasabah/shared';
import { ApiError } from '@/api/http';
import { habitsApi } from '../api';

/** Habit aktif beserta log dalam rentang, dengan centang optimistis. */
export function useHabits(range: Ref<{ from: string; to: string }>) {
  const items = ref<Habit[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pending = ref(new Set<string>());

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      items.value = (await habitsApi.list(range.value)).items;
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Gagal memuat habit';
    } finally {
      loading.value = false;
    }
  }

  const isDone = (habit: Habit, date: string) => habit.logs.includes(date);

  async function toggle(habit: Habit, date: string) {
    const key = `${habit.id}:${date}`;
    if (pending.value.has(key)) return;
    const done = !isDone(habit, date);
    const apply = (value: boolean) => {
      const h = items.value.find((x) => x.id === habit.id);
      if (!h) return;
      h.logs = value ? [...new Set([...h.logs, date])].sort() : h.logs.filter((d) => d !== date);
    };
    apply(done);
    pending.value.add(key);
    try {
      await habitsApi.setLog(habit.id, date, done);
    } catch (err) {
      apply(!done);
      error.value = err instanceof ApiError ? err.message : 'Gagal menyimpan';
    } finally {
      pending.value.delete(key);
    }
  }

  watch(range, load, { immediate: true, deep: true });
  return { items, loading, error, pending, load, isDone, toggle };
}

let templatesCache: Promise<HabitTemplate[]> | null = null;

/** Library template (statis), dimuat sekali per sesi halaman. */
export function loadTemplates(): Promise<HabitTemplate[]> {
  templatesCache ??= habitsApi
    .templates()
    .then((r) => r.items)
    .catch((err) => {
      templatesCache = null;
      throw err;
    });
  return templatesCache;
}
