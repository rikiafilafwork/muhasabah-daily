import { profileSchema, type Profile } from '@muhasabah/shared';

/**
 * Salinan profil terakhir di perangkat ini, agar aplikasi bisa dibuka tanpa koneksi.
 * Dihapus saat keluar atau sesi berakhir, bersama cache data API di service worker.
 */
const KEY = 'muhasabah:offline-profile';
export const API_CACHE = 'api-data';

export function saveSnapshot(profile: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* penyimpanan penuh atau diblokir: mode offline tidak tersedia */
  }
}

export function loadSnapshot(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = profileSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Menghapus salinan profil dan data API tersimpan (privasi di perangkat bersama). */
export async function clearOfflineData() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* abaikan */
  }
  try {
    if (typeof caches !== 'undefined') await caches.delete(API_CACHE);
  } catch {
    /* abaikan */
  }
}
