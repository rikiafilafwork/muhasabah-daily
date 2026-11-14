<script setup lang="ts">
import { UiAlert } from '@/shared';
</script>

<template>
  <UiAlert tone="warning">
    Data Al-Qur'an belum diimpor ke server lokal. Jalankan
    <code class="rounded bg-amber-100 px-1 dark:bg-amber-900">pnpm --filter api seed:quran</code>
    (sekali saja, butuh internet), lalu muat ulang halaman ini.
  </UiAlert>
</template>
