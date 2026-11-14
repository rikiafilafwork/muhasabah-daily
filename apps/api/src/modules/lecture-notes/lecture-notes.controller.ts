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
import type { LectureNote, LectureNoteSummary, Paginated } from '@muhasabah/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { IdParamDto } from '../../common/id-param.dto';
import {
  CreateLectureNoteDto,
  LectureNotesQueryDto,
  UpdateLectureNoteDto,
} from './lecture-notes.dto';
import { LectureNotesService } from './lecture-notes.service';

@ApiTags('Kajian')
@ApiBearerAuth()
@Controller('lecture-notes')
export class LectureNotesController {
  constructor(private readonly notes: LectureNotesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() q: LectureNotesQueryDto,
  ): Promise<Paginated<LectureNoteSummary>> {
    return this.notes.list(user.id, q);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param() { id }: IdParamDto): Promise<LectureNote> {
    return this.notes.get(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateLectureNoteDto): Promise<LectureNote> {
    return this.notes.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param() { id }: IdParamDto,
    @Body() body: UpdateLectureNoteDto,
  ): Promise<LectureNote> {
    return this.notes.update(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param() { id }: IdParamDto): Promise<void> {
    return this.notes.remove(user.id, id);
  }
}
