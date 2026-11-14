import { Injectable } from '@nestjs/common';
import type { PrayerKey } from '@muhasabah/shared';
import { AppConfig } from '../../config/app-config.service';

/** Metode perhitungan AlAdhan untuk Kementerian Agama RI. */
export const ALADHAN_METHOD_KEMENAG = 20;

export interface AladhanTimings {
  timings: Record<PrayerKey, string>;
  method: string;
}

interface AladhanResponse {
  code: number;
  status?: string;
  data?: {
    timings?: Record<string, string>;
    meta?: { method?: { name?: string } };
  };
}

const FIELD_MAP: Record<PrayerKey, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export class AladhanError extends Error {}

/** Memetakan respons AlAdhan (`iso8601=true`) ke jadwal ISO UTC. Fungsi murni. */
export function mapAladhanResponse(json: AladhanResponse): AladhanTimings {
  const raw = json.data?.timings;
  if (json.code !== 200 || !raw)
    throw new AladhanError(`Respons AlAdhan tidak valid (${json.code})`);
  const timings = {} as Record<PrayerKey, string>;
  for (const [key, field] of Object.entries(FIELD_MAP) as [PrayerKey, string][]) {
    const value = raw[field];
    const ms = value ? Date.parse(value) : NaN;
    if (Number.isNaN(ms)) throw new AladhanError(`Waktu ${field} tidak valid`);
    timings[key] = new Date(ms).toISOString();
  }
  return { timings, method: json.data?.meta?.method?.name ?? 'Kemenag RI' };
}

@Injectable()
export class AladhanClient {
  constructor(private readonly config: AppConfig) {}

  async getTimings(params: {
    date: string;
    latitude: number;
    longitude: number;
    timezone: string;
  }): Promise<AladhanTimings> {
    const [y, m, d] = params.date.split('-');
    const url = new URL(
      `${this.config.get('ALADHAN_BASE_URL').replace(/\/$/, '')}/timings/${d}-${m}-${y}`,
    );
    url.searchParams.set('latitude', String(params.latitude));
    url.searchParams.set('longitude', String(params.longitude));
    url.searchParams.set('method', String(ALADHAN_METHOD_KEMENAG));
    url.searchParams.set('timezonestring', params.timezone);
    url.searchParams.set('iso8601', 'true');

    const res = await fetchWithRetry(
      () =>
        this.fetchImpl(url, {
          signal: AbortSignal.timeout(this.config.get('ALADHAN_TIMEOUT_MS')),
          headers: { accept: 'application/json' },
        }),
      RETRY_DELAY_MS,
    );
    return mapAladhanResponse((await res.json()) as AladhanResponse);
  }

  /** Bisa diganti di test. */
  fetchImpl: typeof fetch = (...args) => fetch(...args);
}

const RETRY_DELAY_MS = 500;

/**
 * Satu kali coba ulang untuk galat jaringan dan 5xx (mis. DNS belum siap sesaat setelah
 * container start). 4xx tidak diulang. Fungsi murni terhadap `doFetch`.
 */
export async function fetchWithRetry(
  doFetch: () => Promise<Response>,
  delayMs: number,
): Promise<Response> {
  let lastError = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, delayMs));
    try {
      const res = await doFetch();
      if (res.ok) return res;
      lastError = `AlAdhan membalas ${res.status}`;
      if (res.status < 500) break;
    } catch (err) {
      lastError = `AlAdhan tidak dapat dihubungi: ${(err as Error).message}`;
    }
  }
  throw new AladhanError(lastError);
}
