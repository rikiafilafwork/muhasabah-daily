<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSessionStore } from '@/features/auth';
import { NAV_ITEMS } from './navigation';

const session = useSessionStore();
const router = useRouter();
const route = useRoute();
const menuOpen = ref(false);
const initials = computed(() =>
  (session.user?.name ?? '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join(''),
);

watch(
  () => route.fullPath,
  () => (menuOpen.value = false),
);

async function logout() {
  await session.logout();
  await router.replace({ name: 'login' });
}
</script>

<template>
  <div class="min-h-dvh md:grid md:grid-cols-[15rem_1fr]">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm"
    >
      Lewati ke konten
    </a>

    <header
      class="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden dark:border-stone-800 dark:bg-stone-950/90"
    >
      <RouterLink to="/" class="font-semibold text-brand-800 dark:text-brand-500"
        >Muhasabah Daily</RouterLink
      >
      <button
        type="button"
        class="rounded-lg p-2 hover:bg-stone-100 dark:hover:bg-stone-800"
        :aria-expanded="menuOpen"
        aria-controls="sidebar"
        @click="menuOpen = !menuOpen"
      >
        <span class="sr-only">{{ menuOpen ? 'Tutup menu' : 'Buka menu' }}</span>
        <svg
          class="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path
            :d="menuOpen ? 'M6 6l12 12M18 6 6 18' : 'M4 6h16M4 12h16M4 18h16'"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </header>

    <aside
      id="sidebar"
      :class="[
        'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-stone-200 bg-white px-3 py-4 transition-transform md:sticky md:top-0 md:h-dvh md:translate-x-0 dark:border-stone-800 dark:bg-stone-900',
        menuOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <RouterLink to="/" class="mb-6 flex items-center gap-2 px-2">
        <img src="/favicon.svg" alt="" class="size-8" />
        <span class="font-semibold text-brand-800 dark:text-brand-500">Muhasabah Daily</span>
      </RouterLink>

      <nav aria-label="Navigasi utama" class="flex-1 overflow-y-auto">
        <ul class="space-y-0.5">
          <li v-for="item in NAV_ITEMS" :key="item.to">
            <RouterLink
              :to="item.to"
              class="group flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
              exact-active-class="!bg-brand-50 !text-brand-800 font-medium dark:!bg-brand-900/40 dark:!text-brand-100"
            >
              <svg
                class="size-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path :d="item.icon" />
              </svg>
              <span class="flex-1">{{ item.label }}</span>
              <span
                v-if="item.phase"
                class="rounded bg-stone-100 px-1.5 py-0.5 text-[11px] font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300"
              >
                segera
              </span>
            </RouterLink>
          </li>
        </ul>
      </nav>

      <div class="mt-4 border-t border-stone-200 pt-4 dark:border-stone-800">
        <RouterLink
          to="/settings"
          class="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-stone-100 dark:hover:bg-stone-800"
          exact-active-class="bg-stone-100 dark:bg-stone-800"
        >
          <span
            class="flex size-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800 dark:bg-brand-900 dark:text-brand-100"
            aria-hidden="true"
          >
            {{ initials }}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium">{{ session.user?.name }}</span>
            <span class="block text-xs text-stone-600 dark:text-stone-400">Pengaturan</span>
          </span>
        </RouterLink>
        <button
          type="button"
          class="mt-1 w-full rounded-lg px-2 py-2 text-left text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
          @click="logout"
        >
          Keluar
        </button>
      </div>
    </aside>

    <div
      v-if="menuOpen"
      class="fixed inset-0 z-30 bg-stone-950/40 md:hidden"
      aria-hidden="true"
      @click="menuOpen = false"
    />

    <main id="main" class="px-4 py-6 md:px-8 md:py-8">
      <RouterView />
    </main>
  </div>
</template>
