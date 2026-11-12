<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import {
  createTaskSchema,
  PRIORITIES,
  PRIORITY_LABELS,
  type CreateTaskInput,
  type Priority,
  type Project,
  type Task,
} from '@muhasabah/shared';
import { UiAlert, UiButton, UiDialog, UiInput, UiSelect, UiTextarea, useZodForm } from '@/shared';
import { tasksApi } from '../api';

const props = defineProps<{
  task: Task | null;
  projects: Project[];
  defaults?: Partial<CreateTaskInput>;
}>();
const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ saved: [task: Task]; deleted: [id: string] }>();

const form = reactive({
  title: '',
  notes: '',
  projectId: '',
  priority: 'none' as Priority,
  dueDate: '',
  focusToday: false,
});
const { errors, formError, submitting, submit } = useZodForm(createTaskSchema);
const deleting = ref(false);

watch(open, (isOpen) => {
  if (!isOpen) return;
  const t = props.task;
  const d = props.defaults ?? {};
  form.title = t?.title ?? '';
  form.notes = t?.notes ?? '';
  form.projectId = t?.projectId ?? d.projectId ?? '';
  form.priority = t?.priority ?? d.priority ?? 'none';
  form.dueDate = t?.dueDate ?? d.dueDate ?? '';
  form.focusToday = t?.focusToday ?? d.focusToday ?? false;
});

function onSubmit() {
  const values = {
    title: form.title,
    notes: form.notes.trim() || null,
    projectId: form.projectId || null,
    priority: form.priority,
    dueDate: form.dueDate || null,
    focusToday: form.focusToday,
  };
  return submit(values, async (data) => {
    const saved = props.task
      ? await tasksApi.update(props.task.id, data)
      : await tasksApi.create(data);
    emit('saved', saved);
    open.value = false;
  });
}

async function onDelete() {
  if (!props.task) return;
  deleting.value = true;
  try {
    await tasksApi.remove(props.task.id);
    emit('deleted', props.task.id);
    open.value = false;
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <UiDialog v-model:open="open" :title="task ? 'Ubah tugas' : 'Tugas baru'">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <UiAlert v-if="formError" tone="error">{{ formError }}</UiAlert>
      <UiInput v-model="form.title" label="Judul" required :error="errors.title" />
      <UiTextarea v-model="form.notes" label="Catatan" :error="errors.notes" />
      <div class="grid gap-4 sm:grid-cols-2">
        <UiSelect
          v-model="form.projectId"
          label="Proyek"
          :options="[
            { value: '', label: 'Inbox (tanpa proyek)' },
            ...projects.map((p) => ({ value: p.id, label: p.name })),
          ]"
        />
        <UiSelect
          v-model="form.priority"
          label="Prioritas"
          :options="PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))"
        />
        <UiInput v-model="form.dueDate" label="Tenggat" type="date" :error="errors.dueDate" />
        <label class="flex items-center gap-2 self-end pb-2 text-sm">
          <input v-model="form.focusToday" type="checkbox" class="size-4 accent-brand-700" />
          Fokus hari ini
        </label>
      </div>
      <div class="flex items-center justify-between gap-2 pt-2">
        <UiButton v-if="task" variant="ghost" :loading="deleting" @click="onDelete">Hapus</UiButton>
        <span v-else />
        <div class="flex gap-2">
          <UiButton variant="secondary" @click="open = false">Batal</UiButton>
          <UiButton type="submit" :loading="submitting">Simpan</UiButton>
        </div>
      </div>
    </form>
  </UiDialog>
</template>
