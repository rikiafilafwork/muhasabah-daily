import { pushApi } from './api';

/** Alasan notifikasi tidak bisa dipakai di perangkat ini, atau `null` bila bisa. */
export function pushUnsupportedReason(): string | null {
  if (typeof window === 'undefined') return 'Tidak tersedia.';
  if (!window.isSecureContext) {
    return 'Notifikasi butuh HTTPS atau localhost. Buka aplikasi lewat alamat HTTPS (lihat panduan self-hosting).';
  }
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    return 'Browser ini tidak mendukung notifikasi web.';
  }
  if (!('PushManager' in window)) {
    return 'Browser ini belum mendukung Web Push. Di iPhone/iPad, pasang aplikasi ke Layar Utama lalu buka dari sana.';
  }
  return null;
}

/** Registrasi service worker aktif, atau `null` (mis. mode pengembangan tanpa service worker). */
export async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return null;
  return reg.active ? reg : navigator.serviceWorker.ready;
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  const reg = await getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

const sameKey = (sub: PushSubscription, publicKey: string) => {
  const key = sub.options.applicationServerKey;
  if (!key) return false;
  const a = new Uint8Array(key);
  const b = base64UrlToBytes(publicKey);
  return a.length === b.length && a.every((v, i) => v === b[i]);
};

/** Meminta izin, berlangganan di browser, lalu mendaftarkan langganan ke server. */
export async function enablePush(publicKey: string): Promise<void> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Izin notifikasi ditolak. Izinkan lewat pengaturan situs di browser, lalu coba lagi.'
        : 'Izin notifikasi belum diberikan.',
    );
  }
  const reg = await getRegistration();
  if (!reg) throw new Error('Service worker belum aktif. Muat ulang halaman lalu coba lagi.');
  let sub = await reg.pushManager.getSubscription();
  // Kunci server berganti (mis. volume secret dibuat ulang): langganan lama tidak berlaku.
  if (sub && !sameKey(sub, publicKey)) {
    await sub.unsubscribe();
    sub = null;
  }
  sub ??= await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64UrlToBytes(publicKey),
  });
  const json = sub.toJSON();
  await pushApi.subscribe({
    endpoint: sub.endpoint,
    keys: { p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' },
  });
}

/** Berhenti menerima notifikasi di perangkat ini. */
export async function disablePush(): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) return;
  await pushApi.unsubscribe(sub.endpoint).catch(() => undefined);
  await sub.unsubscribe();
}
