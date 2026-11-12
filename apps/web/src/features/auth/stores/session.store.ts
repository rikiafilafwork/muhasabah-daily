import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { AuthResponse, LoginInput, Profile, RegisterInput } from '@muhasabah/shared';
import { sessionBridge } from '@/api/http';
import { useTheme } from '@/shared';
import { authApi } from '../api';

type Status = 'unknown' | 'authenticated' | 'anonymous';

/**
 * Sesi pengguna. Access token hanya disimpan di memori; refresh token ada di
 * cookie httpOnly sehingga sesi dipulihkan lewat `/auth/refresh` saat halaman dimuat.
 */
export const useSessionStore = defineStore('session', () => {
  const accessToken = ref<string | null>(null);
  const user = ref<Profile | null>(null);
  const status = ref<Status>('unknown');
  const { setTheme } = useTheme();
  let bootstrapping: Promise<void> | null = null;

  const isAuthenticated = computed(() => status.value === 'authenticated');

  function setSession(auth: AuthResponse) {
    accessToken.value = auth.accessToken;
    setUser(auth.user);
    status.value = 'authenticated';
  }

  function setUser(profile: Profile) {
    user.value = profile;
    setTheme(profile.theme);
  }

  function clear() {
    accessToken.value = null;
    user.value = null;
    status.value = 'anonymous';
  }

  sessionBridge.getAccessToken = () => accessToken.value;
  sessionBridge.onRefreshed = setSession;
  sessionBridge.onSessionExpired = clear;

  /** Memulihkan sesi dari cookie refresh. Aman dipanggil berkali-kali. */
  function bootstrap(): Promise<void> {
    bootstrapping ??= (async () => {
      const ok = await authApi.refresh();
      if (!ok) clear();
    })();
    return bootstrapping;
  }

  async function login(input: LoginInput) {
    setSession(await authApi.login(input));
  }

  async function register(input: RegisterInput) {
    setSession(await authApi.register(input));
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      clear();
    }
  }

  return {
    accessToken,
    user,
    status,
    isAuthenticated,
    bootstrap,
    login,
    register,
    logout,
    setUser,
    clear,
  };
});
