import type { User } from '@prisma/client';
import type { Profile } from '@muhasabah/shared';

/** Memetakan baris User ke Profile publik. Tidak pernah menyertakan passwordHash. */
export function toProfile(user: User): Profile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    city: user.city,
    latitude: user.latitude,
    longitude: user.longitude,
    timezone: user.timezone,
    theme: user.theme,
    createdAt: user.createdAt.toISOString(),
  };
}
