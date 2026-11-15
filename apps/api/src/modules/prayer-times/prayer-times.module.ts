import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AladhanClient } from './aladhan.client';
import { PrayerTimesController } from './prayer-times.controller';
import { PrayerTimesService } from './prayer-times.service';

@Module({
  imports: [UsersModule],
  controllers: [PrayerTimesController],
  providers: [PrayerTimesService, AladhanClient],
  exports: [PrayerTimesService],
})
export class PrayerTimesModule {}
