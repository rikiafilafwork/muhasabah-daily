<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { updateHabitSchema, type Color, type Habit } from '@muhasabah/shared';
import { UiAlert, UiButton, UiColorPicker, UiDialog, UiInput, useZodForm } from '@/shared';
import { habitsApi } from '../api';

const props = defineProps<{ habit: Habit | null }>();
const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ changed: [] }>();

const form = reactive({ name: '', color: 'emerald' as Color, startDate: '' });
const { errors, formError, submitting, submit } = useZodForm(updateHabitSchema);
const busy = ref(false);

watch(open, (v) => {
  if (!v || !props.habit) return;
  form.name = props.habit.name;
  form.color = props.habit.color;
  form.startDate = props.habit.startDate;
});

function onSubmit() {
  return submit({ ...form }, async (data) => {
    await habitsApi.update(props.habit!.id, data);
    emit('changed');
    open.value = false;
  });
}

async function run(action: () => Promise<unknown>) {
  busy.value = true;
  try {
    await action();
    emit('changed');
    open.value = false;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <UiDialog v-model:open="open" title="Ubah habit">
    <form v-if="habit" class="space-y-4" novalidate @submit.prevent="onSubmit">
      <UiAlert v-if="formError" tone="error">{{ formError }}</UiAlert>
      <UiInput v-model="form.name" label="Nama" :error="errors.name" />
      <UiInput
        v-model="form.startDate"
        label="Tanggal mulai"
        type="date"
        hint="Konsistensi dihitung sejak tanggal ini. Pilih tanggal lebih awal untuk mencentang hari-hari sebelumnya."
        :error="errors.startDate"
      />
      <UiColorPicker v-model="form.color" />
      <div class="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div class="flex gap-1">
          <UiButton
            variant="ghost"
            :loading="busy"
            @click="run(() => habitsApi.update(habit!.id, { active: false }))"
          >
            Arsipkan
          </UiButton>
          <UiButton variant="ghost" :disabled="busy" @click="run(() => habitsApi.remove(habit!.id))"
            >Hapus</UiButton
          >
        </div>
        <div class="flex gap-2">
          <UiButton variant="secondary" @click="open = false">Batal</UiButton>
          <UiButton type="submit" :loading="submitting">Simpan</UiButton>
        </div>
      </div>
      <p class="text-xs text-stone-500 dark:text-stone-400">
        Arsipkan untuk menyembunyikan habit tanpa menghapus riwayatnya. Hapus menghilangkan semua
        log.
      </p>
    </form>
  </UiDialog>
</template>
