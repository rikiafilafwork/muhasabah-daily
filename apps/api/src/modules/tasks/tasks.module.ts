import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ProjectsService } from './projects.service';
import { ProjectsController, TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [UsersModule],
  controllers: [ProjectsController, TasksController],
  providers: [ProjectsService, TasksService],
})
export class TasksModule {}
