import { createZodDto } from 'nestjs-zod';
import { updateProfileSchema } from '@muhasabah/shared';

export class UpdateProfileDto extends createZodDto(updateProfileSchema) {}
