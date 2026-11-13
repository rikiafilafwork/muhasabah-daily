<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppLayout from './AppLayout.vue';
import AuthLayout from './AuthLayout.vue';

const route = useRoute();
const layout = computed(() => (route.meta.layout === 'auth' ? AuthLayout : AppLayout));
</script>

<template>
  <component :is="layout" v-if="route.matched.length" />
  <!-- Saat sesi dipulihkan dari cookie refresh, tampilkan penanda alih-alih layar kosong. -->
  <div v-else class="flex min-h-dvh items-center justify-center" role="status">
    <img src="/favicon.svg" alt="" class="size-10 animate-pulse" />
    <span class="sr-only">Memuat Muhasabah Daily…</span>
  </div>
</template>
