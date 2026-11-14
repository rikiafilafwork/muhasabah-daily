import { Module } from '@nestjs/common';
import { LectureNotesController } from './lecture-notes.controller';
import { LectureNotesService } from './lecture-notes.service';

@Module({ controllers: [LectureNotesController], providers: [LectureNotesService] })
export class LectureNotesModule {}
