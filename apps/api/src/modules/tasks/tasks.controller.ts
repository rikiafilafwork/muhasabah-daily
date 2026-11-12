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
import type { Paginated, Project, Task } from '@muhasabah/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { IdParamDto } from '../../common/id-param.dto';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  CreateTaskDto,
  ProjectsQueryDto,
  TasksQueryDto,
  UpdateProjectDto,
  UpdateTaskDto,
} from './tasks.dto';
import { TasksService } from './tasks.service';

@ApiTags('Tugas')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() q: ProjectsQueryDto): Promise<Paginated<Project>> {
    return this.projects.list(user.id, q.includeArchived);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateProjectDto): Promise<Project> {
    return this.projects.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param() { id }: IdParamDto,
    @Body() body: UpdateProjectDto,
  ): Promise<Project> {
    return this.projects.update(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param() { id }: IdParamDto): Promise<void> {
    return this.projects.remove(user.id, id);
  }
}

@ApiTags('Tugas')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() q: TasksQueryDto): Promise<Paginated<Task>> {
    return this.tasks.list(user.id, q);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param() { id }: IdParamDto): Promise<Task> {
    return this.tasks.get(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateTaskDto): Promise<Task> {
    return this.tasks.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param() { id }: IdParamDto,
    @Body() body: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasks.update(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param() { id }: IdParamDto): Promise<void> {
    return this.tasks.remove(user.id, id);
  }
}
