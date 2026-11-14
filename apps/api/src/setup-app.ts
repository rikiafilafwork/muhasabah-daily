import type { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppConfig } from './config/app-config.service';

export const API_PREFIX = 'api/v1';

/** Konfigurasi HTTP yang dipakai `main.ts` dan test e2e agar perilakunya sama. */
export function setupApp(app: INestApplication): void {
  const config = app.get(AppConfig);
  const express = app as NestExpressApplication;

  app.setGlobalPrefix(API_PREFIX);
  // Percayai proxy di jaringan lokal/Docker (mis. nginx container web) untuk IP klien dan protokol.
  express.set('trust proxy', config.get('TRUST_PROXY'));
  // Cukup untuk dokumen catatan kajian (maks. 200 kB JSON, lihat LECTURE_NOTE_MAX_BYTES).
  express.useBodyParser('json', { limit: '300kb' });
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config
      .get('CORS_ORIGIN')
      .split(',')
      .map((o) => o.trim()),
    credentials: true,
  });
  app.enableShutdownHooks();
}
