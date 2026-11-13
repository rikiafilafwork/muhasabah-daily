<script setup lang="ts">
import { computed } from 'vue';
import { formatCountdown } from '@/shared';

const props = defineProps<{
  remainingMs: number;
  progress: number;
  mode: 'focus' | 'break';
  running: boolean;
}>();

const R = 88;
const C = 2 * Math.PI * R;
const dash = computed(() => C * (1 - Math.min(1, Math.max(0, props.progress))));
const label = computed(() => {
  const s = Math.ceil(props.remainingMs / 1000);
  return s >= 3600 ? formatCountdown(s) : formatCountdown(s).slice(3);
});
</script>

<template>
  <div class="relative mx-auto size-60">
    <svg viewBox="0 0 200 200" class="size-full -rotate-90" aria-hidden="true">
      <circle
        cx="100"
        cy="100"
        :r="R"
        fill="none"
        stroke-width="10"
        class="stroke-stone-100 dark:stroke-stone-800"
      />
      <circle
        cx="100"
        cy="100"
        :r="R"
        fill="none"
        stroke-width="10"
        stroke-linecap="round"
        :stroke-dasharray="C"
        :stroke-dashoffset="dash"
        :class="mode === 'focus' ? 'stroke-brand-600' : 'stroke-sky-500'"
      />
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <span class="text-xs font-medium tracking-wide text-stone-500 uppercase dark:text-stone-400">
        {{ mode === 'focus' ? 'Fokus' : 'Istirahat' }}
      </span>
      <span class="font-mono text-5xl font-semibold tabular-nums" data-testid="focus-remaining">{{
        label
      }}</span>
      <span v-if="!running" class="mt-1 text-xs text-stone-400">{{
        progress > 0 ? 'dijeda' : 'siap'
      }}</span>
    </div>
  </div>
</template>
