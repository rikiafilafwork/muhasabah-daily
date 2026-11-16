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
  ApplyTemplateResult,
  FinancePlan,
  FinanceTemplateItem,
  Paginated,
  Transaction,
} from '@muhasabah/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { IdParamDto } from '../../common/id-param.dto';
import { FinanceBudgetService } from './finance-budget.service';
import {
  ApplyTemplateDto,
  CreatePlanDto,
  CreateTemplateItemDto,
  PlansQueryDto,
  RealizePlanDto,
  UpdatePlanDto,
  UpdateTemplateItemDto,
} from './finance.dto';

@ApiTags('Keuangan')
@ApiBearerAuth()
@Controller('finance')
export class FinanceBudgetController {
  constructor(private readonly budget: FinanceBudgetService) {}

  @Get('template')
  listTemplate(@CurrentUser() user: AuthUser): Promise<Paginated<FinanceTemplateItem>> {
    return this.budget.listTemplate(user.id);
  }

  @Post('template')
  createTemplateItem(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateTemplateItemDto,
  ): Promise<FinanceTemplateItem> {
    return this.budget.createTemplateItem(user.id, body);
  }

  @Patch('template/:id')
  updateTemplateItem(
    @CurrentUser() user: AuthUser,
    @Param() { id }: IdParamDto,
    @Body() body: UpdateTemplateItemDto,
  ): Promise<FinanceTemplateItem> {
    return this.budget.updateTemplateItem(user.id, id, body);
  }

  @Delete('template/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTemplateItem(@CurrentUser() user: AuthUser, @Param() { id }: IdParamDto): Promise<void> {
    return this.budget.removeTemplateItem(user.id, id);
  }

  @Get('plans')
  listPlans(
    @CurrentUser() user: AuthUser,
    @Query() q: PlansQueryDto,
  ): Promise<Paginated<FinancePlan>> {
    return this.budget.listPlans(user.id, q.month);
  }

  @Post('plans/apply-template')
  @HttpCode(HttpStatus.OK)
  applyTemplate(
    @CurrentUser() user: AuthUser,
    @Body() body: ApplyTemplateDto,
  ): Promise<ApplyTemplateResult> {
    return this.budget.applyTemplate(user.id, body.month);
  }

  @Post('plans')
  createPlan(@CurrentUser() user: AuthUser, @Body() body: CreatePlanDto): Promise<FinancePlan> {
    return this.budget.createPlan(user.id, body);
  }

  @Patch('plans/:id')
  updatePlan(
    @CurrentUser() user: AuthUser,
    @Param() { id }: IdParamDto,
    @Body() body: UpdatePlanDto,
  ): Promise<FinancePlan> {
    return this.budget.updatePlan(user.id, id, body);
  }

  @Delete('plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removePlan(@CurrentUser() user: AuthUser, @Param() { id }: IdParamDto): Promise<void> {
    return this.budget.removePlan(user.id, id);
  }

  @Post('plans/:id/realize')
  realize(
    @CurrentUser() user: AuthUser,
    @Param() { id }: IdParamDto,
    @Body() body: RealizePlanDto,
  ): Promise<Transaction> {
    return this.budget.realize(user.id, id, body);
  }

  @Delete('plans/:id/realize')
  unrealize(@CurrentUser() user: AuthUser, @Param() { id }: IdParamDto): Promise<FinancePlan> {
    return this.budget.unrealize(user.id, id);
  }
}
