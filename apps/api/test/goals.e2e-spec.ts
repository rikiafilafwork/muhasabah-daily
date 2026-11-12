import { ErrorCode } from '@muhasabah/shared';
import {
  as,
  createTestApp,
  registerUser,
  resetData,
  todayJakarta,
  type TestContext,
} from './helpers';

describe('Goals (integrasi)', () => {
  let ctx: TestContext;
  let a: ReturnType<typeof as>;
  let b: ReturnType<typeof as>;
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

  async function habitWithLogs(client: typeof a, name: string, offsets: number[]) {
    const h = await client.post('/habits', { name, startDate: day(-30) }).expect(201);
    for (const n of offsets)
      await client.put(`/habits/${h.body.id}/logs/${day(n)}`, { done: true }).expect(200);
    return h.body.id as string;
  }

  it('menghitung progres dari nilai manual dan log habit tertaut sejak tanggal mulai', async () => {
    const tilawah = await habitWithLogs(a, 'Tilawah', [-10, -2, -1, 0]);
    const murajaah = await habitWithLogs(a, 'Murajaah', [-1, 0]);

    const g = await a
      .post('/goals', {
        title: 'Khatam 30 juz',
        target: 30,
        unit: 'juz',
        manualValue: 5,
        startDate: day(-3),
        habits: [{ habitId: tilawah, weight: 2 }, { habitId: murajaah }],
      })
      .expect(201);

    // Tilawah: 3 log sejak -3 (log -10 tidak dihitung) × 2 = 6; Murajaah: 2 × 1 = 2.
    expect(g.body.progress).toEqual({
      manual: 5,
      fromHabits: 8,
      total: 13,
      percent: 43,
      achieved: false,
    });
    expect(g.body.habits).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ habitId: tilawah, weight: 2, doneCount: 3, contribution: 6 }),
        expect.objectContaining({ habitId: murajaah, weight: 1, doneCount: 2, contribution: 2 }),
      ]),
    );

    const capped = await a.patch(`/goals/${g.body.id}`, { manualValue: 100 }).expect(200);
    expect(capped.body.progress).toMatchObject({ total: 30, percent: 100, achieved: true });
  });

  it('mengganti tautan habit dan menghapus goal', async () => {
    const h1 = await habitWithLogs(a, 'H1', [0]);
    const h2 = await habitWithLogs(a, 'H2', [0]);
    const g = await a
      .post('/goals', { title: 'G', target: 10, habits: [{ habitId: h1 }] })
      .expect(201);
    const res = await a
      .put(`/goals/${g.body.id}/habits`, { habits: [{ habitId: h2, weight: 3 }] })
      .expect(200);
    expect(res.body.habits).toEqual([
      expect.objectContaining({ habitId: h2, weight: 3, contribution: 3 }),
    ]);
    await a.put(`/goals/${g.body.id}/habits`, { habits: [] }).expect(200);
    await a
      .put(`/goals/${g.body.id}/habits`, { habits: [{ habitId: h1 }, { habitId: h1 }] })
      .expect(400);

    await a.delete(`/goals/${g.body.id}`).expect(204);
    expect((await a.get(`/goals/${g.body.id}`).expect(404)).body.code).toBe(
      ErrorCode.GOAL_NOT_FOUND,
    );
    expect(await ctx.prisma.habit.count({ where: { id: h1 } })).toBe(1);
  });

  it('menghapus habit melepas tautannya dari goal', async () => {
    const h = await habitWithLogs(a, 'H', [0]);
    const g = await a
      .post('/goals', { title: 'G', target: 10, habits: [{ habitId: h }] })
      .expect(201);
    await a.delete(`/habits/${h}`).expect(204);
    const after = await a.get(`/goals/${g.body.id}`).expect(200);
    expect(after.body.habits).toEqual([]);
    expect(after.body.progress.fromHabits).toBe(0);
  });

  it('pengguna B tidak bisa menautkan habit milik A atau mengakses goal A', async () => {
    const habitA = await habitWithLogs(a, 'Milik A', [0]);
    const goalA = await a.post('/goals', { title: 'Goal A', target: 5 }).expect(201);

    const create = await b
      .post('/goals', { title: 'Curang', target: 5, habits: [{ habitId: habitA }] })
      .expect(404);
    expect(create.body.code).toBe(ErrorCode.HABIT_NOT_FOUND);
    const goalB = await b.post('/goals', { title: 'Goal B', target: 5 }).expect(201);
    await b.put(`/goals/${goalB.body.id}/habits`, { habits: [{ habitId: habitA }] }).expect(404);

    await b.get(`/goals/${goalA.body.id}`).expect(404);
    await b.patch(`/goals/${goalA.body.id}`, { title: 'x' }).expect(404);
    await b.put(`/goals/${goalA.body.id}/habits`, { habits: [] }).expect(404);
    await b.delete(`/goals/${goalA.body.id}`).expect(404);
    expect((await b.get('/goals')).body.items.map((g: { title: string }) => g.title)).toEqual([
      'Goal B',
    ]);
  });
});
