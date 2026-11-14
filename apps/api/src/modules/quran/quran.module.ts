import { Module } from '@nestjs/common';
import { QuranController } from './quran.controller';
import { QuranService } from './quran.service';
import { SeedProcessor } from './seed.processor';

@Module({
  controllers: [QuranController],
  providers: [QuranService, SeedProcessor],
  exports: [QuranService],
})
export class QuranModule {}
