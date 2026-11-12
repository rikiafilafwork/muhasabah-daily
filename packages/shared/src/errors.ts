/** Kode error stabil yang dikembalikan API. Dipakai web dan test. */
export const ErrorCode = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  REFRESH_TOKEN_MISSING: 'REFRESH_TOKEN_MISSING',
  REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',
  REFRESH_TOKEN_REUSED: 'REFRESH_TOKEN_REUSED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  PROFILE_LOCATION_MISSING: 'PROFILE_LOCATION_MISSING',
  PRAYER_TIMES_UNAVAILABLE: 'PRAYER_TIMES_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Bentuk body error dari API. */
export interface ApiErrorBody {
  statusCode: number;
  code: ErrorCode | string;
  message: string;
  details?: unknown;
}

/** Bentuk daftar berpaginasi kursor. */
export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}
