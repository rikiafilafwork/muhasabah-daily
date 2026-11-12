import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '@muhasabah/shared';

/** Exception dengan `code` stabil. Dipetakan oleh AllExceptionsFilter. */
export class AppException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    status: HttpStatus,
    public readonly details?: unknown,
  ) {
    super({ code, message, details }, status);
  }
}
