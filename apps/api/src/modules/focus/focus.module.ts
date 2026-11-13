import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { FocusController } from './focus.controller';
import { FocusService } from './focus.service';

@Module({ imports: [UsersModule], controllers: [FocusController], providers: [FocusService] })
export class FocusModule {}
