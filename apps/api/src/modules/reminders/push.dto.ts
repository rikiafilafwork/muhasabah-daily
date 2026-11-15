import { createZodDto } from 'nestjs-zod';
import { pushSubscriptionSchema, pushUnsubscribeSchema } from '@muhasabah/shared';

export class PushSubscriptionDto extends createZodDto(pushSubscriptionSchema) {}
export class PushUnsubscribeDto extends createZodDto(pushUnsubscribeSchema) {}
