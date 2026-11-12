import { createZodDto } from 'nestjs-zod';
import { createGoalSchema, setGoalHabitsSchema, updateGoalSchema } from '@muhasabah/shared';

export class CreateGoalDto extends createZodDto(createGoalSchema) {}
export class UpdateGoalDto extends createZodDto(updateGoalSchema) {}
export class SetGoalHabitsDto extends createZodDto(setGoalHabitsSchema) {}
