<script setup lang="ts">
import { Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import { onBeforeUnmount, ref, watch } from 'vue';
import type { RichNode } from '@muhasabah/shared';
import { useSurahs } from '@/features/quran';
import { AyahRef } from '../ayah-ref';
import AyahPickerDialog from './AyahPickerDialog.vue';

type Doc = { type: 'doc'; content: RichNode[] };
const model = defineModel<Doc>({ required: true });
const emit = defineEmits<{ save: [] }>();

const editor = useEditor({
  content: model.value,
  extensions: [
    StarterKit.configure({ heading: { levels: [2, 3] }, link: false, underline: false }),
    Placeholder.configure({ placeholder: 'Tulis poin-poin kajian di sini…' }),
    AyahRef,
  ],
  editorProps: {
    attributes: {
      class: 'prose-editor min-h-72 px-4 py-3 focus:outline-none',
      'aria-label': 'Isi catatan kajian',
      role: 'textbox',
      'aria-multiline': 'true',
    },
    handleKeyDown: (_view, event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        emit('save');
        return true;
      }
      return false;
    },
  },
  onUpdate: ({ editor: e }) => {
    model.value = e.getJSON() as Doc;
  },
});

// Konten dari luar (mis. selesai dimuat) menggantikan isi editor.
watch(model, (doc) => {
  const e = editor.value;
  if (e && JSON.stringify(e.getJSON()) !== JSON.stringify(doc))
    e.commands.setContent(doc, { emitUpdate: false });
});

onBeforeUnmount(() => editor.value?.destroy());

const { surahs, notSeeded } = useSurahs();
const picker = ref(false);

type Action = { label: string; icon: string; run: () => void; active?: () => boolean };
const actions: Action[] = [
  {
    label: 'Tebal',
    icon: 'B',
    run: () => editor.value?.chain().focus().toggleBold().run(),
    active: () => !!editor.value?.isActive('bold'),
  },
  {
    label: 'Miring',
    icon: 'I',
    run: () => editor.value?.chain().focus().toggleItalic().run(),
    active: () => !!editor.value?.isActive('italic'),
  },
  {
    label: 'Judul bagian',
    icon: 'H2',
    run: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
    active: () => !!editor.value?.isActive('heading', { level: 2 }),
  },
  {
    label: 'Sub-judul',
    icon: 'H3',
    run: () => editor.value?.chain().focus().toggleHeading({ level: 3 }).run(),
    active: () => !!editor.value?.isActive('heading', { level: 3 }),
  },
  {
    label: 'Daftar poin',
    icon: '•',
    run: () => editor.value?.chain().focus().toggleBulletList().run(),
    active: () => !!editor.value?.isActive('bulletList'),
  },
  {
    label: 'Daftar bernomor',
    icon: '1.',
    run: () => editor.value?.chain().focus().toggleOrderedList().run(),
    active: () => !!editor.value?.isActive('orderedList'),
  },
  {
    label: 'Kutipan',
    icon: '❝',
    run: () => editor.value?.chain().focus().toggleBlockquote().run(),
    active: () => !!editor.value?.isActive('blockquote'),
  },
  { label: 'Urungkan', icon: '↶', run: () => editor.value?.chain().focus().undo().run() },
  { label: 'Ulangi', icon: '↷', run: () => editor.value?.chain().focus().redo().run() },
];

function insertAyah(attrs: { surahId: number; from: number; to: number; label: string }) {
  editor.value?.chain().focus().insertAyahRef(attrs).run();
}
</script>

<template>
  <div class="rounded-xl border border-stone-300 bg-white dark:border-stone-700 dark:bg-stone-900">
    <div
      role="toolbar"
      aria-label="Format teks"
      class="flex flex-wrap items-center gap-1 border-b border-stone-200 p-1.5 dark:border-stone-700"
    >
      <button
        v-for="a in actions"
        :key="a.label"
        type="button"
        :title="a.label"
        :aria-pressed="a.active ? a.active() : undefined"
        :class="[
          'min-w-8 rounded-md px-2 py-1 text-sm font-semibold',
          a.active?.()
            ? 'bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100'
            : 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
        ]"
        @click="a.run"
      >
        <span aria-hidden="true">{{ a.icon }}</span>
        <span class="sr-only">{{ a.label }}</span>
      </button>
      <span class="mx-1 h-5 w-px bg-stone-200 dark:bg-stone-700" aria-hidden="true" />
      <button
        type="button"
        class="rounded-md px-2 py-1 text-sm font-medium text-brand-800 hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-brand-900/40"
        @click="picker = true"
      >
        + Rujukan ayat
      </button>
    </div>
    <EditorContent :editor="editor" />
    <AyahPickerDialog
      v-model:open="picker"
      :surahs="surahs"
      :not-seeded="notSeeded"
      @pick="insertAyah"
    />
  </div>
</template>

<style>
.prose-editor h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem;
}
.prose-editor h3 {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0.75rem 0 0.25rem;
}
.prose-editor p {
  margin: 0.4rem 0;
  line-height: 1.7;
}
.prose-editor ul {
  list-style: disc;
  padding-left: 1.5rem;
}
.prose-editor ol {
  list-style: decimal;
  padding-left: 1.5rem;
}
.prose-editor blockquote {
  border-left: 3px solid currentColor;
  opacity: 0.85;
  padding-left: 0.75rem;
  margin: 0.5rem 0;
}
.prose-editor p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
  color: var(--color-stone-500);
}
</style>
