import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  createProjectSchema,
  createTaskSchema,
  tasksQuerySchema,
  updateProjectSchema,
  updateTaskSchema,
} from '@muhasabah/shared';

export class CreateProjectDto extends createZodDto(createProjectSchema) {}
export class UpdateProjectDto extends createZodDto(updateProjectSchema) {}
export class ProjectsQueryDto extends createZodDto(
  z.object({ includeArchived: z.stringbool().optional() }).strict(),
) {}
export class CreateTaskDto extends createZodDto(createTaskSchema) {}
export class UpdateTaskDto extends createZodDto(updateTaskSchema) {}
export class TasksQueryDto extends createZodDto(tasksQuerySchema) {}
