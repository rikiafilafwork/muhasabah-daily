<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { createLectureNoteSchema, type RichNode } from '@muhasabah/shared';
import { ApiError } from '@/api/http';
import { useUserClock } from '@/features/auth';
import { UiAlert, UiButton, UiInput, useZodForm } from '@/shared';
import { lectureNotesApi } from '../api';
import RichEditor from '../components/RichEditor.vue';

const route = useRoute();
const router = useRouter();
const { today } = useUserClock();
const id = computed(() => (route.params.id === 'new' ? null : String(route.params.id)));

const form = reactive({
  title: '',
  speaker: '',
  source: '',
  date: today.value,
  tags: '',
  content: { type: 'doc', content: [] } as { type: 'doc'; content: RichNode[] },
});
const loaded = ref(id.value === null);
const dirty = ref(false);
const savedAt = ref<string | null>(null);
const loadError = ref<string | null>(null);
const { errors, formError, submitting, submit } = useZodForm(createLectureNoteSchema);

onMounted(async () => {
  if (!id.value) return;
  try {
    const n = await lectureNotesApi.get(id.value);
    Object.assign(form, {
      title: n.title,
      speaker: n.speaker ?? '',
      source: n.source ?? '',
      date: n.date,
      tags: n.tags.join(', '),
      content: n.content,
    });
    loaded.value = true;
  } catch (err) {
    loadError.value = err instanceof ApiError ? err.message : 'Gagal memuat catatan';
  }
});

function markDirty() {
  dirty.value = true;
}

function save() {
  const values = {
    title: form.title,
    speaker: form.speaker.trim() || null,
    source: form.source.trim() || null,
    date: form.date,
    tags: form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    content: form.content,
  };
  return submit(values, async (data) => {
    const saved = id.value
      ? await lectureNotesApi.update(id.value, data)
      : await lectureNotesApi.create(data);
    dirty.value = false;
    savedAt.value = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (!id.value) await router.replace(`/lecture-notes/${saved.id}`);
  });
}

const deleting = ref(false);
async function remove() {
  if (!id.value) return;
  deleting.value = true;
  try {
    await lectureNotesApi.remove(id.value);
    dirty.value = false;
    await router.replace('/lecture-notes');
  } finally {
    deleting.value = false;
  }
}

// Peringatkan bila meninggalkan halaman dengan perubahan belum disimpan.
const beforeUnload = (e: BeforeUnloadEvent) => {
  if (dirty.value) e.preventDefault();
};
window.addEventListener('beforeunload', beforeUnload);
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload));
onBeforeRouteLeave(
  () => !dirty.value || window.confirm('Perubahan belum disimpan. Tinggalkan halaman?'),
);
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-5">
    <RouterLink
      to="/lecture-notes"
      class="text-sm text-brand-700 hover:underline dark:text-brand-500"
      >‹ Semua catatan</RouterLink
    >
    <UiAlert v-if="loadError" tone="error">{{ loadError }}</UiAlert>

    <form v-if="loaded" class="space-y-4" novalidate @submit.prevent="save" @input="markDirty">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-semibold">{{ id ? 'Ubah catatan' : 'Catatan baru' }}</h1>
        <div class="flex items-center gap-2">
          <span
            class="text-xs text-stone-500 dark:text-stone-400"
            role="status"
            data-testid="note-save-status"
          >
            {{ dirty ? 'Belum disimpan' : savedAt ? `Tersimpan ${savedAt}` : '' }}
          </span>
          <UiButton v-if="id" variant="ghost" :loading="deleting" @click="remove">Hapus</UiButton>
          <UiButton type="submit" :loading="submitting">Simpan</UiButton>
        </div>
      </header>
      <UiAlert v-if="formError" tone="error">{{ formError }}</UiAlert>
      <UiInput v-model="form.title" label="Judul" required :error="errors.title" />
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <UiInput v-model="form.speaker" label="Pemateri" :error="errors.speaker" />
        <UiInput v-model="form.date" label="Tanggal" type="date" :error="errors.date" />
        <UiInput v-model="form.tags" label="Tag" hint="Pisahkan dengan koma" :error="errors.tags" />
      </div>
      <UiInput v-model="form.source" label="Tempat atau tautan (opsional)" :error="errors.source" />
      <div>
        <span class="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">Isi</span>
        <RichEditor v-model="form.content" @update:model-value="markDirty" @save="save" />
        <p v-if="errors.content" class="mt-1 text-sm text-red-700 dark:text-red-400">
          {{ errors.content }}
        </p>
        <p class="mt-1 text-xs text-stone-500 dark:text-stone-400">Ctrl/⌘ + S untuk menyimpan.</p>
      </div>
    </form>
  </div>
</template>
