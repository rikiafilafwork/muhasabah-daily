import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type {
  FinanceCategory,
  FinanceMonthly,
  FinanceSummary,
  Paginated,
  Transaction,
} from '@muhasabah/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { IdParamDto } from '../../common/id-param.dto';
import { FinanceCategoriesService } from './finance-categories.service';
import {
  CreateFinanceCategoryDto,
  CreateTransactionDto,
  FinanceCategoriesQueryDto,
  FinanceMonthlyQueryDto,
  FinanceSummaryQueryDto,
  TransactionsQueryDto,
  UpdateFinanceCategoryDto,
  UpdateTransactionDto,
} from './finance.dto';
import { FinanceService } from './finance.service';

@ApiTags('Keuangan')
@ApiBearerAuth()
@Controller('finance')
export class FinanceController {
  constructor(
    private readonly finance: FinanceService,
    private readonly categories: FinanceCategoriesService,
  ) {}

  @Get('categories')
  listCategories(
    @CurrentUser() user: AuthUser,
    @Query() q: FinanceCategoriesQueryDto,
  ): Promise<Paginated<FinanceCategory>> {
    return this.categories.list(user.id, q.includeArchived);
  }

  @Post('categories')
  createCategory(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateFinanceCategoryDto,
  ): Promise<FinanceCategory> {
    return this.categories.create(user.id, body);
  }

  @Patch('categories/:id')
  updateCategory(
    @CurrentUser() user: AuthUser,
    @Param() { id }: IdParamDto,
    @Body() body: UpdateFinanceCategoryDto,
  ): Promise<FinanceCategory> {
    return this.categories.update(user.id, id, body);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCategory(@CurrentUser() user: AuthUser, @Param() { id }: IdParamDto): Promise<void> {
    return this.categories.remove(user.id, id);
  }

  @Get('transactions')
  list(
    @CurrentUser() user: AuthUser,
    @Query() q: TransactionsQueryDto,
  ): Promise<Paginated<Transaction>> {
    return this.finance.list(user.id, q);
  }

  @Get('transactions/:id')
  get(@CurrentUser() user: AuthUser, @Param() { id }: IdParamDto): Promise<Transaction> {
    return this.finance.get(user.id, id);
  }

  @Post('transactions')
  create(@CurrentUser() user: AuthUser, @Body() body: CreateTransactionDto): Promise<Transaction> {
    return this.finance.create(user.id, body);
  }

  @Patch('transactions/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param() { id }: IdParamDto,
    @Body() body: UpdateTransactionDto,
  ): Promise<Transaction> {
    return this.finance.update(user.id, id, body);
  }

  @Delete('transactions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param() { id }: IdParamDto): Promise<void> {
    return this.finance.remove(user.id, id);
  }

  @Get('summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Query() q: FinanceSummaryQueryDto,
  ): Promise<FinanceSummary> {
    return this.finance.summary(user.id, q.month);
  }

  @Get('monthly')
  monthly(
    @CurrentUser() user: AuthUser,
    @Query() q: FinanceMonthlyQueryDto,
  ): Promise<FinanceMonthly> {
    return this.finance.monthly(user.id, q);
  }
}
