import { createZodDto } from 'nestjs-zod';
import {
  dhikrLogBodySchema,
  dhikrLogParamsSchema,
  dhikrQuerySchema,
  dhikrSummaryQuerySchema,
} from '@muhasabah/shared';

export class DhikrQueryDto extends createZodDto(dhikrQuerySchema) {}
export class DhikrSummaryQueryDto extends createZodDto(dhikrSummaryQuerySchema) {}
export class DhikrLogParamsDto extends createZodDto(dhikrLogParamsSchema) {}
export class DhikrLogBodyDto extends createZodDto(dhikrLogBodySchema) {}
