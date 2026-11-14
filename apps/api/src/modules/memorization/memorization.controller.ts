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
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { MemorizationPlan, Paginated } from '@muhasabah/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { IdParamDto } from '../../common/id-param.dto';
import { CreatePlanDto, PlansQueryDto, SetStagesDto, UpdatePlanDto } from './memorization.dto';
import { MemorizationService } from './memorization.service';

@ApiTags('Hafidz')
@ApiBearerAuth()
@Controller('memorization-plans')
export class MemorizationController {
  constructor(private readonly plans: MemorizationService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() q: PlansQueryDto,
  ): Promise<Paginated<MemorizationPlan>> {
    return this.plans.list(user.id, q.includeArchived);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param() { id }: IdParamDto): Promise<MemorizationPlan> {
    return this.plans.get(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreatePlanDto): Promise<MemorizationPlan> {
    return this.plans.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param() { id }: IdParamDto,
    @Body() body: UpdatePlanDto,
  ): Promise<MemorizationPlan> {
    return this.plans.update(user.id, id, body);
  }

  @Put(':id/stages')
  setStages(
    @CurrentUser() user: AuthUser,
    @Param() { id }: IdParamDto,
    @Body() body: SetStagesDto,
  ): Promise<MemorizationPlan> {
    return this.plans.setStages(user.id, id, body.stages);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param() { id }: IdParamDto): Promise<void> {
    return this.plans.remove(user.id, id);
  }
}
