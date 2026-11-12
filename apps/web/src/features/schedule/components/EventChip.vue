<script setup lang="ts">
import type { CalendarEvent } from '@muhasabah/shared';
import { COLOR_CLASSES } from '@/shared';

defineProps<{ event: CalendarEvent; time?: string; compact?: boolean }>();
defineEmits<{ open: [] }>();
</script>

<template>
  <button
    type="button"
    :class="[
      'block w-full rounded-md border-l-4 text-left',
      COLOR_CLASSES[event.color].border,
      COLOR_CLASSES[event.color].soft,
      compact ? 'truncate px-1.5 py-0.5 text-xs' : 'px-2.5 py-1.5 text-sm',
    ]"
    @click.stop="$emit('open')"
  >
    <span v-if="time && !compact" class="block text-xs opacity-75">{{ time }}</span>
    <span :class="compact ? '' : 'block font-medium'">{{ event.title }}</span>
    <span v-if="event.location && !compact" class="block text-xs opacity-75">{{
      event.location
    }}</span>
  </button>
</template>
