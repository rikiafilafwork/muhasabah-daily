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
import type { Habit, HabitInsights, HabitTemplate, Paginated } from '@muhasabah/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { IdParamDto } from '../../common/id-param.dto';
import {
  CreateHabitDto,
  HabitInsightsQueryDto,
  HabitLogBodyDto,
  HabitLogParamsDto,
  HabitsQueryDto,
  UpdateHabitDto,
} from './habits.dto';
import { HabitsService } from './habits.service';

@ApiTags('Habit')
@ApiBearerAuth()
@Controller('habit-templates')
export class HabitTemplatesController {
  constructor(private readonly habits: HabitsService) {}

  @Get()
  list(): Promise<Paginated<HabitTemplate>> {
    return this.habits.templates();
  }
}

@ApiTags('Habit')
@ApiBearerAuth()
@Controller('habits')
export class HabitsController {
  constructor(private readonly habits: HabitsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() q: HabitsQueryDto): Promise<Paginated<Habit>> {
    return this.habits.list(user.id, q);
  }

  @Get('insights')
  insights(
    @CurrentUser() user: AuthUser,
    @Query() q: HabitInsightsQueryDto,
  ): Promise<HabitInsights> {
    return this.habits.insights(user.id, q);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateHabitDto): Promise<Habit> {
    return this.habits.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param() { id }: IdParamDto,
    @Body() body: UpdateHabitDto,
  ): Promise<Habit> {
    return this.habits.update(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param() { id }: IdParamDto): Promise<void> {
    return this.habits.remove(user.id, id);
  }

  /** Idempoten: `done: true` mencentang, `done: false` membatalkan. */
  @Put(':id/logs/:date')
  setLog(
    @CurrentUser() user: AuthUser,
    @Param() { id, date }: HabitLogParamsDto,
    @Body() body: HabitLogBodyDto,
  ) {
    return this.habits.setLog(user.id, id, date, body.done);
  }
}
