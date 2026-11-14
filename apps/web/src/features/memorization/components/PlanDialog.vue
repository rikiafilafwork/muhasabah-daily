<script setup lang="ts">
import { reactive, watch } from 'vue';
import {
  createMemorizationPlanSchema,
  MEMORIZATION_MAX_AYAHS,
  type MemorizationPlan,
  type Surah,
} from '@muhasabah/shared';
import { SurahRangePicker } from '@/features/quran';
import { UiAlert, UiButton, UiDialog, UiInput, useZodForm } from '@/shared';
import { memorizationApi } from '../api';

defineProps<{ surahs: Surah[] }>();
const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ created: [plan: MemorizationPlan] }>();

const form = reactive({
  surahId: '',
  from: '1',
  to: '1',
  title: '',
  listen: '5',
  recite: '5',
  connect: '3',
});
const { errors, formError, submitting, submit } = useZodForm(createMemorizationPlanSchema);
watch(open, (v) => {
  if (v) Object.assign(form, { surahId: '', from: '1', to: '1', title: '' });
});

const n = (s: string) => (s.trim() === '' ? NaN : Number(s));

function onSubmit() {
  return submit(
    {
      surahId: n(form.surahId),
      fromAyah: n(form.from),
      toAyah: n(form.to),
      title: form.title.trim() || null,
      settings: {
        listenRepeat: n(form.listen),
        reciteRepeat: n(form.recite),
        connectRepeat: n(form.connect),
      },
    },
    async (data) => {
      emit('created', await memorizationApi.create(data));
      open.value = false;
    },
  );
}
</script>

<template>
  <UiDialog
    v-model:open="open"
    title="Rencana hafalan baru"
    description="Tahapan tikrar dibuat otomatis dan bisa disesuaikan nanti."
    wide
  >
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <UiAlert v-if="formError" tone="error">{{ formError }}</UiAlert>
      <SurahRangePicker
        v-model:surah-id="form.surahId"
        v-model:from="form.from"
        v-model:to="form.to"
        :surahs="surahs"
        :max-ayahs="MEMORIZATION_MAX_AYAHS"
        :errors="errors"
      />
      <p v-if="errors.surahId" class="text-sm text-red-700 dark:text-red-400">Pilih surah.</p>
      <UiInput v-model="form.title" label="Nama rencana (opsional)" :error="errors.title" />
      <fieldset>
        <legend class="mb-1 text-sm font-medium text-stone-700 dark:text-stone-300">
          Jumlah ulangan per ayat
        </legend>
        <div class="grid grid-cols-3 gap-3">
          <UiInput v-model="form.listen" label="Dengarkan" inputmode="numeric" />
          <UiInput v-model="form.recite" label="Baca sendiri" inputmode="numeric" />
          <UiInput v-model="form.connect" label="Sambung" inputmode="numeric" />
        </div>
        <p class="mt-1 text-xs text-stone-500 dark:text-stone-400">
          Setiap ayat: dengarkan murottal, baca sendiri, lalu sambung dengan ayat-ayat sebelumnya.
        </p>
        <p v-if="errors.settings" class="text-sm text-red-700 dark:text-red-400">
          {{ errors.settings }}
        </p>
      </fieldset>
      <div class="flex justify-end gap-2">
        <UiButton variant="secondary" @click="open = false">Batal</UiButton>
        <UiButton type="submit" :loading="submitting">Buat rencana</UiButton>
      </div>
    </form>
  </UiDialog>
</template>
