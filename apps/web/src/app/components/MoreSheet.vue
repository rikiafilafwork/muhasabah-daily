<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useSessionStore } from '@/features/auth';
import { UiIcon } from '@/shared';
import { GROUP_LABELS, isActive, NAV_ITEMS, SETTINGS_ICON, type NavGroup } from '../navigation';

/** Lembar bawah (mobile) berisi semua fitur, pengaturan, dan tombol keluar. */
const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ logout: [] }>();

const session = useSessionStore();
const route = useRoute();
const dialog = ref<HTMLDialogElement | null>(null);
const titleId = useId();

const groups = computed(() =>
  (['produktivitas', 'ibadah', 'refleksi'] as NavGroup[]).map((g) => ({
    key: g,
    label: GROUP_LABELS[g],
    items: NAV_ITEMS.filter((i) => i.group === g),
  })),
);

watch(
  open,
  async (v) => {
    await nextTick();
    const el = dialog.value;
    if (!el) return;
    if (v && !el.open) el.showModal();
    if (!v && el.open) el.close();
  },
  { immediate: true },
);
watch(
  () => route.fullPath,
  () => (open.value = false),
);

function onBackdrop(e: MouseEvent) {
  if (e.target === dialog.value) open.value = false;
}
</script>

<template>
  <dialog
    ref="dialog"
    :aria-labelledby="titleId"
    class="mx-0 mt-auto mb-0 max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t-3xl border-t border-stone-200 bg-stone-50 p-0 text-stone-900 backdrop:bg-stone-950/40 backdrop:backdrop-blur-[2px] open:animate-sheet-up dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
    @close="open = false"
    @click="onBackdrop"
  >
    <div v-if="open" class="px-4 pt-3 pb-safe">
      <div class="mx-auto mb-3 h-1.5 w-10 rounded-full bg-stone-300 dark:bg-stone-700" />
      <div class="mb-4 flex items-center justify-between">
        <h2 :id="titleId" class="font-display text-xl font-semibold">Semua fitur</h2>
        <button
          type="button"
          class="rounded-full p-2 text-stone-500 hover:bg-stone-200/60 dark:text-stone-400 dark:hover:bg-stone-800"
          @click="open = false"
        >
          <span class="sr-only">Tutup</span>
          <UiIcon path="M6 6l12 12M18 6 6 18" class="size-5" :stroke-width="2" />
        </button>
      </div>

      <nav aria-label="Semua fitur" class="space-y-5">
        <section v-for="g in groups" :key="g.key">
          <h3
            class="mb-2 px-1 text-xs font-semibold tracking-wider text-stone-500 uppercase dark:text-stone-400"
          >
            {{ g.label }}
          </h3>
          <ul class="grid grid-cols-2 gap-2">
            <li v-for="item in g.items" :key="item.to">
              <RouterLink
                :to="item.to"
                :class="[
                  'flex h-full items-start gap-3 rounded-2xl border p-3 transition',
                  isActive(item, route.path)
                    ? 'border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-100'
                    : 'border-stone-200 bg-white hover:border-stone-300 dark:border-stone-800 dark:bg-stone-950 dark:hover:border-stone-700',
                ]"
                :aria-current="isActive(item, route.path) ? 'page' : undefined"
              >
                <span
                  class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200"
                >
                  <UiIcon :path="item.icon" class="size-5" />
                </span>
                <span class="min-w-0">
                  <span class="block text-sm font-medium">{{ item.label }}</span>
                  <span class="block text-xs text-stone-500 dark:text-stone-400">{{
                    item.hint
                  }}</span>
                </span>
              </RouterLink>
            </li>
          </ul>
        </section>

        <section
          class="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-950"
        >
          <RouterLink to="/settings" class="flex min-w-0 flex-1 items-center gap-3">
            <UiIcon :path="SETTINGS_ICON" class="size-5 shrink-0 text-stone-500" />
            <span class="min-w-0">
              <span class="block truncate text-sm font-medium">{{ session.user?.name }}</span>
              <span class="block text-xs text-stone-500 dark:text-stone-400">Pengaturan akun</span>
            </span>
          </RouterLink>
          <button
            type="button"
            class="rounded-full px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
            @click="emit('logout')"
          >
            Keluar
          </button>
        </section>
      </nav>
      <div class="h-4" />
    </div>
  </dialog>
</template>
