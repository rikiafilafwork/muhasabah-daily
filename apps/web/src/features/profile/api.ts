import type { Profile, UpdateProfileInput } from '@muhasabah/shared';
import { http } from '@/api/http';

export const profileApi = {
  get: () => http.get<Profile>('/me'),
  update: (input: UpdateProfileInput) => http.patch<Profile>('/me', input),
  remove: () => http.delete<void>('/me'),
};
