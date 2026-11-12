import { createZodDto } from 'nestjs-zod';
import {
  createHabitSchema,
  habitInsightsQuerySchema,
  habitLogBodySchema,
  habitLogParamsSchema,
  habitsQuerySchema,
  updateHabitSchema,
} from '@muhasabah/shared';

export class CreateHabitDto extends createZodDto(createHabitSchema) {}
export class UpdateHabitDto extends createZodDto(updateHabitSchema) {}
export class HabitsQueryDto extends createZodDto(habitsQuerySchema) {}
export class HabitInsightsQueryDto extends createZodDto(habitInsightsQuerySchema) {}
export class HabitLogBodyDto extends createZodDto(habitLogBodySchema) {}
export class HabitLogParamsDto extends createZodDto(habitLogParamsSchema) {}
