import type { AuthResponse } from '@muhasabah/shared';
import { createApiClient } from './client';

/**
 * Pengikat antara klien HTTP dan state sesi. Diisi oleh store sesi saat aplikasi mulai,
 * agar klien tidak bergantung langsung pada Pinia.
 */
export const sessionBridge = {
  getAccessToken: (): string | null => null,
  onRefreshed: (_auth: AuthResponse): void => {},
  onSessionExpired: (): void => {},
};

export const http = createApiClient({
  getAccessToken: () => sessionBridge.getAccessToken(),
  onRefreshed: (auth) => sessionBridge.onRefreshed(auth),
  onSessionExpired: () => sessionBridge.onSessionExpired(),
});

export { ApiError } from './client';
