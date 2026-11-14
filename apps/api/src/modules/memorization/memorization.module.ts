import { Module } from '@nestjs/common';
import { QuranModule } from '../quran/quran.module';
import { MemorizationController } from './memorization.controller';
import { MemorizationService } from './memorization.service';

@Module({
  imports: [QuranModule],
  controllers: [MemorizationController],
  providers: [MemorizationService],
})
export class MemorizationModule {}
