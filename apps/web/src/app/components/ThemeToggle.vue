<script setup lang="ts">
import { computed } from 'vue';
import type { Theme } from '@muhasabah/shared';
import { useSessionStore } from '@/features/auth';
import { profileApi } from '@/features/profile';
import { UiIcon, useTheme } from '@/shared';

/**
 * Tombol tema di header: Terang → Gelap → Sistem. Saat masuk, pilihan disimpan ke
 * profil agar ikut di perangkat lain; di halaman masuk cukup di perangkat ini.
 */
const { theme, setTheme } = useTheme();
const session = useSessionStore();

const ORDER: Theme[] = ['light', 'dark', 'system'];
const LABELS: Record<Theme, string> = { light: 'Terang', dark: 'Gelap', system: 'Ikuti sistem' };
const ICONS: Record<Theme, string> = {
  light:
    'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  dark: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  system: 'M3 4h18v12H3zM8 20h8M12 16v4',
};

const nextTheme = computed(() => ORDER[(ORDER.indexOf(theme.value) + 1) % ORDER.length]!);

async function cycle() {
  const t = nextTheme.value;
  setTheme(t);
  if (session.isAuthenticated) {
    try {
      session.setUser(await profileApi.update({ theme: t }));
    } catch {
      /* Tetap berlaku di perangkat ini walau gagal disimpan. */
    }
  }
}
</script>

<template>
  <button
    type="button"
    class="relative inline-flex size-10 items-center justify-center rounded-full text-stone-600 transition hover:bg-stone-200/60 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white"
    :title="`Tema: ${LABELS[theme]} (ganti ke ${LABELS[nextTheme]})`"
    data-testid="theme-toggle"
    @click="cycle"
  >
    <span class="sr-only">Tema: {{ LABELS[theme] }}. Ganti ke {{ LABELS[nextTheme] }}</span>
    <Transition
      mode="out-in"
      enter-from-class="rotate-[-60deg] scale-50 opacity-0"
      leave-to-class="rotate-[60deg] scale-50 opacity-0"
      enter-active-class="transition duration-200"
      leave-active-class="transition duration-150"
    >
      <UiIcon :key="theme" :path="ICONS[theme]" class="size-5" />
    </Transition>
  </button>
</template>
