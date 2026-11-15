import { HttpStatus, Injectable } from '@nestjs/common';
import type { Ayah as AyahRow, Surah as SurahRow } from '../../generated/prisma/client';
import { ErrorCode, type Ayah, type Surah } from '@muhasabah/shared';
import { AppException } from '../../common/app.exception';
import { notFound } from '../../common/not-found';
import { PrismaService } from '../../prisma/prisma.service';

export function toSurah(s: SurahRow): Surah {
  return {
    id: s.id,
    nameArabic: s.nameArabic,
    nameLatin: s.nameLatin,
    nameMeaning: s.nameMeaning,
    revelationType: s.revelationType === 'Medinan' ? 'Medinan' : 'Meccan',
    ayahCount: s.ayahCount,
  };
}

export function toAyah(a: AyahRow): Ayah {
  return {
    id: a.id,
    surahId: a.surahId,
    numberInSurah: a.numberInSurah,
    juz: a.juz,
    page: a.page,
    arabic: a.arabic,
    latin: a.latin,
    translation: a.translationId,
    audioUrl: a.audioUrl,
  };
}

@Injectable()
export class QuranService {
  constructor(private readonly prisma: PrismaService) {}

  async status() {
    const [surahs, ayahs] = await Promise.all([
      this.prisma.surah.count(),
      this.prisma.ayah.count(),
    ]);
    return { seeded: surahs > 0 && ayahs > 0, surahs, ayahs };
  }

  async surahs(): Promise<Surah[]> {
    const rows = await this.prisma.surah.findMany({ orderBy: { id: 'asc' } });
    if (!rows.length) throw this.notSeeded();
    return rows.map(toSurah);
  }

  async surah(id: number): Promise<SurahRow> {
    const s = await this.prisma.surah.findUnique({ where: { id } });
    if (!s) {
      if (!(await this.prisma.surah.count())) throw this.notSeeded();
      throw notFound(ErrorCode.SURAH_NOT_FOUND, 'Surah');
    }
    return s;
  }

  /** Memastikan rentang ayat ada di surah tersebut. */
  async assertRange(surahId: number, from: number, to: number): Promise<SurahRow> {
    const s = await this.surah(surahId);
    if (from < 1 || to > s.ayahCount || from > to) {
      throw new AppException(
        ErrorCode.AYAH_RANGE_INVALID,
        `Surah ${s.nameLatin} hanya memiliki ${s.ayahCount} ayat`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return s;
  }

  async ayahs(surahId: number, from?: number, to?: number) {
    const s = await this.surah(surahId);
    const start = from ?? 1;
    const end = to ?? s.ayahCount;
    await this.assertRange(surahId, start, end);
    const rows = await this.prisma.ayah.findMany({
      where: { surahId, numberInSurah: { gte: start, lte: end } },
      orderBy: { numberInSurah: 'asc' },
    });
    return { surah: toSurah(s), items: rows.map(toAyah), nextCursor: null };
  }

  private notSeeded() {
    return new AppException(
      ErrorCode.QURAN_NOT_SEEDED,
      "Data Al-Qur'an belum diimpor. Jalankan `pnpm --filter api seed:quran`.",
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
