import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './env';

/** Akses konfigurasi bertipe. */
@Injectable()
export class AppConfig {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get<K extends keyof Env>(key: K): Env[K] {
    return this.config.get(key, { infer: true });
  }

  get isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  get pushEnabled(): boolean {
    return Boolean(this.get('VAPID_PUBLIC_KEY') && this.get('VAPID_PRIVATE_KEY'));
  }

  get aiEnabled(): boolean {
    return Boolean(this.get('AI_PROVIDER') && this.get('AI_API_KEY'));
  }
}
