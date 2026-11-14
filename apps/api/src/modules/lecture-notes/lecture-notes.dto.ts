import { createZodDto } from 'nestjs-zod';
import {
  createLectureNoteSchema,
  lectureNotesQuerySchema,
  updateLectureNoteSchema,
} from '@muhasabah/shared';

export class CreateLectureNoteDto extends createZodDto(createLectureNoteSchema) {}
export class UpdateLectureNoteDto extends createZodDto(updateLectureNoteSchema) {}
export class LectureNotesQueryDto extends createZodDto(lectureNotesQuerySchema) {}
