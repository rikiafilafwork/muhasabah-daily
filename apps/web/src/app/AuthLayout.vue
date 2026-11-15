<script setup lang="ts">
import { UiIcon } from '@/shared';
import ThemeToggle from './components/ThemeToggle.vue';

const HIGHLIGHTS = [
  {
    icon: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    text: 'Hari tertata di sekitar waktu sholat',
  },
  { icon: 'M5 13l4 4L19 7', text: 'Habit, to-do, dan goals dalam satu tempat' },
  { icon: 'M4 4h12l4 4v12H4zM8 12h8M8 16h5', text: 'Jurnal muhasabah dan catatan kajian' },
];
</script>

<template>
  <div class="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
    <!-- Panel sambutan (desktop) -->
    <aside
      class="relative hidden overflow-hidden bg-brand-900 p-12 text-brand-50 lg:flex lg:flex-col dark:bg-brand-950"
    >
      <div
        class="pointer-events-none absolute -top-32 -right-32 size-[28rem] rounded-full bg-brand-600/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -bottom-40 -left-24 size-[26rem] rounded-full bg-gold-500/25 blur-3xl"
        aria-hidden="true"
      />
      <svg class="pointer-events-none absolute inset-0 size-full opacity-[0.07]" aria-hidden="true">
        <defs>
          <pattern id="auth-star" width="56" height="56" patternUnits="userSpaceOnUse">
            <path
              d="M28 6l6 16 16 6-16 6-6 16-6-16-16-6 16-6z"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-star)" />
      </svg>

      <RouterLink to="/welcome" class="relative flex w-fit items-center gap-2.5">
        <img src="/favicon.svg" alt="" class="size-9" />
        <span class="font-display text-xl font-semibold">Muhasabah Daily</span>
      </RouterLink>

      <div class="relative my-auto max-w-md">
        <p class="font-display text-4xl leading-tight font-semibold text-white xl:text-5xl">
          Satu hari, satu langkah lebih baik.
        </p>
        <p class="mt-4 text-brand-100/90">
          Ruang pribadi untuk merencanakan, beribadah, dan bermuhasabah setiap hari.
        </p>
        <ul class="mt-10 space-y-4">
          <li v-for="h in HIGHLIGHTS" :key="h.text" class="flex items-center gap-3">
            <span
              class="flex size-9 items-center justify-center rounded-xl bg-white/10 text-gold-200 ring-1 ring-white/15"
            >
              <UiIcon :path="h.icon" class="size-5" />
            </span>
            <span class="text-sm text-brand-50">{{ h.text }}</span>
          </li>
        </ul>
      </div>

      <p class="relative text-xs text-brand-100/70">
        Open source · data tersimpan di servermu sendiri.
      </p>
    </aside>

    <!-- Formulir -->
    <div class="relative flex flex-col px-4 py-6 sm:px-8">
      <div
        class="app-glow pointer-events-none absolute inset-x-0 top-0 h-80 lg:hidden"
        aria-hidden="true"
      />
      <div class="relative flex items-center justify-between">
        <RouterLink to="/welcome" class="flex items-center gap-2.5 lg:invisible">
          <img src="/favicon.svg" alt="" class="size-8" />
          <span class="font-display text-lg font-semibold">Muhasabah Daily</span>
        </RouterLink>
        <ThemeToggle />
      </div>

      <main class="relative mx-auto my-auto w-full max-w-sm py-10">
        <div
          class="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-soft sm:p-8 dark:border-stone-800 dark:bg-stone-900"
        >
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>
