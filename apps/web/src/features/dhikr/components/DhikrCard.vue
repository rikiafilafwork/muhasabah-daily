<script setup lang="ts">
import { computed } from 'vue';
import type { DhikrItem } from '@muhasabah/shared';

const props = defineProps<{ item: DhikrItem; showLatin: boolean; showTranslation: boolean }>();
const emit = defineEmits<{ increment: []; decrement: []; reset: [] }>();

const done = computed(() => props.item.count >= props.item.repeat);
const pct = computed(() => Math.min(100, (props.item.count / props.item.repeat) * 100));
</script>

<template>
  <article
    :class="[
      'rounded-2xl border bg-white p-5 shadow-xs transition-colors dark:bg-stone-900',
      done ? 'border-brand-300 dark:border-brand-800' : 'border-stone-200 dark:border-stone-800',
    ]"
    :aria-labelledby="`dhikr-${item.id}`"
    data-testid="dhikr-card"
  >
    <header class="flex items-start justify-between gap-3">
      <h2 :id="`dhikr-${item.id}`" class="font-semibold">{{ item.title }}</h2>
      <span
        :class="[
          'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
          done
            ? 'bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100'
            : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
        ]"
      >
        {{ item.repeat }}×
      </span>
    </header>

    <p
      lang="ar"
      dir="rtl"
      class="font-arabic mt-4 text-right text-2xl leading-[2.2] sm:text-[1.7rem]"
    >
      {{ item.arabic }}
    </p>
    <p v-if="showLatin" class="mt-3 text-sm text-stone-600 italic dark:text-stone-300">
      {{ item.latin }}
    </p>
    <p v-if="showTranslation" class="mt-2 text-sm text-stone-700 dark:text-stone-300">
      {{ item.translation }}
    </p>
    <p v-if="item.note" class="mt-2 text-xs text-stone-500 dark:text-stone-400">{{ item.note }}</p>
    <p class="mt-2 text-xs text-brand-700 dark:text-brand-500">Rujukan: {{ item.reference }}</p>

    <div class="mt-4 flex items-center gap-3">
      <button
        type="button"
        :class="[
          'relative flex h-14 flex-1 items-center justify-center overflow-hidden rounded-xl text-base font-semibold transition-colors select-none',
          done
            ? 'bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100'
            : 'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900',
        ]"
        :disabled="done"
        @click="emit('increment')"
      >
        <span
          v-if="!done"
          class="absolute inset-y-0 left-0 bg-brand-950/30"
          :style="{ width: `${pct}%` }"
          aria-hidden="true"
        />
        <!-- Nama aksesibel memuat teks yang terlihat (WCAG 2.5.3). -->
        <span class="relative tabular-nums">
          <span class="sr-only">{{ done ? `${item.title}:` : `Hitung ${item.title}:` }}</span>
          <template v-if="done">Tuntas ✓ {{ item.count }}/{{ item.repeat }}</template>
          <template v-else>{{ item.count }} / {{ item.repeat }}</template>
        </span>
      </button>
      <div class="flex flex-col gap-1">
        <button
          type="button"
          class="rounded-lg px-2 py-1 text-xs text-stone-500 dark:text-stone-400 hover:bg-stone-100 disabled:opacity-40 dark:hover:bg-stone-800"
          :disabled="item.count === 0"
          @click="emit('decrement')"
        >
          −1<span class="sr-only"> hitungan {{ item.title }}</span>
        </button>
        <button
          type="button"
          class="rounded-lg px-2 py-1 text-xs text-stone-500 dark:text-stone-400 hover:bg-stone-100 disabled:opacity-40 dark:hover:bg-stone-800"
          :disabled="item.count === 0"
          @click="emit('reset')"
        >
          Ulang<span class="sr-only"> hitungan {{ item.title }}</span>
        </button>
      </div>
    </div>
  </article>
</template>
