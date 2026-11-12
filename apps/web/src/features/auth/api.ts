import type { AuthResponse, LoginInput, RegisterInput } from '@muhasabah/shared';
import { http } from '@/api/http';

export const authApi = {
  register: (input: RegisterInput) =>
    http.post<AuthResponse>('/auth/register', input, { auth: false }),
  login: (input: LoginInput) => http.post<AuthResponse>('/auth/login', input, { auth: false }),
  logout: () => http.post<void>('/auth/logout', undefined, { auth: false }),
  refresh: () => http.refresh(),
};
