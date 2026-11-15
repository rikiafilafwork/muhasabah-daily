import { describe, expect, it, vi } from 'vitest';
import { ApiError, createApiClient } from './client';

function json(status: number, body: unknown) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function setup(responder: (url: string, init: RequestInit) => Response | Promise<Response>) {
  let token: string | null = 'lama';
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
    responder(String(input), init ?? {}),
  );
  const onRefreshed = vi.fn((auth: { accessToken: string }) => {
    token = auth.accessToken;
  });
  const onSessionExpired = vi.fn();
  const client = createApiClient({
    getAccessToken: () => token,
    onRefreshed: onRefreshed as never,
    onSessionExpired,
    fetch: fetchMock as unknown as typeof fetch,
  });
  return { client, fetchMock, onRefreshed, onSessionExpired };
}

const authHeader = (init: RequestInit) => (init.headers as Record<string, string>).authorization;

describe('createApiClient', () => {
  it('mengirim Bearer token dan credentials include', async () => {
    const { client, fetchMock } = setup(() => json(200, { ok: true }));
    await expect(client.get('/me', { query: { a: 1, b: undefined } })).resolves.toEqual({
      ok: true,
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/v1/me?a=1');
    expect(authHeader(init!)).toBe('Bearer lama');
    expect(init!.credentials).toBe('include');
  });

  it('refresh sekali pada 401 lalu mengulang request dengan token baru', async () => {
    const { client, fetchMock, onRefreshed } = setup((url, init) => {
      if (url.endsWith('/auth/refresh')) return json(200, { accessToken: 'baru', user: {} });
      return authHeader(init) === 'Bearer baru'
        ? json(200, { id: 1 })
        : json(401, { code: 'UNAUTHORIZED' });
    });
    await expect(client.get('/me')).resolves.toEqual({ id: 1 });
    expect(onRefreshed).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('permintaan paralel berbagi satu refresh', async () => {
    const { client, fetchMock } = setup(async (url, init) => {
      if (url.endsWith('/auth/refresh')) {
        await new Promise((r) => setTimeout(r, 10));
        return json(200, { accessToken: 'baru', user: {} });
      }
      return authHeader(init) === 'Bearer baru' ? json(200, {}) : json(401, {});
    });
    await Promise.all([client.get('/a'), client.get('/b'), client.get('/c')]);
    const refreshCalls = fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/auth/refresh'));
    expect(refreshCalls).toHaveLength(1);
  });

  it('tidak mengulang lebih dari sekali dan memberi tahu sesi berakhir', async () => {
    const { client, fetchMock, onSessionExpired } = setup(() =>
      json(401, { statusCode: 401, code: 'UNAUTHORIZED', message: 'x' }),
    );
    await expect(client.get('/me')).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
    expect(onSessionExpired).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2); // request + refresh, tanpa ulangan
  });

  it('memetakan body error ke ApiError', async () => {
    const { client } = setup(() =>
      json(409, { statusCode: 409, code: 'EMAIL_TAKEN', message: 'Email sudah terdaftar' }),
    );
    const err = await client.post('/auth/register', {}, { auth: false }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({
      status: 409,
      code: 'EMAIL_TAKEN',
      message: 'Email sudah terdaftar',
    });
  });

  it('menserialkan refresh antar-tab dengan Web Locks bila tersedia', async () => {
    const request = vi.fn((_name: string, cb: () => Promise<boolean>) => cb());
    vi.stubGlobal('navigator', { locks: { request } });
    try {
      const { client } = setup((url) =>
        url.endsWith('/auth/refresh')
          ? json(200, { accessToken: 'baru', user: {} })
          : json(200, {}),
      );
      await expect(client.refresh()).resolves.toBe(true);
      expect(request).toHaveBeenCalledWith('muhasabah:refresh-token', expect.any(Function));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('galat jaringan menjadi OFFLINE dan tidak mengakhiri sesi', async () => {
    const { client, onSessionExpired } = setup(() => {
      throw new TypeError('Failed to fetch');
    });
    await expect(client.get('/me')).rejects.toMatchObject({ code: 'OFFLINE', status: 0 });
    await expect(client.refreshSession()).resolves.toBe('offline');
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it('refresh gagal karena server mati (5xx) tidak mengakhiri sesi', async () => {
    const { client, onSessionExpired } = setup((url) =>
      url.endsWith('/auth/refresh') ? json(502, {}) : json(401, {}),
    );
    await expect(client.get('/me')).rejects.toMatchObject({ code: 'OFFLINE' });
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it('menolak perubahan saat browser offline tanpa memanggil jaringan', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    try {
      const { client, fetchMock } = setup(() => json(200, {}));
      await expect(client.post('/tasks', {})).rejects.toMatchObject({ code: 'OFFLINE' });
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('204 mengembalikan undefined', async () => {
    const { client } = setup(() => json(204, null));
    await expect(client.delete('/me')).resolves.toBeUndefined();
  });
});
