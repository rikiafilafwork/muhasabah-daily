import { Controller, Get, HttpStatus, Inject, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import type Redis from 'ioredis';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS } from '../../redis/redis.module';

type Status = 'up' | 'down';

export interface HealthResponse {
  status: 'ok' | 'error';
  checks: { database: Status; redis: Status };
}

async function check(fn: () => Promise<unknown>, timeoutMs = 2000): Promise<Status> {
  try {
    await Promise.race([
      fn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
    return 'up';
  } catch {
    return 'down';
  }
}

@ApiTags('Sistem')
@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @Get()
  async health(@Res({ passthrough: true }) res: Response): Promise<HealthResponse> {
    const [database, redis] = await Promise.all([
      check(() => this.prisma.$queryRaw`SELECT 1`),
      check(() => this.redis.ping()),
    ]);
    const ok = database === 'up' && redis === 'up';
    res.status(ok ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return { status: ok ? 'ok' : 'error', checks: { database, redis } };
  }
}
