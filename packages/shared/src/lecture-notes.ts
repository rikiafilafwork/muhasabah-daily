import { z } from 'zod';
import { idSchema, optionalText } from './common';
import { isoDateSchema } from './prayer-times';
import type { AyahRef } from './quran';

/** Ukuran maksimum dokumen editor (JSON) yang diterima. */
export const LECTURE_NOTE_MAX_BYTES = 200_000;

/** Bentuk minimal dokumen TipTap/ProseMirror: `{ type: 'doc', content: [...] }`. */
export interface RichNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

const richNodeSchema: z.ZodType<RichNode> = z.lazy(() =>
  z
    .object({
      type: z.string().min(1).max(40),
      attrs: z.record(z.string(), z.unknown()).optional(),
      content: z.array(richNodeSchema).max(5000).optional(),
      text: z.string().max(LECTURE_NOTE_MAX_BYTES).optional(),
      marks: z
        .array(
          z.object({
            type: z.string().max(40),
            attrs: z.record(z.string(), z.unknown()).optional(),
          }),
        )
        .max(20)
        .optional(),
    })
    .strict(),
);

export const richDocSchema = z
  .object({ type: z.literal('doc'), content: z.array(richNodeSchema).max(5000) })
  .strict()
  .refine((d) => JSON.stringify(d).length <= LECTURE_NOTE_MAX_BYTES, {
    message: 'Catatan terlalu panjang',
  });

const lectureFields = {
  title: z.string().trim().min(1, 'Judul wajib diisi').max(200),
  speaker: optionalText(120),
  source: optionalText(300),
  date: isoDateSchema,
  tags: z.array(z.string().trim().min(1).max(30)).max(10),
  content: richDocSchema,
};

export const createLectureNoteSchema = z
  .object({
    ...lectureFields,
    tags: lectureFields.tags.default([]),
    content: lectureFields.content.default({ type: 'doc', content: [] }),
  })
  .strict();
export type CreateLectureNoteInput = z.input<typeof createLectureNoteSchema>;

export const updateLectureNoteSchema = z.object(lectureFields).partial().strict();
export type UpdateLectureNoteInput = z.infer<typeof updateLectureNoteSchema>;

export const lectureNotesQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    cursor: idSchema.optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();
export type LectureNotesQuery = z.input<typeof lectureNotesQuerySchema>;

export interface LectureNoteSummary {
  id: string;
  title: string;
  speaker: string | null;
  date: string;
  tags: string[];
  preview: string;
  ayahRefs: AyahRef[];
  updatedAt: string;
}

export interface LectureNote extends LectureNoteSummary {
  source: string | null;
  content: { type: 'doc'; content: RichNode[] };
  createdAt: string;
}

/** Nama node TipTap untuk rujukan ayat. */
export const AYAH_REF_NODE = 'ayahRef';

/** Mengambil teks polos dan rujukan ayat dari dokumen. Fungsi murni. */
export function extractRichDoc(doc: { content: RichNode[] }): {
  text: string;
  ayahRefs: AyahRef[];
} {
  const parts: string[] = [];
  const refs: AyahRef[] = [];
  const seen = new Set<string>();
  const walk = (node: RichNode) => {
    if (node.text) parts.push(node.text);
    if (node.type === AYAH_REF_NODE && node.attrs) {
      const surahId = Number(node.attrs.surahId);
      const from = Number(node.attrs.from);
      const to = Number(node.attrs.to ?? from);
      const key = `${surahId}:${from}-${to}`;
      if (Number.isInteger(surahId) && Number.isInteger(from) && !seen.has(key)) {
        seen.add(key);
        refs.push({ surahId, from, to });
      }
    }
    node.content?.forEach(walk);
    if (['paragraph', 'heading', 'listItem', 'blockquote'].includes(node.type)) parts.push('\n');
  };
  doc.content.forEach(walk);
  return {
    text: parts
      .join('')
      .replace(/\n{2,}/g, '\n')
      .trim(),
    ayahRefs: refs,
  };
}
