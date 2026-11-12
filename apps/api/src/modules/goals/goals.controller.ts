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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Goal, Paginated } from '@muhasabah/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { IdParamDto } from '../../common/id-param.dto';
import { CreateGoalDto, SetGoalHabitsDto, UpdateGoalDto } from './goals.dto';
import { GoalsService } from './goals.service';

@ApiTags('Goals')
@ApiBearerAuth()
@Controller('goals')
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<Paginated<Goal>> {
    return this.goals.list(user.id);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param() { id }: IdParamDto): Promise<Goal> {
    return this.goals.get(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateGoalDto): Promise<Goal> {
    return this.goals.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param() { id }: IdParamDto,
    @Body() body: UpdateGoalDto,
  ): Promise<Goal> {
    return this.goals.update(user.id, id, body);
  }

  @Put(':id/habits')
  setHabits(
    @CurrentUser() user: AuthUser,
    @Param() { id }: IdParamDto,
    @Body() body: SetGoalHabitsDto,
  ): Promise<Goal> {
    return this.goals.setHabits(user.id, id, body.habits);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param() { id }: IdParamDto): Promise<void> {
    return this.goals.remove(user.id, id);
  }
}
