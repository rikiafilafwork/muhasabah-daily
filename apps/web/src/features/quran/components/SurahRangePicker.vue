<script setup lang="ts">
import { computed, watch } from 'vue';
import type { Surah } from '@muhasabah/shared';
import { UiInput, UiSelect } from '@/shared';

/** Pemilih surah dan rentang ayat. Nilai dalam string agar cocok dengan input. */
const props = defineProps<{
  surahs: Surah[];
  maxAyahs?: number;
  errors?: Record<string, string | undefined>;
}>();
const surahId = defineModel<string>('surahId', { required: true });
const from = defineModel<string>('from', { required: true });
const to = defineModel<string>('to', { required: true });

const surah = computed(() => props.surahs.find((s) => String(s.id) === surahId.value));
const options = computed(() =>
  props.surahs.map((s) => ({
    value: String(s.id),
    label: `${s.id}. ${s.nameLatin} (${s.ayahCount} ayat)`,
  })),
);

watch(surahId, () => {
  if (!surah.value) return;
  from.value = '1';
  to.value = String(Math.min(surah.value.ayahCount, props.maxAyahs ?? surah.value.ayahCount));
});
</script>

<template>
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr]">
    <UiSelect v-model="surahId" label="Surah" placeholder="Pilih surah…" :options="options" />
    <UiInput
      v-model="from"
      label="Dari ayat"
      inputmode="numeric"
      :error="errors?.fromAyah ?? errors?.from"
    />
    <UiInput
      v-model="to"
      label="Sampai ayat"
      inputmode="numeric"
      :hint="surah ? `Maks. ${surah.ayahCount}` : undefined"
      :error="errors?.toAyah ?? errors?.to"
    />
  </div>
</template>
