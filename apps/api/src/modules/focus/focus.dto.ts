import { createZodDto } from 'nestjs-zod';
import { createFocusSessionSchema, focusSessionsQuerySchema } from '@muhasabah/shared';

export class CreateFocusSessionDto extends createZodDto(createFocusSessionSchema) {}
export class FocusSessionsQueryDto extends createZodDto(focusSessionsQuerySchema) {}
