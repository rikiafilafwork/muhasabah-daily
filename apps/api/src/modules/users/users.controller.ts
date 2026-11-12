import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { Profile } from '@muhasabah/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { clearRefreshCookie } from '../auth/refresh-cookie';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('Profil')
@ApiBearerAuth()
@Controller('me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  get(@CurrentUser() user: AuthUser): Promise<Profile> {
    return this.users.getProfile(user.id);
  }

  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() body: UpdateProfileDto): Promise<Profile> {
    return this.users.updateProfile(user.id, body);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.users.deleteAccount(user.id);
    clearRefreshCookie(res);
  }
}
