import { ErrorCode } from '@muhasabah/shared';
import { as, createTestApp, registerUser, resetData, type TestContext } from './helpers';

describe("Al-Qur'an (integrasi, data uji)", () => {
  let ctx: TestContext;
  let a: ReturnType<typeof as>;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  beforeEach(async () => {
    await resetData(ctx);
    a = as(ctx.app, (await registerUser(ctx.app)).accessToken);
  });

  it('menyajikan status, surah, dan ayat dalam rentang', async () => {
    const status = await a.get('/quran/status').expect(200);
    expect(status.body.seeded).toBe(true);
    const surahs = await a.get('/quran/surahs').expect(200);
    expect(surahs.body.items.map((s: { id: number }) => s.id)).toEqual(
      expect.arrayContaining([112, 113, 114]),
    );

    const res = await a.get('/quran/surahs/114/ayahs?from=2&to=3').expect(200);
    expect(res.body.surah).toMatchObject({ id: 114, nameLatin: 'An-Naas', ayahCount: 6 });
    expect(res.body.items.map((x: { numberInSurah: number }) => x.numberInSurah)).toEqual([2, 3]);
    expect(res.body.items[0]).toMatchObject({
      id: 6232,
      audioUrl: expect.stringMatching(/6232\.mp3$/),
    });
  });

  it('memvalidasi surah dan rentang', async () => {
    await a.get('/quran/surahs/115').expect(400);
    expect((await a.get('/quran/surahs/2').expect(404)).body.code).toBe(ErrorCode.SURAH_NOT_FOUND);
    expect((await a.get('/quran/surahs/112/ayahs?from=3&to=9').expect(400)).body.code).toBe(
      ErrorCode.AYAH_RANGE_INVALID,
    );
    await a.get('/quran/surahs/112/ayahs?from=4&to=2').expect(400);
  });

  it('memberi pesan jelas bila data belum diimpor', async () => {
    await ctx.prisma.memorizationPlan.deleteMany();
    await ctx.prisma.ayah.deleteMany();
    await ctx.prisma.surah.deleteMany();
    const res = await a.get('/quran/surahs').expect(503);
    expect(res.body.code).toBe(ErrorCode.QURAN_NOT_SEEDED);
    const { seedQuranFixture } = await import('../prisma/seed/quran-fixture');
    await seedQuranFixture(ctx.prisma);
  });
});
