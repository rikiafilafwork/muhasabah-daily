<script setup lang="ts">
import { computed } from 'vue';
import { PRIORITY_LABELS, type Project, type Task } from '@muhasabah/shared';
import { COLOR_CLASSES, relativeDateLabel } from '@/shared';

const props = defineProps<{ task: Task; today: string; project?: Project; busy?: boolean }>();
const emit = defineEmits<{ toggle: []; focus: []; open: [] }>();

const overdue = computed(
  () => !props.task.completed && props.task.dueDate !== null && props.task.dueDate < props.today,
);
const priorityClass = {
  none: '',
  low: 'text-sky-700 dark:text-sky-400',
  medium: 'text-amber-700 dark:text-amber-400',
  high: 'text-rose-700 dark:text-rose-400',
} as const;
</script>

<template>
  <li
    class="group flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-stone-50 dark:hover:bg-stone-800/50"
    :aria-busy="busy || undefined"
  >
    <input
      type="checkbox"
      class="mt-0.5 size-5 shrink-0 cursor-pointer rounded-full accent-brand-700"
      :checked="task.completed"
      :aria-label="
        task.completed ? `Tandai ${task.title} belum selesai` : `Selesaikan ${task.title}`
      "
      :disabled="busy"
      @change="emit('toggle')"
    />
    <button type="button" class="min-w-0 flex-1 text-left" @click="emit('open')">
      <span
        :class="[
          'block text-sm',
          task.completed && 'text-stone-500 line-through dark:text-stone-400',
        ]"
      >
        {{ task.title }}
      </span>
      <span
        class="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-stone-400"
      >
        <span
          v-if="task.dueDate"
          :class="overdue && 'font-medium text-rose-700 dark:text-rose-400'"
        >
          {{ relativeDateLabel(task.dueDate, today) }}
        </span>
        <span
          v-if="task.priority !== 'none'"
          :class="['font-medium', priorityClass[task.priority]]"
        >
          ! {{ PRIORITY_LABELS[task.priority] }}
        </span>
        <span v-if="project" class="inline-flex items-center gap-1">
          <span
            :class="['size-2 rounded-full', COLOR_CLASSES[project.color].dot]"
            aria-hidden="true"
          />
          {{ project.name }}
        </span>
        <span v-if="task.notes" class="max-w-xs truncate">{{ task.notes }}</span>
      </span>
    </button>
    <button
      v-if="!task.completed"
      type="button"
      :class="[
        'shrink-0 rounded p-1 transition-opacity',
        task.focusToday
          ? 'text-amber-500'
          : 'text-stone-300 opacity-100 hover:text-amber-500 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 dark:text-stone-600',
      ]"
      :aria-pressed="task.focusToday"
      :aria-label="
        task.focusToday
          ? `Hapus ${task.title} dari fokus hari ini`
          : `Jadikan ${task.title} fokus hari ini`
      "
      :disabled="busy"
      @click="emit('focus')"
    >
      <svg
        class="size-5"
        viewBox="0 0 24 24"
        :fill="task.focusToday ? 'currentColor' : 'none'"
        stroke="currentColor"
        stroke-width="1.75"
        aria-hidden="true"
      >
        <path
          d="m12 3 2.7 5.5 6 .9-4.4 4.3 1 6L12 17l-5.3 2.7 1-6L3.3 9.4l6-.9z"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </li>
</template>
