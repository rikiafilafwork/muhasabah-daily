import type {
  ObligatoryPrayer,
  Profile,
  PushConfig,
  PushSubscriptionInput,
  PushTestResult,
} from '@muhasabah/shared';
import { http } from '@/api/http';

export const pushApi = {
  config: () => http.get<PushConfig>('/push/config'),
  subscribe: (input: PushSubscriptionInput) => http.post<void>('/push/subscriptions', input),
  unsubscribe: (endpoint: string) => http.post<void>('/push/subscriptions/remove', { endpoint }),
  test: () => http.post<PushTestResult>('/push/test'),
};

export const reminderPrefsApi = {
  setPrayers: (prayerReminders: ObligatoryPrayer[]) =>
    http.patch<Profile>('/me', { prayerReminders }),
};
