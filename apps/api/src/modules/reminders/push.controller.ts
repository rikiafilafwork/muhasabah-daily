import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { PushConfig, PushTestResult } from '@muhasabah/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { PushSubscriptionDto, PushUnsubscribeDto } from './push.dto';
import { PushService } from './push.service';

@ApiTags('Pengingat')
@ApiBearerAuth()
@Controller('push')
export class PushController {
  constructor(private readonly push: PushService) {}

  /** Kunci publik VAPID untuk `pushManager.subscribe`. */
  @Get('config')
  config(): PushConfig {
    return this.push.getConfig();
  }

  @Post('subscriptions')
  @HttpCode(HttpStatus.NO_CONTENT)
  async subscribe(
    @CurrentUser() user: AuthUser,
    @Body() body: PushSubscriptionDto,
    @Headers('user-agent') userAgent?: string,
  ): Promise<void> {
    await this.push.subscribe(user.id, body, userAgent);
  }

  @Post('subscriptions/remove')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribe(@CurrentUser() user: AuthUser, @Body() body: PushUnsubscribeDto) {
    await this.push.unsubscribe(user.id, body.endpoint);
  }

  @Post('test')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async test(@CurrentUser() user: AuthUser): Promise<PushTestResult> {
    return { sent: await this.push.sendTest(user.id) };
  }
}
