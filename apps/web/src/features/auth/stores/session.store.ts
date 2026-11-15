import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { AuthResponse, LoginInput, Profile, RegisterInput } from '@muhasabah/shared';
import { sessionBridge } from '@/api/http';
import { useTheme } from '@/shared';
import { authApi } from '../api';
import { clearOfflineData, loadSnapshot, saveSnapshot } from './offline-snapshot';

type Status = 'unknown' | 'authenticated' | 'anonymous';

type LogoutHook = () => Promise<void> | void;

/**
 * Sesi pengguna. Access token hanya disimpan di memori; refresh token ada di
 * cookie httpOnly sehingga sesi dipulihkan lewat `/auth/refresh` saat halaman dimuat.
 *
 * Mode offline: bila server tidak terjangkau saat aplikasi dibuka, sesi dipulihkan dari
 * salinan profil terakhir (`offline = true`, tanpa access token) dan data dibaca dari cache
 * service worker. Saat tersambung lagi, sesi diperbarui; bila refresh ditolak, pengguna keluar.
 */
export const useSessionStore = defineStore('session', () => {
  const accessToken = ref<string | null>(null);
  const user = ref<Profile | null>(null);
  const status = ref<Status>('unknown');
  /** `true` saat sesi dipulihkan dari salinan lokal dan belum terverifikasi server. */
  const offline = ref(false);
  const logoutHooks: LogoutHook[] = [];
  const { setTheme } = useTheme();
  let bootstrapping: Promise<void> | null = null;

  const isAuthenticated = computed(() => status.value === 'authenticated');

  function setSession(auth: AuthResponse) {
    accessToken.value = auth.accessToken;
    setUser(auth.user);
    offline.value = false;
    status.value = 'authenticated';
  }

  function setUser(profile: Profile) {
    user.value = profile;
    setTheme(profile.theme);
    saveSnapshot(profile);
  }

  function clear() {
    accessToken.value = null;
    user.value = null;
    offline.value = false;
    status.value = 'anonymous';
    void clearOfflineData();
  }

  /** Dipanggil sebelum keluar (mis. mencabut langganan notifikasi perangkat ini). */
  function onLogout(hook: LogoutHook) {
    logoutHooks.push(hook);
  }

  /** Memverifikasi ulang sesi offline saat koneksi kembali. */
  async function reconnect() {
    if (status.value !== 'authenticated' || !offline.value) return;
    const result = await authApi.refresh();
    if (result === 'invalid') clear();
  }

  if (typeof window !== 'undefined') window.addEventListener('online', () => void reconnect());

  sessionBridge.getAccessToken = () => accessToken.value;
  sessionBridge.onRefreshed = setSession;
  sessionBridge.onSessionExpired = clear;

  /** Memulihkan sesi dari cookie refresh. Aman dipanggil berkali-kali. */
  function bootstrap(): Promise<void> {
    bootstrapping ??= (async () => {
      const result = await authApi.refresh();
      if (result === 'ok') return;
      const snapshot = result === 'offline' ? loadSnapshot() : null;
      if (snapshot) {
        user.value = snapshot;
        setTheme(snapshot.theme);
        offline.value = true;
        status.value = 'authenticated';
      } else {
        clear();
      }
    })();
    return bootstrapping;
  }

  // Sesi baru: buang data tersimpan dari akun sebelumnya di perangkat ini.
  async function login(input: LoginInput) {
    const auth = await authApi.login(input);
    await clearOfflineData();
    setSession(auth);
  }

  async function register(input: RegisterInput) {
    const auth = await authApi.register(input);
    await clearOfflineData();
    setSession(auth);
  }

  async function logout() {
    try {
      for (const hook of logoutHooks) {
        try {
          await hook();
        } catch {
          /* kegagalan pembersihan tidak boleh menghalangi keluar */
        }
      }
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
    offline,
    bootstrap,
    reconnect,
    onLogout,
    login,
    register,
    logout,
    setUser,
    clear,
  };
});
