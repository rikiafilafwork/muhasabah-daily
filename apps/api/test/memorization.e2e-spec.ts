import { ErrorCode } from '@muhasabah/shared';
import { as, createTestApp, registerUser, resetData, type TestContext } from './helpers';

describe('Hafidz (integrasi)', () => {
  let ctx: TestContext;
  let a: ReturnType<typeof as>;
  let b: ReturnType<typeof as>;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  beforeEach(async () => {
    await resetData(ctx);
    a = as(ctx.app, (await registerUser(ctx.app)).accessToken);
    b = as(ctx.app, (await registerUser(ctx.app)).accessToken);
  });

  const plan = {
    surahId: 112,
    fromAyah: 1,
    toAyah: 4,
    settings: { listenRepeat: 3, reciteRepeat: 2, connectRepeat: 2 },
  };

  it('membuat rencana dengan tahapan tikrar otomatis', async () => {
    const res = await a.post('/memorization-plans', plan).expect(201);
    expect(res.body).toMatchObject({
      surahName: 'Al-Ikhlaas',
      currentStage: 0,
      progress: 0,
      completed: false,
    });
    // 4 ayat × (dengar + baca) + 3 sambung
    expect(res.body.stages).toHaveLength(11);
    expect(res.body.stages[4]).toMatchObject({
      position: 4,
      kind: 'connect',
      fromAyah: 1,
      toAyah: 2,
      repeat: 2,
    });
  });

  it('memvalidasi rentang terhadap jumlah ayat surah', async () => {
    const res = await a.post('/memorization-plans', { ...plan, toAyah: 7 }).expect(400);
    expect(res.body.code).toBe(ErrorCode.AYAH_RANGE_INVALID);
    await a.post('/memorization-plans', { ...plan, surahId: 2 }).expect(404);
  });

  it('memperbarui progres hingga selesai', async () => {
    const { body } = await a.post('/memorization-plans', plan).expect(201);
    const mid = await a.patch(`/memorization-plans/${body.id}`, { currentStage: 5 }).expect(200);
    expect(mid.body.progress).toBe(45);
    const done = await a.patch(`/memorization-plans/${body.id}`, { currentStage: 11 }).expect(200);
    expect(done.body).toMatchObject({ progress: 100, completed: true });
    await a.patch(`/memorization-plans/${body.id}`, { currentStage: 12 }).expect(400);
  });

  it('PUT stages mengganti tahapan dan menyetel ulang progres', async () => {
    const { body } = await a.post('/memorization-plans', plan).expect(201);
    await a.patch(`/memorization-plans/${body.id}`, { currentStage: 3 }).expect(200);
    const stages = [
      { kind: 'listen', fromAyah: 1, toAyah: 4, repeat: 10 },
      { kind: 'recite', fromAyah: 1, toAyah: 4, repeat: 3 },
    ];
    const res = await a.put(`/memorization-plans/${body.id}/stages`, { stages }).expect(200);
    expect(res.body).toMatchObject({
      currentStage: 0,
      stages: [
        { position: 0, ...stages[0] },
        { position: 1, ...stages[1] },
      ],
    });
    const outside = await a
      .put(`/memorization-plans/${body.id}/stages`, {
        stages: [{ kind: 'listen', fromAyah: 1, toAyah: 5, repeat: 1 }],
      })
      .expect(400);
    expect(outside.body.code).toBe(ErrorCode.AYAH_RANGE_INVALID);
  });

  it('pengguna B tidak bisa melihat, mengubah, atau menghapus rencana A', async () => {
    const { body } = await a.post('/memorization-plans', plan).expect(201);
    expect((await b.get(`/memorization-plans/${body.id}`).expect(404)).body.code).toBe(
      ErrorCode.MEMORIZATION_PLAN_NOT_FOUND,
    );
    await b.patch(`/memorization-plans/${body.id}`, { currentStage: 2 }).expect(404);
    await b
      .put(`/memorization-plans/${body.id}/stages`, {
        stages: [{ kind: 'listen', fromAyah: 1, toAyah: 1, repeat: 1 }],
      })
      .expect(404);
    await b.delete(`/memorization-plans/${body.id}`).expect(404);
    expect((await b.get('/memorization-plans')).body.items).toEqual([]);
    expect((await a.get(`/memorization-plans/${body.id}`)).body.currentStage).toBe(0);
  });
});
