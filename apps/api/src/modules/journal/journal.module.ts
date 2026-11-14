import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';
import { PolishProcessor } from './polish.processor';

@Module({
  imports: [UsersModule],
  controllers: [JournalController],
  providers: [JournalService, PolishProcessor],
})
export class JournalModule {}
