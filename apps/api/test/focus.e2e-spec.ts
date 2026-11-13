import { ErrorCode } from '@muhasabah/shared';
import {
  as,
  createTestApp,
  registerUser,
  resetData,
  todayJakarta,
  type TestContext,
} from './helpers';

describe('Sesi fokus (integrasi)', () => {
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

  const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
  const session = (over: object = {}) => ({
    startedAt: minutesAgo(30),
    endedAt: minutesAgo(5),
    plannedSeconds: 1500,
    focusedSeconds: 1500,
    status: 'completed',
    ...over,
  });

  it('mencatat sesi dengan tugas dan menampilkan ringkasan', async () => {
    const task = await a.post('/tasks', { title: 'Tulis bab 2' }).expect(201);
    const s = await a.post('/focus-sessions', session({ taskId: task.body.id })).expect(201);
    expect(s.body).toMatchObject({
      status: 'completed',
      taskTitle: 'Tulis bab 2',
      date: todayJakarta(),
    });
    await a
      .post('/focus-sessions', session({ status: 'cancelled', focusedSeconds: 600 }))
      .expect(201);

    const list = await a.get('/focus-sessions').expect(200);
    expect(list.body.items).toHaveLength(2);
    expect(list.body.summary).toMatchObject({
      totalFocusedSeconds: 2100,
      completedSessions: 1,
      to: todayJakarta(),
    });
    expect(list.body.summary.byDate).toHaveLength(7);
    expect(list.body.summary.byDate.at(-1)).toEqual({ date: todayJakarta(), focusedSeconds: 2100 });
  });

  it('menolak data tidak masuk akal', async () => {
    await a.post('/focus-sessions', session({ focusedSeconds: 9999 })).expect(400);
    await a.post('/focus-sessions', session({ endedAt: minutesAgo(60) })).expect(400);
    await a.post('/focus-sessions', session({ status: 'paused' })).expect(400);
  });

  it('menghapus tugas tidak menghapus riwayat sesi', async () => {
    const task = await a.post('/tasks', { title: 'Sementara' }).expect(201);
    await a.post('/focus-sessions', session({ taskId: task.body.id })).expect(201);
    await a.delete(`/tasks/${task.body.id}`).expect(204);
    const list = await a.get('/focus-sessions').expect(200);
    expect(list.body.items[0]).toMatchObject({ taskId: null, taskTitle: null });
  });

  it('pengguna B tidak bisa memakai tugas A, melihat, atau menghapus sesi A', async () => {
    const task = await a.post('/tasks', { title: 'Milik A' }).expect(201);
    const denied = await b.post('/focus-sessions', session({ taskId: task.body.id })).expect(404);
    expect(denied.body.code).toBe(ErrorCode.TASK_NOT_FOUND);

    const s = await a.post('/focus-sessions', session()).expect(201);
    expect((await b.get('/focus-sessions')).body.items).toEqual([]);
    const del = await b.delete(`/focus-sessions/${s.body.id}`).expect(404);
    expect(del.body.code).toBe(ErrorCode.FOCUS_SESSION_NOT_FOUND);
    expect((await a.get('/focus-sessions')).body.items).toHaveLength(1);
  });
});
