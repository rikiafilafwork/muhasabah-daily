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
import type { CalendarEvent, Paginated } from '@muhasabah/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { IdParamDto } from '../../common/id-param.dto';
import { CreateEventDto, EventsQueryDto, UpdateEventDto } from './events.dto';
import { EventsService } from './events.service';

@ApiTags('Jadwal')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: EventsQueryDto,
  ): Promise<Paginated<CalendarEvent>> {
    return this.events.list(user.id, query);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param() { id }: IdParamDto): Promise<CalendarEvent> {
    return this.events.get(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateEventDto): Promise<CalendarEvent> {
    return this.events.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param() { id }: IdParamDto,
    @Body() body: UpdateEventDto,
  ): Promise<CalendarEvent> {
    return this.events.update(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param() { id }: IdParamDto): Promise<void> {
    return this.events.remove(user.id, id);
  }
}
