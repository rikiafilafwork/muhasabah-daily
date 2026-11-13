import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { FocusSession, FocusSessionList } from '@muhasabah/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { IdParamDto } from '../../common/id-param.dto';
import { CreateFocusSessionDto, FocusSessionsQueryDto } from './focus.dto';
import { FocusService } from './focus.service';

@ApiTags('Fokus')
@ApiBearerAuth()
@Controller('focus-sessions')
export class FocusController {
  constructor(private readonly focus: FocusService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateFocusSessionDto,
  ): Promise<FocusSession> {
    return this.focus.create(user.id, body);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() q: FocusSessionsQueryDto,
  ): Promise<FocusSessionList> {
    return this.focus.list(user.id, q);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param() { id }: IdParamDto): Promise<void> {
    return this.focus.remove(user.id, id);
  }
}
