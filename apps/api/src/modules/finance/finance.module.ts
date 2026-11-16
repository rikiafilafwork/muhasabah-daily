import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { FinanceBudgetController } from './finance-budget.controller';
import { FinanceBudgetService } from './finance-budget.service';
import { FinanceCategoriesService } from './finance-categories.service';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [UsersModule],
  controllers: [FinanceController, FinanceBudgetController],
  providers: [FinanceService, FinanceCategoriesService, FinanceBudgetService],
})
export class FinanceModule {}
