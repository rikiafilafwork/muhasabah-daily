import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { NextPrayer, PrayerTimes } from '@muhasabah/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { PrayerTimesQueryDto } from './dto/prayer-times-query.dto';
import { PrayerTimesService } from './prayer-times.service';

@ApiTags('Waktu sholat')
@ApiBearerAuth()
@Controller('prayer-times')
export class PrayerTimesController {
  constructor(private readonly prayerTimes: PrayerTimesService) {}

  @Get()
  get(@CurrentUser() user: AuthUser, @Query() query: PrayerTimesQueryDto): Promise<PrayerTimes> {
    return this.prayerTimes.getForUser(user.id, query.date);
  }

  @Get('next')
  next(@CurrentUser() user: AuthUser): Promise<NextPrayer> {
    return this.prayerTimes.getNextForUser(user.id);
  }
}
