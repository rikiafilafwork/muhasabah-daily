import { createZodDto } from 'nestjs-zod';
import { dateParamSchema, journalListQuerySchema, saveJournalSchema } from '@muhasabah/shared';

export class JournalDateParamDto extends createZodDto(dateParamSchema) {}
export class SaveJournalDto extends createZodDto(saveJournalSchema) {}
export class JournalListQueryDto extends createZodDto(journalListQuerySchema) {}
