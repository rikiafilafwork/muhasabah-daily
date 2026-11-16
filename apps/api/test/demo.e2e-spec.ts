import { DEMO_EMAIL, DEMO_PASSWORD, seedDemo } from '../prisma/seed/demo';
import { as, createTestApp, P, resetData, todayJakarta, type TestContext } from './helpers';
import request from 'supertest';

describe('Data contoh (integrasi)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  beforeEach(async () => {
    await resetData(ctx);
  });

  async function login() {
    const res = await request(ctx.app.getHttpServer())
      .post(`${P}/auth/login`)
      .send({ email: DEMO_EMAIL, password: DEMO_PASSWORD })
      .expect(200);
    return as(ctx.app, res.body.accessToken);
  }

  it('akun demo bisa masuk dan semua modul berisi data', async () => {
    await seedDemo(ctx.prisma);
    const demo = await login();

    const insights = (await demo.get('/habits/insights').expect(200)).body;
    expect(insights.habits).toHaveLength(5);
    expect(insights.summary.checkIns).toBeGreaterThan(40);
    expect(insights.summary.consistency).toBeGreaterThan(40);

    const focusToday = (await demo.get('/tasks?focusToday=true').expect(200)).body.items;
    expect(focusToday.length).toBeGreaterThanOrEqual(3);
    expect((await demo.get('/tasks?due=overdue').expect(200)).body.items.length).toBeGreaterThan(0);

    const goals = (await demo.get('/goals').expect(200)).body.items;
    expect(goals).toHaveLength(3);
    expect(goals.every((g: { progress: { total: number } }) => g.progress.total > 0)).toBe(true);

    const focus = (await demo.get('/focus-sessions?from=' + todayJakarta(-13)).expect(200)).body;
    expect(focus.summary.totalFocusedSeconds).toBeGreaterThan(0);

    const finance = (await demo.get('/finance/summary').expect(200)).body;
    expect(finance.income).toBeGreaterThan(0);
    expect(finance.expense).toBeGreaterThan(0);
    expect(finance.byCategory.length).toBeGreaterThan(2);
    const monthly = (await demo.get('/finance/monthly?months=3').expect(200)).body;
    expect(monthly.months.every((m: { income: number }) => m.income > 0)).toBe(true);
    expect(finance.planned.expense).toBeGreaterThan(0);
    expect(finance.plans.done).toBeGreaterThan(0);
    expect((await demo.get('/finance/template').expect(200)).body.items).toHaveLength(7);

    const dhikr = (await demo.get('/dhikr/summary').expect(200)).body;
    expect(
      dhikr.groups.find((g: { group: string }) => g.group === 'pagi').completed,
    ).toBeGreaterThan(0);

    const today = todayJakarta();
    const events = (
      await demo
        .get(`/events?from=${today}T00:00:00%2B07:00&to=${todayJakarta(1)}T00:00:00%2B07:00`)
        .expect(200)
    ).body.items;
    expect(events.map((e: { title: string }) => e.title)).toEqual([
      'Rapat tim penelitian',
      'Kajian tafsir',
    ]);
  });

  it('bisa dijalankan ulang tanpa duplikasi', async () => {
    await seedDemo(ctx.prisma);
    await seedDemo(ctx.prisma);
    expect(await ctx.prisma.user.count({ where: { email: DEMO_EMAIL } })).toBe(1);
    const demo = await login();
    expect((await demo.get('/goals').expect(200)).body.items).toHaveLength(3);
  });
});
