<script setup lang="ts">
/** Ikon garis sederhana dari satu atribut path SVG (24×24). */
withDefaults(defineProps<{ path: string; strokeWidth?: number }>(), { strokeWidth: 1.75 });
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="path" />
  </svg>
</template>
