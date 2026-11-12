import { ref, type Ref, watch } from 'vue';
import type { Task, TasksQuery, UpdateTaskInput } from '@muhasabah/shared';
import { ApiError } from '@/api/http';
import { tasksApi } from '../api';

/**
 * Daftar tugas untuk satu kueri, dengan paginasi kursor dan pembaruan optimistis.
 * Tugas yang tidak lagi cocok dengan tampilan (mis. diselesaikan di tampilan "terbuka")
 * tetap terlihat sampai daftar dimuat ulang, agar tidak "melompat" saat diklik.
 */
export function useTaskList(query: Ref<TasksQuery>) {
  const items = ref<Task[]>([]);
  const nextCursor = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const busyIds = ref(new Set<string>());

  async function load(append = false) {
    loading.value = true;
    error.value = null;
    try {
      const page = await tasksApi.list({
        ...query.value,
        cursor: append ? (nextCursor.value ?? undefined) : undefined,
      });
      items.value = append ? [...items.value, ...page.items] : page.items;
      nextCursor.value = page.nextCursor;
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Gagal memuat tugas';
    } finally {
      loading.value = false;
    }
  }

  async function patch(task: Task, change: UpdateTaskInput, optimistic: Partial<Task>) {
    const index = items.value.findIndex((t) => t.id === task.id);
    const before = items.value[index];
    if (index >= 0) items.value[index] = { ...task, ...optimistic };
    busyIds.value.add(task.id);
    try {
      const saved = await tasksApi.update(task.id, change);
      const i = items.value.findIndex((t) => t.id === task.id);
      if (i >= 0) items.value[i] = saved;
      return saved;
    } catch (err) {
      if (index >= 0 && before) items.value[index] = before;
      error.value = err instanceof ApiError ? err.message : 'Gagal menyimpan tugas';
      return null;
    } finally {
      busyIds.value.delete(task.id);
    }
  }

  const toggleComplete = (task: Task) =>
    patch(task, { completed: !task.completed }, { completed: !task.completed });
  const toggleFocus = (task: Task) =>
    patch(task, { focusToday: !task.focusToday }, { focusToday: !task.focusToday });

  function upsertLocal(task: Task) {
    const i = items.value.findIndex((t) => t.id === task.id);
    if (i >= 0) items.value[i] = task;
    else items.value = [task, ...items.value];
  }

  function removeLocal(id: string) {
    items.value = items.value.filter((t) => t.id !== id);
  }

  watch(query, () => load(), { immediate: true, deep: true });

  return {
    items,
    nextCursor,
    loading,
    error,
    busyIds,
    load,
    toggleComplete,
    toggleFocus,
    upsertLocal,
    removeLocal,
  };
}
