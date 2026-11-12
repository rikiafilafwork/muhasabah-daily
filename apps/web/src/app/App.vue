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
</template>
