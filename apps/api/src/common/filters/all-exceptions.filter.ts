import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import { ErrorCode, type ApiErrorBody } from '@muhasabah/shared';
import { AppException } from '../app.exception';

const STATUS_CODES: Partial<Record<number, ErrorCode>> = {
  400: ErrorCode.VALIDATION_FAILED,
  401: ErrorCode.UNAUTHORIZED,
  403: ErrorCode.FORBIDDEN,
  404: ErrorCode.NOT_FOUND,
  429: ErrorCode.TOO_MANY_REQUESTS,
};

/** Menyeragamkan semua error menjadi `{ statusCode, code, message, details? }`. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);
    // Error domain (AppException) adalah respons yang disengaja; hanya galat tak terduga yang dicatat lengkap.
    if (body.statusCode >= 500 && !(exception instanceof AppException)) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }
    res.status(body.statusCode).json(body);
  }

  toBody(exception: unknown): ApiErrorBody {
    if (exception instanceof AppException) {
      const body: ApiErrorBody = {
        statusCode: exception.getStatus(),
        code: exception.code,
        message: exception.message,
      };
      if (exception.details !== undefined) body.details = exception.details;
      return body;
    }

    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError();
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: ErrorCode.VALIDATION_FAILED,
        message: 'Input tidak valid',
        details:
          zodError instanceof ZodError
            ? zodError.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
            : undefined,
      };
    }

    if (exception instanceof ThrottlerException) {
      return {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        code: ErrorCode.TOO_MANY_REQUESTS,
        message: 'Terlalu banyak permintaan, coba lagi nanti',
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return {
        statusCode: status,
        code: STATUS_CODES[status] ?? (status >= 500 ? ErrorCode.INTERNAL_ERROR : 'HTTP_ERROR'),
        message: exception.message,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Terjadi kesalahan pada server',
    };
  }
}
