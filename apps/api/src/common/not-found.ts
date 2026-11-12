import { HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '@muhasabah/shared';
import { AppException } from './app.exception';

/**
 * 404 untuk sumber daya yang tidak ada **atau** milik pengguna lain. Keduanya
 * sengaja tidak dibedakan agar keberadaan data orang lain tidak bocor.
 */
export function notFound(code: ErrorCode, what: string): AppException {
  return new AppException(code, `${what} tidak ditemukan`, HttpStatus.NOT_FOUND);
}
