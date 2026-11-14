<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';
import { computed, ref, watchEffect } from 'vue';
import type { Ayah } from '@muhasabah/shared';
import { loadAyahs } from '@/features/quran';

/** Tampilan node rujukan ayat di editor: label, teks Arab, dan terjemah dari data lokal. */
const props = defineProps(nodeViewProps);
const ayahs = ref<Ayah[]>([]);
const failed = ref(false);
const attrs = computed(
  () => props.node.attrs as { surahId: number; from: number; to: number; label: string },
);

watchEffect(async () => {
  failed.value = false;
  try {
    ayahs.value = await loadAyahs(
      Number(attrs.value.surahId),
      Number(attrs.value.from),
      Number(attrs.value.to),
    );
  } catch {
    failed.value = true;
  }
});
</script>

<template>
  <NodeViewWrapper
    as="figure"
    :class="[
      'my-3 rounded-xl border-l-4 border-brand-600 bg-brand-50/60 px-4 py-3 dark:bg-brand-900/20',
      selected && 'ring-2 ring-brand-500',
    ]"
    data-testid="ayah-ref"
    contenteditable="false"
  >
    <figcaption
      class="mb-2 flex items-center justify-between gap-2 text-sm font-semibold text-brand-800 dark:text-brand-200"
    >
      <span>{{ attrs.label || `QS ${attrs.surahId}: ${attrs.from}–${attrs.to}` }}</span>
      <button
        v-if="editor.isEditable"
        type="button"
        class="rounded px-2 py-0.5 text-xs font-normal text-stone-600 hover:bg-white dark:text-stone-300 dark:hover:bg-stone-800"
        @click="deleteNode()"
      >
        Hapus<span class="sr-only"> rujukan {{ attrs.label }}</span>
      </button>
    </figcaption>
    <p v-if="failed" class="text-sm text-stone-600 dark:text-stone-400">
      Teks ayat belum tersedia (data Al-Qur'an belum diimpor atau tidak bisa dimuat).
    </p>
    <div v-for="a in ayahs" :key="a.id" class="mb-2 last:mb-0">
      <p lang="ar" dir="rtl" class="font-arabic text-right text-xl leading-[2.1]">
        {{ a.arabic }}
        <span class="font-sans text-sm text-stone-500 dark:text-stone-400"
          >﴿{{ a.numberInSurah }}﴾</span
        >
      </p>
      <p class="text-sm text-stone-700 dark:text-stone-300">
        {{ a.numberInSurah }}. {{ a.translation }}
      </p>
    </div>
  </NodeViewWrapper>
</template>
