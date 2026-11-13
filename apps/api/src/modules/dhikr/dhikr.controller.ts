import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { DhikrList, DhikrSummary } from '@muhasabah/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import {
  DhikrLogBodyDto,
  DhikrLogParamsDto,
  DhikrQueryDto,
  DhikrSummaryQueryDto,
} from './dhikr.dto';
import { DhikrService } from './dhikr.service';

@ApiTags('Dzikir')
@ApiBearerAuth()
@Controller('dhikr')
export class DhikrController {
  constructor(private readonly dhikr: DhikrService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() q: DhikrQueryDto): Promise<DhikrList> {
    return this.dhikr.list(user.id, q.group, q.date);
  }

  @Get('summary')
  summary(@CurrentUser() user: AuthUser, @Query() q: DhikrSummaryQueryDto): Promise<DhikrSummary> {
    return this.dhikr.summary(user.id, q.date);
  }

  /** Menetapkan hitungan harian (idempoten). */
  @Put(':id/logs/:date')
  setCount(
    @CurrentUser() user: AuthUser,
    @Param() { id, date }: DhikrLogParamsDto,
    @Body() body: DhikrLogBodyDto,
  ) {
    return this.dhikr.setCount(user.id, id, date, body.count);
  }
}
