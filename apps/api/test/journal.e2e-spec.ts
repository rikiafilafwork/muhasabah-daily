import { ErrorCode } from '@muhasabah/shared';
import {
  as,
  createTestApp,
  FakeAi,
  registerUser,
  resetData,
  todayJakarta,
  waitFor,
  type TestContext,
} from './helpers';

describe('Jurnal dan AI Polish (integrasi)', () => {
  let ctx: TestContext;
  const ai = new FakeAi();
  let a: ReturnType<typeof as>;
  let b: ReturnType<typeof as>;
  const today = () => todayJakarta();

  beforeAll(async () => {
    ctx = await createTestApp({ ai });
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  beforeEach(async () => {
    await resetData(ctx);
    ai.calls = [];
    ai.mode = 'ok';
    a = as(ctx.app, (await registerUser(ctx.app)).accessToken);
    b = as(ctx.app, (await registerUser(ctx.app)).accessToken);
  });

  it('menyimpan, membaca, dan menghapus jurnal saat teks dikosongkan', async () => {
    expect((await a.get(`/journal/${today()}`).expect(200)).body).toMatchObject({
      rawText: '',
      polishStatus: 'none',
    });
    await a.put(`/journal/${today()}`, { rawText: 'hari ini sy belajar sabar' }).expect(200);
    expect((await a.get(`/journal/${today()}`)).body.rawText).toBe('hari ini sy belajar sabar');
    expect((await a.get('/journal')).body.items).toEqual([
      { date: today(), preview: 'hari ini sy belajar sabar', hasPolished: false },
    ]);
    await a.put(`/journal/${today()}`, { rawText: '   ' }).expect(200);
    expect(await ctx.prisma.journalEntry.count()).toBe(0);
    const future = await a.put(`/journal/${todayJakarta(1)}`, { rawText: 'x' }).expect(422);
    expect(future.body.code).toBe(ErrorCode.JOURNAL_FUTURE_DATE);
  });

  it('AI Polish: 202, diproses di antrean, teks asli tidak berubah', async () => {
    await a.put(`/journal/${today()}`, { rawText: 'hari ini sy belajar sabar' }).expect(200);
    const req = await a.post(`/journal/${today()}/polish`).expect(202);
    expect(req.body.polishStatus).toBe('pending');

    const done = await waitFor(
      async () => (await a.get(`/journal/${today()}`)).body,
      (e) => e.polishStatus !== 'pending',
    );
    expect(done).toMatchObject({
      rawText: 'hari ini sy belajar sabar',
      polishedText: 'Hari ini saya belajar sabar.',
      polishStatus: 'done',
      polishStale: false,
    });
    expect(ai.calls).toEqual(['hari ini sy belajar sabar']);

    await a.put(`/journal/${today()}`, { rawText: 'hari ini sy belajar sabar lagi' }).expect(200);
    expect((await a.get(`/journal/${today()}`)).body.polishStale).toBe(true);

    const discarded = await a.delete(`/journal/${today()}/polish`).expect(200);
    expect(discarded.body).toMatchObject({
      polishedText: null,
      polishStatus: 'none',
      rawText: 'hari ini sy belajar sabar lagi',
    });
  });

  it('penolakan model dicatat sebagai gagal tanpa menyentuh teks asli', async () => {
    ai.mode = 'refuse';
    await a.put(`/journal/${today()}`, { rawText: 'catatan' }).expect(200);
    await a.post(`/journal/${today()}/polish`).expect(202);
    const e = await waitFor(
      async () => (await a.get(`/journal/${today()}`)).body,
      (x) => x.polishStatus !== 'pending',
    );
    expect(e).toMatchObject({
      polishStatus: 'failed',
      polishError: 'AI_REFUSED',
      polishedText: null,
      rawText: 'catatan',
    });
  });

  it('menolak jurnal kosong dan menerapkan batas harian', async () => {
    expect((await a.post(`/journal/${today()}/polish`).expect(422)).body.code).toBe(
      ErrorCode.JOURNAL_EMPTY,
    );
    const status = (await a.get('/ai/status').expect(200)).body;
    expect(status).toMatchObject({ enabled: true, provider: 'fake', usedToday: 0, dailyLimit: 10 });

    await ctx.redis.set(
      `ai:quota:${(await ctx.prisma.user.findFirstOrThrow({ orderBy: { createdAt: 'asc' } })).id}:${today()}`,
      10,
    );
    await a.put(`/journal/${today()}`, { rawText: 'teks' }).expect(200);
    expect((await a.post(`/journal/${today()}/polish`).expect(429)).body.code).toBe(
      ErrorCode.AI_DAILY_LIMIT,
    );
  });

  it('pengguna B tidak bisa membaca, mengubah, atau memoles jurnal A', async () => {
    await a.put(`/journal/${today()}`, { rawText: 'rahasia A' }).expect(200);
    expect((await b.get(`/journal/${today()}`)).body.rawText).toBe('');
    expect((await b.get('/journal')).body.items).toEqual([]);
    expect((await b.post(`/journal/${today()}/polish`).expect(422)).body.code).toBe(
      ErrorCode.JOURNAL_EMPTY,
    );
    await b.delete(`/journal/${today()}/polish`).expect(404);
    expect((await a.get(`/journal/${today()}`)).body.rawText).toBe('rahasia A');
    expect(ai.calls).toEqual([]);
  });
});

describe('AI Polish tanpa konfigurasi AI', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp({ ai: null });
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it('membalas 501 AI_DISABLED dan status mati', async () => {
    await resetData(ctx);
    const a = as(ctx.app, (await registerUser(ctx.app)).accessToken);
    await a.put(`/journal/${todayJakarta()}`, { rawText: 'teks' }).expect(200);
    expect((await a.post(`/journal/${todayJakarta()}/polish`).expect(501)).body.code).toBe(
      ErrorCode.AI_DISABLED,
    );
    expect((await a.get('/ai/status')).body).toMatchObject({ enabled: false, provider: null });
  });
});
