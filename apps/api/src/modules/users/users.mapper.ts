import type { User } from '../../generated/prisma/client';
import { OBLIGATORY_PRAYERS, type Profile } from '@muhasabah/shared';

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
    prayerReminders: OBLIGATORY_PRAYERS.filter((p) => user.prayerReminders.includes(p)),
    createdAt: user.createdAt.toISOString(),
  };
}
