import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { FinanceCategoriesService } from './finance-categories.service';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [UsersModule],
  controllers: [FinanceController],
  providers: [FinanceService, FinanceCategoriesService],
})
export class FinanceModule {}
