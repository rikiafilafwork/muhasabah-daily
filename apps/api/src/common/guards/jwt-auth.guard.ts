import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ErrorCode } from '@muhasabah/shared';
import { AppException } from '../app.exception';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedRequest } from '../decorators/current-user.decorator';

interface AccessPayload {
  sub: string;
  typ: string;
}

/** Guard global: semua endpoint butuh Bearer token kecuali yang ditandai @Public(). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw this.unauthorized();

    try {
      const payload = await this.jwt.verifyAsync<AccessPayload>(token);
      if (payload.typ !== 'access' || !payload.sub) throw new Error('bad token');
      req.user = { id: payload.sub };
      return true;
    } catch {
      throw this.unauthorized();
    }
  }

  private unauthorized() {
    return new AppException(
      ErrorCode.UNAUTHORIZED,
      'Token akses tidak valid atau kedaluwarsa',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
