import { createZodDto } from 'nestjs-zod';
import { prayerTimesQuerySchema } from '@muhasabah/shared';

export class PrayerTimesQueryDto extends createZodDto(prayerTimesQuerySchema) {}
