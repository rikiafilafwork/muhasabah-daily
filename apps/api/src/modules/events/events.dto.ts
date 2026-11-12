import { createZodDto } from 'nestjs-zod';
import { createEventSchema, eventsQuerySchema, updateEventSchema } from '@muhasabah/shared';

export class CreateEventDto extends createZodDto(createEventSchema) {}
export class UpdateEventDto extends createZodDto(updateEventSchema) {}
export class EventsQueryDto extends createZodDto(eventsQuerySchema) {}
