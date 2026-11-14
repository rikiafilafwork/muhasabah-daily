import type { CookieOptions, Request, Response } from 'express';

export const REFRESH_COOKIE = 'rt';
/** Cookie hanya dikirim ke endpoint auth, tidak ke endpoint lain. */
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

/**
 * Flag `Secure` cookie. `auto` (bawaan) mengikuti protokol permintaan, termasuk lewat
 * reverse proxy (`X-Forwarded-Proto`), sehingga login tetap jalan saat aplikasi dibuka
 * lewat `http://IP-lokal` dan cookie aman saat lewat HTTPS. Fungsi murni.
 */
export function shouldUseSecureCookie(
  setting: string | undefined,
  requestIsSecure: boolean,
): boolean {
  if (setting === 'true') return true;
  if (setting === 'false') return false;
  return requestIsSecure;
}

function baseOptions(res: Response): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(process.env.COOKIE_SECURE, Boolean(res.req?.secure)),
    path: REFRESH_COOKIE_PATH,
  };
}

export function setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(REFRESH_COOKIE, token, { ...baseOptions(res), expires: expiresAt });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, baseOptions(res));
}

export function readRefreshCookie(req: Request): string | undefined {
  const value = (req.cookies as Record<string, unknown> | undefined)?.[REFRESH_COOKIE];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
