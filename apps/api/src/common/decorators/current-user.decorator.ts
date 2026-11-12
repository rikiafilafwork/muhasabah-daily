import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthUser {
  id: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

/** Mengambil pengguna dari access token. Satu-satunya sumber `userId` di controller. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
