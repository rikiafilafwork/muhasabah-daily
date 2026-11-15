<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSessionStore } from '@/features/auth';
import { UiIcon, useOnline } from '@/shared';
import MoreSheet from './components/MoreSheet.vue';
import PopoverMenu from './components/PopoverMenu.vue';
import ThemeToggle from './components/ThemeToggle.vue';
import { DESKTOP_MORE, DESKTOP_PRIMARY, isActive, MOBILE_TABS, SETTINGS_ICON } from './navigation';

const session = useSessionStore();
const online = useOnline();
const showOffline = computed(() => !online.value || session.offline);
const router = useRouter();
const route = useRoute();
const sheetOpen = ref(false);

const initials = computed(() =>
  (session.user?.name ?? '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join(''),
);
const moreActive = computed(() => DESKTOP_MORE.some((i) => isActive(i, route.path)));
const sheetTabActive = computed(
  () => sheetOpen.value || !MOBILE_TABS.some((i) => isActive(i, route.path)),
);

async function logout() {
  sheetOpen.value = false;
  await session.logout();
  await router.replace({ name: 'login' });
}
</script>

<template>
  <div class="relative min-h-dvh">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:shadow-soft dark:focus:bg-stone-900"
    >
      Lewati ke konten
    </a>

    <!-- Cahaya lembut di latar atas, memberi kesan hangat tanpa mengganggu konten. -->
    <div class="app-glow pointer-events-none absolute inset-x-0 top-0 h-96" aria-hidden="true" />

    <header
      class="sticky top-0 z-40 border-b border-stone-200/70 bg-stone-50/80 backdrop-blur-lg dark:border-stone-800/70 dark:bg-stone-950/75"
    >
      <div class="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <RouterLink to="/" class="flex shrink-0 items-center gap-2.5">
          <img src="/favicon.svg" alt="" class="size-8" />
          <span
            class="font-display text-lg font-semibold tracking-tight text-stone-900 dark:text-white"
          >
            Muhasabah<span class="text-brand-700 dark:text-brand-400"> Daily</span>
          </span>
        </RouterLink>

        <nav aria-label="Navigasi utama" class="mx-auto hidden lg:block">
          <ul
            class="flex items-center gap-1 rounded-full border border-stone-200/80 bg-white/70 p-1 shadow-soft dark:border-stone-800 dark:bg-stone-900/70"
          >
            <li v-for="item in DESKTOP_PRIMARY" :key="item.to">
              <RouterLink
                :to="item.to"
                :class="[
                  'block rounded-full px-3.5 py-1.5 text-sm font-medium transition',
                  isActive(item, route.path)
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white',
                ]"
                :aria-current="isActive(item, route.path) ? 'page' : undefined"
              >
                {{ item.label }}
              </RouterLink>
            </li>
            <li>
              <PopoverMenu panel-class="w-64">
                <template #trigger="{ open }">
                  <span
                    :class="[
                      'flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition',
                      moreActive
                        ? 'bg-brand-700 text-white'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white',
                    ]"
                  >
                    Lainnya
                    <UiIcon
                      path="M6 9l6 6 6-6"
                      :class="['size-4 transition', open && 'rotate-180']"
                      :stroke-width="2"
                    />
                  </span>
                </template>
                <ul>
                  <li v-for="item in DESKTOP_MORE" :key="item.to">
                    <RouterLink
                      :to="item.to"
                      :class="[
                        'flex items-center gap-3 rounded-xl p-2 transition hover:bg-stone-100 dark:hover:bg-stone-800',
                        isActive(item, route.path) && 'bg-brand-50 dark:bg-brand-950',
                      ]"
                      :aria-current="isActive(item, route.path) ? 'page' : undefined"
                    >
                      <span
                        class="flex size-9 items-center justify-center rounded-xl bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200"
                      >
                        <UiIcon :path="item.icon" class="size-5" />
                      </span>
                      <span>
                        <span class="block text-sm font-medium">{{ item.label }}</span>
                        <span class="block text-xs text-stone-500 dark:text-stone-400">
                          {{ item.hint }}
                        </span>
                      </span>
                    </RouterLink>
                  </li>
                </ul>
              </PopoverMenu>
            </li>
          </ul>
        </nav>

        <div class="ml-auto flex items-center gap-1 lg:ml-0">
          <ThemeToggle />
          <PopoverMenu align="right" panel-class="w-60">
            <template #trigger>
              <span
                class="ml-1 flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-gold-200 to-gold-400 text-xs font-bold text-gold-700 ring-2 ring-white transition hover:ring-gold-200 dark:from-gold-500 dark:to-gold-700 dark:text-gold-50 dark:ring-stone-900"
              >
                <span aria-hidden="true">{{ initials }}</span>
                <span class="sr-only">Akun</span>
              </span>
            </template>
            <template #default>
              <div class="border-b border-stone-200 px-3 pt-1 pb-3 dark:border-stone-800">
                <p class="truncate text-sm font-semibold">{{ session.user?.name }}</p>
                <p class="truncate text-xs text-stone-500 dark:text-stone-400">
                  {{ session.user?.email }}
                </p>
              </div>
              <RouterLink
                to="/settings"
                class="mt-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <UiIcon :path="SETTINGS_ICON" class="size-4 text-stone-500" />
                Pengaturan
              </RouterLink>
              <button
                type="button"
                class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                @click="logout"
              >
                <UiIcon path="M9 21H5V3h4M16 17l5-5-5-5M21 12H9" class="size-4" />
                Keluar
              </button>
            </template>
          </PopoverMenu>
        </div>
      </div>
    </header>

    <main
      id="main"
      class="relative mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:pt-10 lg:pb-16"
      tabindex="-1"
    >
      <div
        v-if="showOffline"
        role="status"
        class="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100"
      >
        <UiIcon
          path="M3 3l18 18M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 4.2-2.5M14.8 10.4A10 10 0 0 1 19 12.9M2 9.3a15 15 0 0 1 4.3-2.6M11 5.1a15 15 0 0 1 11 4.2M12 20h.01"
          class="mt-0.5 size-5 shrink-0"
        />
        <p>
          <strong class="font-semibold">Sedang offline.</strong>
          Menampilkan data terakhir yang tersimpan di perangkat ini. Perubahan belum bisa disimpan
          sampai tersambung lagi.
        </p>
      </div>
      <RouterView />
    </main>

    <!-- Tab bar mobile -->
    <nav
      aria-label="Navigasi utama"
      class="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/80 bg-white/90 pb-safe backdrop-blur-lg lg:hidden dark:border-stone-800 dark:bg-stone-950/90"
    >
      <ul class="mx-auto grid max-w-md grid-cols-5">
        <li v-for="item in MOBILE_TABS" :key="item.to">
          <RouterLink
            :to="item.to"
            :class="[
              'flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition',
              isActive(item, route.path) && !sheetOpen
                ? 'text-brand-800 dark:text-brand-300'
                : 'text-stone-500 dark:text-stone-400',
            ]"
            :aria-current="isActive(item, route.path) ? 'page' : undefined"
          >
            <span
              :class="[
                'flex h-7 w-12 items-center justify-center rounded-full transition',
                isActive(item, route.path) && !sheetOpen && 'bg-brand-100 dark:bg-brand-900/70',
              ]"
            >
              <UiIcon :path="item.icon" class="size-5" />
            </span>
            {{ item.label }}
          </RouterLink>
        </li>
        <li>
          <button
            type="button"
            :class="[
              'flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition',
              sheetTabActive
                ? 'text-brand-800 dark:text-brand-300'
                : 'text-stone-500 dark:text-stone-400',
            ]"
            :aria-expanded="sheetOpen"
            @click="sheetOpen = true"
          >
            <span
              :class="[
                'flex h-7 w-12 items-center justify-center rounded-full transition',
                sheetTabActive && 'bg-brand-100 dark:bg-brand-900/70',
              ]"
            >
              <UiIcon path="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" class="size-5" />
            </span>
            Lainnya
          </button>
        </li>
      </ul>
    </nav>

    <MoreSheet v-model:open="sheetOpen" @logout="logout" />
  </div>
</template>
