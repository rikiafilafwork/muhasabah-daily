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
  let refreshing: Promise<boolean> | null = null;

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
    return doFetch(buildUrl(path, opts.query), {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      credentials: 'include',
      signal: opts.signal,
    });
  }

  async function doRefresh(): Promise<boolean> {
    try {
      const res = await send('POST', '/auth/refresh', { auth: false });
      if (!res.ok) return false;
      options.onRefreshed((await res.json()) as AuthResponse);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Memperbarui access token memakai cookie refresh. Panggilan bersamaan di satu tab
   * berbagi satu promise; antar-tab diserialkan dengan Web Locks. Tanpa kunci ini,
   * dua tab yang me-refresh bersamaan mengirim token yang sama dan server
   * menganggapnya pemakaian ulang, lalu mencabut sesi.
   */
  function refresh(): Promise<boolean> {
    if (!refreshing) {
      const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
      const run = async (): Promise<boolean> =>
        locks ? await locks.request(REFRESH_LOCK, doRefresh) : doRefresh();
      refreshing = run().finally(() => {
        refreshing = null;
      });
    }
    return refreshing;
  }

  async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
    let res = await send(method, path, opts);

    if (res.status === 401 && opts.auth !== false) {
      if (await refresh()) {
        res = await send(method, path, opts);
      } else {
        options.onSessionExpired();
      }
    }

    if (!res.ok) throw await parseError(res);
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  return {
    request,
    refresh,
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
