<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { createProjectSchema, type Color, type Project } from '@muhasabah/shared';
import { UiAlert, UiButton, UiColorPicker, UiDialog, UiInput, useZodForm } from '@/shared';
import { projectsApi } from '../api';

const props = defineProps<{ project: Project | null }>();
const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ saved: [project: Project]; deleted: [id: string] }>();

const form = reactive({ name: '', color: 'sky' as Color });
const { errors, formError, submitting, submit } = useZodForm(createProjectSchema);
const busy = ref(false);

watch(open, (isOpen) => {
  if (!isOpen) return;
  form.name = props.project?.name ?? '';
  form.color = props.project?.color ?? 'sky';
});

function onSubmit() {
  return submit({ ...form }, async (data) => {
    const saved = props.project
      ? await projectsApi.update(props.project.id, data)
      : await projectsApi.create(data);
    emit('saved', saved);
    open.value = false;
  });
}

async function archive() {
  if (!props.project) return;
  busy.value = true;
  try {
    emit(
      'saved',
      await projectsApi.update(props.project.id, { archived: !props.project.archived }),
    );
    open.value = false;
  } finally {
    busy.value = false;
  }
}

async function remove() {
  if (!props.project) return;
  busy.value = true;
  try {
    await projectsApi.remove(props.project.id);
    emit('deleted', props.project.id);
    open.value = false;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <UiDialog v-model:open="open" :title="project ? 'Ubah proyek' : 'Proyek baru'">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <UiAlert v-if="formError" tone="error">{{ formError }}</UiAlert>
      <UiInput v-model="form.name" label="Nama proyek" required :error="errors.name" />
      <UiColorPicker v-model="form.color" />
      <p v-if="project" class="text-xs text-stone-500 dark:text-stone-400">
        Menghapus proyek tidak menghapus tugasnya; tugas pindah ke Inbox.
      </p>
      <div class="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div v-if="project" class="flex gap-1">
          <UiButton variant="ghost" :loading="busy" @click="archive">
            {{ project.archived ? 'Aktifkan' : 'Arsipkan' }}
          </UiButton>
          <UiButton variant="ghost" :disabled="busy" @click="remove">Hapus</UiButton>
        </div>
        <span v-else />
        <div class="flex gap-2">
          <UiButton variant="secondary" @click="open = false">Batal</UiButton>
          <UiButton type="submit" :loading="submitting">Simpan</UiButton>
        </div>
      </div>
    </form>
  </UiDialog>
</template>
