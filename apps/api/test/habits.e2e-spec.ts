import { ErrorCode } from '@muhasabah/shared';
import {
  as,
  createTestApp,
  registerUser,
  resetData,
  todayJakarta,
  type TestContext,
} from './helpers';

describe('Habit (integrasi)', () => {
  let ctx: TestContext;
  let a: ReturnType<typeof as>;
  let b: ReturnType<typeof as>;
  const today = () => todayJakarta();
  const day = (n: number) => todayJakarta(n);

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

  it('menyediakan library 40+ template dengan rujukan untuk habit ibadah', async () => {
    const res = await a.get('/habit-templates').expect(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(40);
    expect(res.body.items).toContainEqual(
      expect.objectContaining({
        id: 'sholat-dhuha',
        category: 'ibadah',
        reference: 'HR. Muslim no. 720',
      }),
    );
  });

  it('membuat habit dari template atau nama sendiri', async () => {
    const fromTpl = await a.post('/habits', { templateId: 'dzikir-pagi' }).expect(201);
    expect(fromTpl.body).toMatchObject({
      name: 'Dzikir pagi',
      templateId: 'dzikir-pagi',
      startDate: today(),
      logs: [],
    });
    const custom = await a.post('/habits', { name: 'Hafalan 3 ayat', color: 'violet' }).expect(201);
    expect(custom.body).toMatchObject({ templateId: null, position: fromTpl.body.position + 1 });
    const missing = await a.post('/habits', { templateId: 'tidak-ada' }).expect(404);
    expect(missing.body.code).toBe(ErrorCode.HABIT_TEMPLATE_NOT_FOUND);
    await a.post('/habits', {}).expect(400);
  });

  it('PUT log idempoten dan dapat dibatalkan', async () => {
    const h = await a.post('/habits', { name: 'Tilawah', startDate: day(-6) }).expect(201);
    const url = `/habits/${h.body.id}/logs/${today()}`;
    await a.put(url, { done: true }).expect(200, { habitId: h.body.id, date: today(), done: true });
    await a.put(url, { done: true }).expect(200);
    await a.put(`/habits/${h.body.id}/logs/${day(-1)}`, { done: true }).expect(200);
    expect(await ctx.prisma.habitLog.count({ where: { habitId: h.body.id } })).toBe(2);

    const list = await a.get('/habits').expect(200);
    expect(list.body.items[0].logs).toEqual([day(-1), today()]);

    await a.put(url, { done: false }).expect(200);
    await a.put(url, { done: false }).expect(200);
    expect((await a.get('/habits')).body.items[0].logs).toEqual([day(-1)]);
  });

  it('menolak log untuk tanggal mendatang atau sebelum tanggal mulai', async () => {
    const h = await a.post('/habits', { name: 'Olahraga' }).expect(201);
    const future = await a.put(`/habits/${h.body.id}/logs/${day(1)}`, { done: true }).expect(422);
    expect(future.body.code).toBe(ErrorCode.HABIT_LOG_FUTURE_DATE);
    const before = await a.put(`/habits/${h.body.id}/logs/${day(-1)}`, { done: true }).expect(422);
    expect(before.body.code).toBe(ErrorCode.HABIT_LOG_BEFORE_START);
    await a.put(`/habits/${h.body.id}/logs/2026-02-30`, { done: true }).expect(400);
  });

  it('menonaktifkan habit menyembunyikannya dari daftar dan insight', async () => {
    const h = await a.post('/habits', { name: 'Lama' }).expect(201);
    await a.patch(`/habits/${h.body.id}`, { active: false }).expect(200);
    expect((await a.get('/habits')).body.items).toHaveLength(0);
    expect((await a.get('/habits?includeInactive=true')).body.items).toHaveLength(1);
    expect((await a.get('/habits/insights')).body.habits).toHaveLength(0);
  });

  it('menghitung insight dari log', async () => {
    const h = await a.post('/habits', { name: 'Dhuha', startDate: day(-9) }).expect(201);
    for (const n of [-9, -8, -7, -5, -1, 0]) {
      await a.put(`/habits/${h.body.id}/logs/${day(n)}`, { done: true }).expect(200);
    }
    const res = await a.get(`/habits/insights?from=${day(-9)}&to=${today()}`).expect(200);
    expect(res.body).toMatchObject({ from: day(-9), to: today() });
    expect(res.body.habits[0]).toMatchObject({
      habitId: h.body.id,
      name: 'Dhuha',
      checkIns: 6,
      bestStreak: 3,
      currentStreak: 2,
      activeDays: 10,
      consistency: 60,
      projectedNextWeek: 4,
    });
    expect(res.body.summary).toMatchObject({ checkIns: 6, bestStreak: 3, consistency: 60 });
    await a.get(`/habits/insights?from=${today()}&to=${day(-3)}`).expect(400);
  });

  it('pengguna B tidak bisa mengubah, mencentang, atau melihat habit pengguna A', async () => {
    const h = await a.post('/habits', { name: 'Milik A' }).expect(201);
    const denied = await b.put(`/habits/${h.body.id}/logs/${today()}`, { done: true }).expect(404);
    expect(denied.body.code).toBe(ErrorCode.HABIT_NOT_FOUND);
    await b.patch(`/habits/${h.body.id}`, { name: 'x' }).expect(404);
    await b.delete(`/habits/${h.body.id}`).expect(404);
    expect((await b.get('/habits')).body.items).toEqual([]);
    expect((await b.get('/habits/insights')).body.habits).toEqual([]);
    expect(await ctx.prisma.habitLog.count()).toBe(0);
  });
});
