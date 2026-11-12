import { z } from 'zod';
import { colorSchema, isoDateTimeSchema, optionalText, type Color } from './common';

const eventFields = {
  title: z.string().trim().min(1, 'Judul wajib diisi').max(200),
  description: optionalText(2000),
  location: optionalText(200),
  startAt: isoDateTimeSchema,
  endAt: isoDateTimeSchema,
  allDay: z.boolean(),
  color: colorSchema,
};

const endAfterStart = (v: { startAt?: string; endAt?: string }) =>
  !v.startAt || !v.endAt || Date.parse(v.endAt) >= Date.parse(v.startAt);
const endAfterStartMsg = { message: 'Waktu selesai harus setelah waktu mulai', path: ['endAt'] };

export const createEventSchema = z
  .object({
    ...eventFields,
    allDay: eventFields.allDay.default(false),
    color: eventFields.color.default('emerald'),
  })
  .strict()
  .refine(endAfterStart, endAfterStartMsg);
export type CreateEventInput = z.input<typeof createEventSchema>;

export const updateEventSchema = z
  .object(eventFields)
  .partial()
  .strict()
  .refine(endAfterStart, endAfterStartMsg);
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

/** Rentang maksimal kueri event (cukup untuk tampilan bulan beserta pinggirannya). */
export const EVENTS_MAX_RANGE_DAYS = 100;

export const eventsQuerySchema = z
  .object({ from: isoDateTimeSchema, to: isoDateTimeSchema })
  .strict()
  .refine((v) => Date.parse(v.to) > Date.parse(v.from), {
    message: '`to` harus setelah `from`',
    path: ['to'],
  })
  .refine((v) => Date.parse(v.to) - Date.parse(v.from) <= EVENTS_MAX_RANGE_DAYS * 86_400_000, {
    message: `Rentang maksimal ${EVENTS_MAX_RANGE_DAYS} hari`,
    path: ['to'],
  });
export type EventsQuery = z.infer<typeof eventsQuerySchema>;

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  color: Color;
  createdAt: string;
  updatedAt: string;
}
