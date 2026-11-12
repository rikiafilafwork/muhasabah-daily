import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode, type Profile, type UpdateProfileInput } from '@muhasabah/shared';
import { AppException } from '../../common/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { toProfile } from './users.mapper';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppException(
        ErrorCode.USER_NOT_FOUND,
        'Pengguna tidak ditemukan',
        HttpStatus.NOT_FOUND,
      );
    }
    return user;
  }

  async getProfile(userId: string): Promise<Profile> {
    return toProfile(await this.findById(userId));
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
    await this.findById(userId);
    const user = await this.prisma.user.update({ where: { id: userId }, data: input });
    return toProfile(user);
  }

  /** Menghapus akun dan seluruh data milik pengguna (cascade di basis data). */
  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.user.deleteMany({ where: { id: userId } });
  }
}
