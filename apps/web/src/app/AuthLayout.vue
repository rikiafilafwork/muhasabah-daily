<template>
  <div class="flex min-h-dvh items-center justify-center px-4 py-10">
    <main class="w-full max-w-sm">
      <div class="mb-8 flex items-center justify-center gap-2">
        <img src="/favicon.svg" alt="" class="size-10" />
        <span class="text-lg font-semibold text-brand-800 dark:text-brand-500"
          >Muhasabah Daily</span
        >
      </div>
      <div
        class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900"
      >
        <RouterView />
      </div>
    </main>
  </div>
</template>
