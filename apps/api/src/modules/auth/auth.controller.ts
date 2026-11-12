import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ErrorCode, type AuthResponse } from '@muhasabah/shared';
import { AppException } from '../../common/app.exception';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from './refresh-cookie';

/** Batas lebih ketat untuk endpoint autentikasi: 10 permintaan per menit per IP. */
const AUTH_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('Auth')
@Public()
@Throttle(AUTH_THROTTLE)
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.auth.register(body, req.get('user-agent'));
    setRefreshCookie(res, result.refresh.token, result.refresh.expiresAt);
    return result.body;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.auth.login(body, req.get('user-agent'));
    setRefreshCookie(res, result.refresh.token, result.refresh.expiresAt);
    return result.body;
  }

  /** Menukar refresh token (cookie) dengan access token baru dan merotasi cookie. */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const token = readRefreshCookie(req);
    if (!token) {
      throw new AppException(
        ErrorCode.REFRESH_TOKEN_MISSING,
        'Sesi tidak ditemukan',
        HttpStatus.UNAUTHORIZED,
      );
    }
    try {
      const result = await this.auth.refresh(token, req.get('user-agent'));
      setRefreshCookie(res, result.refresh.token, result.refresh.expiresAt);
      return result.body;
    } catch (err) {
      clearRefreshCookie(res);
      throw err;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logout(readRefreshCookie(req));
    clearRefreshCookie(res);
  }
}
