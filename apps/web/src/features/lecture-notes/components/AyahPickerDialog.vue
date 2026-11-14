<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { ayahRefSchema, formatAyahRef, type Surah } from '@muhasabah/shared';
import { QuranNotSeeded, SurahRangePicker } from '@/features/quran';
import { UiButton, UiDialog, useZodForm } from '@/shared';

const props = defineProps<{ surahs: Surah[]; notSeeded: boolean }>();
const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{
  pick: [attrs: { surahId: number; from: number; to: number; label: string }];
}>();

const form = reactive({ surahId: '', from: '1', to: '1' });
const { errors, submit } = useZodForm(ayahRefSchema);
watch(open, (v) => v && Object.assign(form, { surahId: '', from: '1', to: '1' }));
const surah = computed(() => props.surahs.find((s) => String(s.id) === form.surahId));

function onSubmit() {
  return submit(
    { surahId: Number(form.surahId), from: Number(form.from), to: Number(form.to) },
    async (data) => {
      if (!surah.value || data.to > surah.value.ayahCount) {
        errors.to = `Surah ini hanya ${surah.value?.ayahCount ?? 0} ayat`;
        return;
      }
      emit('pick', { ...data, label: formatAyahRef(surah.value.nameLatin, data.from, data.to) });
      open.value = false;
    },
  );
}
</script>

<template>
  <UiDialog v-model:open="open" title="Sisipkan rujukan ayat" wide>
    <QuranNotSeeded v-if="notSeeded" />
    <form v-else class="space-y-4" novalidate @submit.prevent="onSubmit">
      <SurahRangePicker
        v-model:surah-id="form.surahId"
        v-model:from="form.from"
        v-model:to="form.to"
        :surahs="surahs"
        :max-ayahs="10"
        :errors="errors"
      />
      <p v-if="errors.surahId" class="text-sm text-red-700 dark:text-red-400">Pilih surah.</p>
      <div class="flex justify-end gap-2">
        <UiButton variant="secondary" @click="open = false">Batal</UiButton>
        <UiButton type="submit">Sisipkan</UiButton>
      </div>
    </form>
  </UiDialog>
</template>
