import type { ApiErrorBody, AuthResponse } from '@muhasabah/shared';

/** Error dari API dengan `code` stabil (lihat packages/shared/src/errors.ts). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = body.statusCode;
    this.code = body.code;
    this.details = body.details;
  }
}

/** Kode error klien saat server tidak terjangkau (offline atau server mati). */
export const OFFLINE_CODE = 'OFFLINE';

export function isOfflineError(err: unknown): boolean {
  return err instanceof ApiError && err.code === OFFLINE_CODE;
}

function offlineError(write: boolean): ApiError {
  return new ApiError({
    statusCode: 0,
    code: OFFLINE_CODE,
    message: write
      ? 'Kamu sedang offline. Perubahan belum bisa disimpan; coba lagi saat tersambung.'
      : 'Tidak bisa terhubung ke server, dan data ini belum tersimpan untuk dibuka offline.',
  });
}

const isBrowserOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

/** Hasil memperbarui sesi: `offline` berarti server tidak terjangkau (sesi belum tentu berakhir). */
export type RefreshResult = 'ok' | 'invalid' | 'offline';

export interface ApiClientOptions {
  baseUrl?: string;
  /** Access token saat ini (disimpan di memori, bukan localStorage). */
  getAccessToken: () => string | null;
  /** Dipanggil setelah refresh berhasil. */
  onRefreshed: (auth: AuthResponse) => void;
  /** Dipanggil bila sesi tidak bisa diperbarui. */
  onSessionExpired: () => void;
  fetch?: typeof fetch;
}

export interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Tambahkan header Authorization. Default true. */
  auth?: boolean;
  signal?: AbortSignal;
}

export type ApiClient = ReturnType<typeof createApiClient>;

const REFRESH_LOCK = 'muhasabah:refresh-token';

/**
 * Klien HTTP bertipe. Saat respons 401, klien mencoba `POST /auth/refresh`
 * satu kali (permintaan bersamaan berbagi satu refresh) lalu mengulang request.
 */
export function createApiClient(options: ApiClientOptions) {
  const baseUrl = options.baseUrl ?? '/api/v1';
  const doFetch = options.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  let refreshing: Promise<RefreshResult> | null = null;

  function buildUrl(path: string, query?: RequestOptions['query']): string {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query ?? {})) {
      if (v !== undefined && v !== null) qs.set(k, String(v));
    }
    const s = qs.toString();
    return `${baseUrl}${path}${s ? `?${s}` : ''}`;
  }

  async function parseError(res: Response): Promise<ApiError> {
    try {
      const body = (await res.json()) as Partial<ApiErrorBody>;
      return new ApiError({
        statusCode: body.statusCode ?? res.status,
        code: body.code ?? 'HTTP_ERROR',
        message: body.message ?? res.statusText,
        details: body.details,
      });
    } catch {
      return new ApiError({ statusCode: res.status, code: 'HTTP_ERROR', message: res.statusText });
    }
  }

  async function send(method: string, path: string, opts: RequestOptions): Promise<Response> {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (opts.body !== undefined) headers['content-type'] = 'application/json';
    const token = opts.auth === false ? null : options.getAccessToken();
    if (token) headers.authorization = `Bearer ${token}`;
    const write = method !== 'GET';
    // Tulis saat offline langsung ditolak; baca tetap dicoba agar service worker
    // bisa menjawab dari cache.
    if (write && isBrowserOffline()) throw offlineError(true);
    try {
      return await doFetch(buildUrl(path, opts.query), {
        method,
        headers,
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        credentials: 'include',
        signal: opts.signal,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      throw offlineError(write);
    }
  }

  async function doRefresh(): Promise<RefreshResult> {
    let res: Response;
    try {
      res = await send('POST', '/auth/refresh', { auth: false });
    } catch {
      return 'offline';
    }
    // 5xx/502 (server sedang mulai ulang) bukan tanda sesi berakhir.
    if (res.status >= 500) return 'offline';
    if (!res.ok) return 'invalid';
    options.onRefreshed((await res.json()) as AuthResponse);
    return 'ok';
  }

  /**
   * Memperbarui access token memakai cookie refresh. Panggilan bersamaan di satu tab
   * berbagi satu promise; antar-tab diserialkan dengan Web Locks. Tanpa kunci ini,
   * dua tab yang me-refresh bersamaan mengirim token yang sama dan server
   * menganggapnya pemakaian ulang, lalu mencabut sesi.
   */
  function refreshSession(): Promise<RefreshResult> {
    if (!refreshing) {
      const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
      const run = async (): Promise<RefreshResult> =>
        locks ? await locks.request(REFRESH_LOCK, doRefresh) : doRefresh();
      refreshing = run().finally(() => {
        refreshing = null;
      });
    }
    return refreshing;
  }

  const refresh = async (): Promise<boolean> => (await refreshSession()) === 'ok';

  async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
    let res = await send(method, path, opts);

    if (res.status === 401 && opts.auth !== false) {
      const result = await refreshSession();
      if (result === 'ok') res = await send(method, path, opts);
      else if (result === 'offline') throw offlineError(method !== 'GET');
      else options.onSessionExpired();
    }

    if (!res.ok) throw await parseError(res);
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  return {
    request,
    refresh,
    refreshSession,
    get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
    post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
      request<T>('POST', path, { ...opts, body }),
    put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
      request<T>('PUT', path, { ...opts, body }),
    patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
      request<T>('PATCH', path, { ...opts, body }),
    delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
  };
}
