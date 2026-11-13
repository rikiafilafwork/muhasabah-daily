import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { DhikrController } from './dhikr.controller';
import { DhikrService } from './dhikr.service';

@Module({ imports: [UsersModule], controllers: [DhikrController], providers: [DhikrService] })
export class DhikrModule {}
