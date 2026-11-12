import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type Redis from 'ioredis';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { REDIS } from '../src/redis/redis.module';
import { setupApp } from '../src/setup-app';
import { AladhanClient } from '../src/modules/prayer-times/aladhan.client';
import { ThrottlerStorage } from '@nestjs/throttler';

export const P = '/api/v1';

export class FakeAladhan {
  calls = 0;
  fail = false;
  async getTimings({ date }: { date: string }) {
    this.calls++;
    if (this.fail) throw new Error('down');
    const at = (hhmm: string) => new Date(`${date}T${hhmm}:00+07:00`).toISOString();
    return {
      method: 'Kementerian Agama Republik Indonesia',
      timings: {
        fajr: at('04:10'),
        sunrise: at('05:25'),
        dhuhr: at('11:45'),
        asr: at('15:05'),
        maghrib: at('17:55'),
        isha: at('19:05'),
      },
    };
  }
}

/** Throttler tanpa batas agar test tidak saling mengganggu. */
const noThrottle: ThrottlerStorage = {
  increment: async () => ({
    totalHits: 1,
    timeToExpire: 60,
    isBlocked: false,
    timeToBlockExpire: 0,
  }),
};

export interface TestContext {
  app: INestApplication<App>;
  prisma: PrismaService;
  redis: Redis;
  aladhan: FakeAladhan;
}

export async function createTestApp(opts: { throttle?: boolean } = {}): Promise<TestContext> {
  const aladhan = new FakeAladhan();
  let builder = Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AladhanClient)
    .useValue(aladhan);
  if (!opts.throttle) builder = builder.overrideProvider(ThrottlerStorage).useValue(noThrottle);
  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication<INestApplication<App>>({ bodyParser: false });
  setupApp(app);
  await app.init();
  return { app, prisma: app.get(PrismaService), redis: app.get(REDIS), aladhan };
}

export async function resetData(ctx: TestContext) {
  await ctx.prisma.refreshToken.deleteMany();
  await ctx.prisma.user.deleteMany();
  await ctx.redis.flushdb();
}

let counter = 0;
export async function registerUser(
  app: INestApplication<App>,
  overrides: Record<string, unknown> = {},
) {
  counter++;
  const body = {
    name: `Pengguna ${counter}`,
    email: `user${counter}-${Date.now()}@example.com`,
    password: 'rahasia-sekali',
    ...overrides,
  };
  const res = await request(app.getHttpServer()).post(`${P}/auth/register`).send(body).expect(201);
  return {
    accessToken: res.body.accessToken as string,
    user: res.body.user as { id: string; email: string },
    cookie: refreshCookieFrom(res.headers['set-cookie']),
    password: body.password,
  };
}

export function refreshCookieFrom(header: string | string[] | undefined): string {
  const list = Array.isArray(header) ? header : header ? [header] : [];
  const found = list.find((c) => c.startsWith('rt='));
  if (!found) throw new Error('cookie rt tidak ada');
  return found.split(';')[0];
}
