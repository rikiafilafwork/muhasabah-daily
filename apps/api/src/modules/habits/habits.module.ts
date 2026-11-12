import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { HabitsController, HabitTemplatesController } from './habits.controller';
import { HabitsService } from './habits.service';

@Module({
  imports: [UsersModule],
  controllers: [HabitTemplatesController, HabitsController],
  providers: [HabitsService],
})
export class HabitsModule {}
