import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { idSchema } from '@muhasabah/shared';

export class IdParamDto extends createZodDto(z.object({ id: idSchema }).strict()) {}
