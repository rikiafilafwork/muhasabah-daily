import { Module } from '@nestjs/common';
import { PrayerTimesModule } from '../prayer-times/prayer-times.module';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { RemindersProcessor } from './reminders.processor';
import { RemindersService } from './reminders.service';
import { WebPushSender } from './web-push.sender';

@Module({
  imports: [PrayerTimesModule],
  controllers: [PushController],
  providers: [PushService, RemindersService, RemindersProcessor, WebPushSender],
})
export class RemindersModule {}
