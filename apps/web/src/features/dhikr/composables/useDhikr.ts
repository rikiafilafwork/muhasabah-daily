import { computed, ref, watch, type Ref } from 'vue';
import type { DhikrGroup, DhikrItem } from '@muhasabah/shared';
import { DHIKR_MAX_COUNT } from '@muhasabah/shared';
import { ApiError } from '@/api/http';
import { dhikrApi } from '../api';
import { useDhikrSync } from './useDhikrSync';

/** Konten satu grup dengan hitungan lokal yang langsung tampil dan disinkron di latar. */
export function useDhikr(userId: string, group: Ref<DhikrGroup>, date: Ref<string>) {
  const { queue, status } = useDhikrSync(userId);
  const items = ref<DhikrItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      const res = await dhikrApi.list(group.value, date.value);
      // Hitungan lokal yang belum terkirim lebih baru daripada data server.
      const pending = queue.pendingFor(res.date);
      items.value = res.items.map((i) => ({ ...i, count: pending[i.id] ?? i.count }));
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Gagal memuat dzikir. Periksa koneksi.';
    } finally {
      loading.value = false;
    }
  }
  watch([group, date], load, { immediate: true });

  function setCount(item: DhikrItem, count: number) {
    const value = Math.max(0, Math.min(DHIKR_MAX_COUNT, count));
    const target = items.value.find((i) => i.id === item.id);
    if (!target || target.count === value) return;
    target.count = value;
    queue.set(item.id, date.value, value);
  }

  const completed = computed(() => items.value.filter((i) => i.count >= i.repeat).length);

  return {
    items,
    loading,
    error,
    status,
    completed,
    load,
    increment: (i: DhikrItem) => setCount(i, i.count + 1),
    decrement: (i: DhikrItem) => setCount(i, i.count - 1),
    reset: (i: DhikrItem) => setCount(i, 0),
  };
}
