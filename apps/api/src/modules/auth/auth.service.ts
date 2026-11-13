import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import {
  ErrorCode,
  type AuthResponse,
  type LoginInput,
  type RegisterInput,
} from '@muhasabah/shared';
import { AppException } from '../../common/app.exception';
import { AppConfig } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { toProfile } from '../users/users.mapper';
import { UsersService } from '../users/users.service';
import { hashPassword, verifyPassword } from './password';
import { RefreshTokenService } from './refresh-token.service';

export interface AuthResult {
  body: AuthResponse;
  refresh: { token: string; expiresAt: Date };
}

@Injectable()
export class AuthService {
  /** Hash tiruan agar waktu respons login sama walau email tidak terdaftar. */
  private dummyHash?: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: AppConfig,
    private readonly refreshTokens: RefreshTokenService,
    private readonly users: UsersService,
  ) {}

  async register(input: RegisterInput, userAgent?: string): Promise<AuthResult> {
    const passwordHash = await hashPassword(input.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash,
          ...(input.timezone ? { timezone: input.timezone } : {}),
        },
      });
      return this.startSession(user, userAgent);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new AppException(ErrorCode.EMAIL_TAKEN, 'Email sudah terdaftar', HttpStatus.CONFLICT);
      }
      throw err;
    }
  }

  async login(input: LoginInput, userAgent?: string): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    const hash = user?.passwordHash ?? (await this.getDummyHash());
    const valid = await verifyPassword(hash, input.password);
    if (!user || !valid) {
      throw new AppException(
        ErrorCode.INVALID_CREDENTIALS,
        'Email atau kata sandi salah',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.startSession(user, userAgent);
  }

  async refresh(token: string, userAgent?: string): Promise<AuthResult> {
    const rotated = await this.refreshTokens.rotate(token, userAgent);
    const user = await this.users.findById(rotated.userId);
    return {
      body: this.buildBody(user),
      refresh: { token: rotated.token, expiresAt: rotated.expiresAt },
    };
  }

  async logout(token: string | undefined): Promise<void> {
    if (token) await this.refreshTokens.revokeByToken(token);
  }

  private async startSession(
    user: Parameters<typeof toProfile>[0],
    userAgent?: string,
  ): Promise<AuthResult> {
    const refresh = await this.refreshTokens.issue(user.id, undefined, userAgent);
    return {
      body: this.buildBody(user),
      refresh: { token: refresh.token, expiresAt: refresh.expiresAt },
    };
  }

  private buildBody(user: Parameters<typeof toProfile>[0]): AuthResponse {
    const expiresIn = this.config.get('JWT_ACCESS_TTL_SECONDS');
    const accessToken = this.jwt.sign({ sub: user.id, typ: 'access' }, { expiresIn });
    return { accessToken, expiresIn, user: toProfile(user) };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= hashPassword('dummy-password-for-timing');
    return this.dummyHash;
  }
}
