import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AyahsQueryDto, SurahParamsDto } from './quran.dto';
import { QuranService, toSurah } from './quran.service';

@ApiTags("Al-Qur'an")
@ApiBearerAuth()
@Controller('quran')
export class QuranController {
  constructor(private readonly quran: QuranService) {}

  @Get('status')
  status() {
    return this.quran.status();
  }

  @Get('surahs')
  async surahs() {
    return { items: await this.quran.surahs(), nextCursor: null };
  }

  @Get('surahs/:id')
  async surah(@Param() { id }: SurahParamsDto) {
    return toSurah(await this.quran.surah(id));
  }

  @Get('surahs/:id/ayahs')
  ayahs(@Param() { id }: SurahParamsDto, @Query() q: AyahsQueryDto) {
    return this.quran.ayahs(id, q.from, q.to);
  }
}
