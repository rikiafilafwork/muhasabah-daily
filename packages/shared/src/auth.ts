import { z } from 'zod';
import type { Profile } from './user';
import { timezoneSchema } from './user';

export const PASSWORD_MIN_LENGTH = 8;

export const emailSchema = z
  .email({ message: 'Email tidak valid' })
  .max(254)
  .transform((v) => v.trim().toLowerCase());

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Nama wajib diisi').max(100),
    email: emailSchema,
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter`)
      .max(128),
    timezone: timezoneSchema.optional(),
  })
  .strict();
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Kata sandi wajib diisi').max(128),
  })
  .strict();
export type LoginInput = z.infer<typeof loginSchema>;

export interface AuthResponse {
  accessToken: string;
  /** Detik sampai access token kedaluwarsa. */
  expiresIn: number;
  user: Profile;
}
