import { z } from 'zod';

export const THEMES = ['light', 'dark', 'system'] as const;
export const themeSchema = z.enum(THEMES);
export type Theme = z.infer<typeof themeSchema>;

/** Memeriksa nama zona waktu IANA memakai Intl. */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const timezoneSchema = z
  .string()
  .min(1)
  .max(64)
  .refine(isValidTimeZone, { message: 'Zona waktu tidak dikenal' });

export const latitudeSchema = z.number().min(-90).max(90);
export const longitudeSchema = z.number().min(-180).max(180);

export const profileSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
  city: z.string().nullable(),
  latitude: latitudeSchema.nullable(),
  longitude: longitudeSchema.nullable(),
  timezone: z.string(),
  theme: themeSchema,
  createdAt: z.string(),
});
export type Profile = z.infer<typeof profileSchema>;

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    city: z.string().trim().max(100).nullable(),
    latitude: latitudeSchema.nullable(),
    longitude: longitudeSchema.nullable(),
    timezone: timezoneSchema,
    theme: themeSchema,
  })
  .partial()
  .strict()
  .refine((v) => (v.latitude === undefined) === (v.longitude === undefined), {
    message: 'latitude dan longitude harus dikirim bersamaan',
    path: ['latitude'],
  })
  .refine((v) => (v.latitude === null) === (v.longitude === null), {
    message: 'latitude dan longitude harus sama-sama terisi atau sama-sama kosong',
    path: ['latitude'],
  });
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
