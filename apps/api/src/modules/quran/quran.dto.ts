import { createZodDto } from 'nestjs-zod';
import { ayahsQuerySchema, surahParamsSchema } from '@muhasabah/shared';

export class SurahParamsDto extends createZodDto(surahParamsSchema) {}
export class AyahsQueryDto extends createZodDto(ayahsQuerySchema) {}
