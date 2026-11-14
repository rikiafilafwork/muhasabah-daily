import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  createMemorizationPlanSchema,
  setStagesSchema,
  updateMemorizationPlanSchema,
} from '@muhasabah/shared';

export class CreatePlanDto extends createZodDto(createMemorizationPlanSchema) {}
export class UpdatePlanDto extends createZodDto(updateMemorizationPlanSchema) {}
export class SetStagesDto extends createZodDto(setStagesSchema) {}
export class PlansQueryDto extends createZodDto(
  z.object({ includeArchived: z.stringbool().optional() }).strict(),
) {}
