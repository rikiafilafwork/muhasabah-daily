import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { ErrorCode } from '@muhasabah/shared';
import { AppException } from '../../common/app.exception';
import { AppConfig } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';

export interface IssuedRefreshToken {
  token: string;
  expiresAt: Date;
  userId: string;
}

/**
 * Refresh token acak yang disimpan ter-hash dan dirotasi setiap dipakai.
 * Token lama yang dipakai ulang mencabut seluruh keluarganya (ARCHITECTURE.md 4.3).
 */
@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
  ) {}

  hash(token: string): string {
    return createHmac('sha256', this.config.get('JWT_REFRESH_SECRET')).update(token).digest('hex');
  }

  private expiry(): Date {
    return new Date(Date.now() + this.config.get('REFRESH_TOKEN_TTL_DAYS') * 24 * 60 * 60 * 1000);
  }

  /** Membuat token baru. Tanpa `familyId` berarti keluarga baru (login). */
  async issue(userId: string, familyId: string = randomUUID(), userAgent?: string) {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = this.expiry();
    const record = await this.prisma.refreshToken.create({
      data: { userId, familyId, tokenHash: this.hash(token), expiresAt, userAgent },
    });
    return { token, expiresAt, userId, id: record.id };
  }

  /** Menukar token lama dengan token baru dalam keluarga yang sama. */
  async rotate(token: string, userAgent?: string): Promise<IssuedRefreshToken> {
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(token) },
    });
    if (!existing) throw this.invalid();

    if (existing.revokedAt) {
      await this.revokeFamily(existing.familyId);
      this.logger.warn(
        { familyId: existing.familyId, userId: existing.userId },
        'refresh token reuse',
      );
      throw new AppException(
        ErrorCode.REFRESH_TOKEN_REUSED,
        'Sesi dicabut karena token dipakai ulang. Silakan masuk kembali.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (existing.expiresAt.getTime() <= Date.now()) throw this.invalid();

    const newToken = randomBytes(32).toString('base64url');
    const expiresAt = this.expiry();

    const rotated = await this.prisma.$transaction(async (tx) => {
      // Klaim token lama secara atomik; permintaan paralel yang kalah dianggap reuse.
      const claimed = await tx.refreshToken.updateMany({
        where: { id: existing.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (claimed.count === 0) return null;
      const created = await tx.refreshToken.create({
        data: {
          userId: existing.userId,
          familyId: existing.familyId,
          tokenHash: this.hash(newToken),
          expiresAt,
          userAgent,
        },
      });
      await tx.refreshToken.update({
        where: { id: existing.id },
        data: { replacedById: created.id },
      });
      return created;
    });

    if (!rotated) {
      await this.revokeFamily(existing.familyId);
      throw new AppException(
        ErrorCode.REFRESH_TOKEN_REUSED,
        'Sesi dicabut karena token dipakai ulang. Silakan masuk kembali.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return { token: newToken, expiresAt, userId: existing.userId };
  }

  /** Mencabut keluarga token milik `token` (keluar). Tidak error bila token tak dikenal. */
  async revokeByToken(token: string): Promise<void> {
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(token) },
    });
    if (existing) await this.revokeFamily(existing.familyId);
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private invalid() {
    return new AppException(
      ErrorCode.REFRESH_TOKEN_INVALID,
      'Sesi tidak valid atau kedaluwarsa. Silakan masuk kembali.',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
