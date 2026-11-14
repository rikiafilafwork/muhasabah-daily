import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AiStatus, JournalEntry, JournalSummary, Paginated } from '@muhasabah/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { JournalDateParamDto, JournalListQueryDto, SaveJournalDto } from './journal.dto';
import { JournalService } from './journal.service';

@ApiTags('Jurnal')
@ApiBearerAuth()
@Controller()
export class JournalController {
  constructor(private readonly journal: JournalService) {}

  @Get('ai/status')
  aiStatus(@CurrentUser() user: AuthUser): Promise<AiStatus> {
    return this.journal.aiStatus(user.id);
  }

  @Get('journal')
  list(
    @CurrentUser() user: AuthUser,
    @Query() q: JournalListQueryDto,
  ): Promise<Paginated<JournalSummary>> {
    return this.journal.list(user.id, q.from, q.to);
  }

  @Get('journal/:date')
  get(
    @CurrentUser() user: AuthUser,
    @Param() { date }: JournalDateParamDto,
  ): Promise<JournalEntry> {
    return this.journal.get(user.id, date);
  }

  @Put('journal/:date')
  save(
    @CurrentUser() user: AuthUser,
    @Param() { date }: JournalDateParamDto,
    @Body() body: SaveJournalDto,
  ): Promise<JournalEntry> {
    return this.journal.save(user.id, date, body.rawText);
  }

  /** 202: diproses di latar; pantau status lewat `GET /journal/:date`. */
  @Post('journal/:date/polish')
  @HttpCode(HttpStatus.ACCEPTED)
  polish(
    @CurrentUser() user: AuthUser,
    @Param() { date }: JournalDateParamDto,
  ): Promise<JournalEntry> {
    return this.journal.requestPolish(user.id, date);
  }

  @Delete('journal/:date/polish')
  discard(
    @CurrentUser() user: AuthUser,
    @Param() { date }: JournalDateParamDto,
  ): Promise<JournalEntry> {
    return this.journal.discardPolish(user.id, date);
  }
}
