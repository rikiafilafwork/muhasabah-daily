import { mergeAttributes, Node, VueNodeViewRenderer } from '@tiptap/vue-3';
import { AYAH_REF_NODE } from '@muhasabah/shared';
import AyahRefView from './components/AyahRefView.vue';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ayahRef: {
      insertAyahRef: (attrs: {
        surahId: number;
        from: number;
        to: number;
        label: string;
      }) => ReturnType;
    };
  }
}

/** Node blok untuk rujukan ayat. Disimpan sebagai atribut, teks ayat diambil saat ditampilkan. */
export const AyahRef = Node.create({
  name: AYAH_REF_NODE,
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      surahId: { default: 1 },
      from: { default: 1 },
      to: { default: 1 },
      label: { default: '' },
    };
  },
  parseHTML() {
    return [{ tag: 'figure[data-ayah-ref]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes(HTMLAttributes, { 'data-ayah-ref': '' })];
  },
  addNodeView() {
    return VueNodeViewRenderer(AyahRefView);
  },
  addCommands() {
    return {
      insertAyahRef:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent([{ type: this.name, attrs }, { type: 'paragraph' }]),
    };
  },
});
