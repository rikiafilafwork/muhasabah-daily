import { ErrorCode } from '@muhasabah/shared';
import {
  as,
  createTestApp,
  registerUser,
  resetData,
  todayJakarta,
  type TestContext,
} from './helpers';

describe('Proyek dan tugas (integrasi)', () => {
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

  const titles = (res: { body: { items: { title: string }[] } }) =>
    res.body.items.map((t) => t.title);

  it('CRUD proyek dengan jumlah tugas terbuka', async () => {
    const p = await a.post('/projects', { name: 'Skripsi' }).expect(201);
    expect(p.body).toMatchObject({
      name: 'Skripsi',
      color: 'sky',
      openTaskCount: 0,
      archived: false,
    });
    await a.post('/tasks', { title: 'Bab 1', projectId: p.body.id }).expect(201);
    const done = await a.post('/tasks', { title: 'Judul', projectId: p.body.id }).expect(201);
    await a.patch(`/tasks/${done.body.id}`, { completed: true }).expect(200);

    const list = await a.get('/projects').expect(200);
    expect(list.body.items[0].openTaskCount).toBe(1);

    await a.patch(`/projects/${p.body.id}`, { archived: true }).expect(200);
    expect((await a.get('/projects').expect(200)).body.items).toHaveLength(0);
    expect((await a.get('/projects?includeArchived=true').expect(200)).body.items).toHaveLength(1);
  });

  it('menghapus proyek memindahkan tugasnya ke Inbox', async () => {
    const p = await a.post('/projects', { name: 'Sementara' }).expect(201);
    const t = await a.post('/tasks', { title: 'Tetap ada', projectId: p.body.id }).expect(201);
    await a.delete(`/projects/${p.body.id}`).expect(204);
    const task = await a.get(`/tasks/${t.body.id}`).expect(200);
    expect(task.body.projectId).toBeNull();
    expect(titles(await a.get('/tasks?projectId=none'))).toEqual(['Tetap ada']);
  });

  it('menandai selesai dan fokus hari ini', async () => {
    const t = await a
      .post('/tasks', { title: 'Murajaah', priority: 'high', focusToday: true })
      .expect(201);
    expect(t.body).toMatchObject({ focusToday: true, completed: false, priority: 'high' });

    const done = await a.patch(`/tasks/${t.body.id}`, { completed: true }).expect(200);
    expect(done.body.completed).toBe(true);
    expect(done.body.completedAt).toEqual(expect.any(String));
    const again = await a.patch(`/tasks/${t.body.id}`, { completed: true }).expect(200);
    expect(again.body.completedAt).toBe(done.body.completedAt);

    const reopened = await a
      .patch(`/tasks/${t.body.id}`, { completed: false, focusToday: false })
      .expect(200);
    expect(reopened.body).toMatchObject({ completed: false, completedAt: null, focusToday: false });
  });

  it('fokus hari ini kedaluwarsa saat tanggal berganti', async () => {
    const t = await a.post('/tasks', { title: 'Kemarin', focusToday: true }).expect(201);
    await ctx.prisma.task.update({
      where: { id: t.body.id },
      data: { focusDate: new Date(`${todayJakarta(-1)}T00:00:00Z`) },
    });
    expect((await a.get(`/tasks/${t.body.id}`)).body.focusToday).toBe(false);
    expect(titles(await a.get('/tasks?focusToday=true'))).toEqual([]);
    expect(titles(await a.get('/tasks?focusToday=false'))).toEqual(['Kemarin']);
  });

  it('memfilter berdasarkan tenggat dan status, dan mengurutkan', async () => {
    const today = todayJakarta();
    await a.post('/tasks', { title: 'Tanpa tenggat' }).expect(201);
    await a.post('/tasks', { title: 'Terlambat', dueDate: todayJakarta(-2) }).expect(201);
    await a
      .post('/tasks', { title: 'Hari ini rendah', dueDate: today, priority: 'low' })
      .expect(201);
    await a
      .post('/tasks', { title: 'Hari ini tinggi', dueDate: today, priority: 'high' })
      .expect(201);
    await a.post('/tasks', { title: 'Besok', dueDate: todayJakarta(1) }).expect(201);
    const fin = await a.post('/tasks', { title: 'Selesai' }).expect(201);
    await a.patch(`/tasks/${fin.body.id}`, { completed: true }).expect(200);

    expect(titles(await a.get('/tasks'))).toEqual([
      'Terlambat',
      'Hari ini tinggi',
      'Hari ini rendah',
      'Besok',
      'Tanpa tenggat',
    ]);
    expect(titles(await a.get('/tasks?due=today'))).toEqual(['Hari ini tinggi', 'Hari ini rendah']);
    expect(titles(await a.get('/tasks?due=overdue'))).toEqual(['Terlambat']);
    expect(titles(await a.get('/tasks?due=upcoming'))).toEqual(['Besok']);
    expect(titles(await a.get('/tasks?due=none'))).toEqual(['Tanpa tenggat']);
    expect(titles(await a.get('/tasks?status=done'))).toEqual(['Selesai']);
    expect((await a.get('/tasks?status=all')).body.items).toHaveLength(6);
  });

  it('paginasi dengan kursor', async () => {
    for (let i = 1; i <= 5; i++) await a.post('/tasks', { title: `T${i}` }).expect(201);
    const p1 = await a.get('/tasks?limit=2').expect(200);
    expect(titles(p1)).toEqual(['T1', 'T2']);
    const p2 = await a.get(`/tasks?limit=2&cursor=${p1.body.nextCursor}`).expect(200);
    expect(titles(p2)).toEqual(['T3', 'T4']);
    const p3 = await a.get(`/tasks?limit=2&cursor=${p2.body.nextCursor}`).expect(200);
    expect(titles(p3)).toEqual(['T5']);
    expect(p3.body.nextCursor).toBeNull();
  });

  it('pengguna B tidak bisa mengakses tugas, proyek, atau kursor milik A', async () => {
    const p = await a.post('/projects', { name: 'Rahasia' }).expect(201);
    const t = await a.post('/tasks', { title: 'Milik A', projectId: p.body.id }).expect(201);

    expect((await b.get(`/tasks/${t.body.id}`).expect(404)).body.code).toBe(
      ErrorCode.TASK_NOT_FOUND,
    );
    await b.patch(`/tasks/${t.body.id}`, { completed: true }).expect(404);
    await b.delete(`/tasks/${t.body.id}`).expect(404);
    await b.patch(`/projects/${p.body.id}`, { name: 'x' }).expect(404);
    await b.delete(`/projects/${p.body.id}`).expect(404);

    // B tidak bisa menaruh tugas di proyek A.
    const intrude = await b.post('/tasks', { title: 'Susup', projectId: p.body.id }).expect(404);
    expect(intrude.body.code).toBe(ErrorCode.PROJECT_NOT_FOUND);
    const own = await b.post('/tasks', { title: 'Milik B' }).expect(201);
    await b.patch(`/tasks/${own.body.id}`, { projectId: p.body.id }).expect(404);

    expect((await b.get(`/tasks?cursor=${t.body.id}`).expect(400)).body.code).toBe(
      ErrorCode.INVALID_CURSOR,
    );
    expect(titles(await b.get(`/tasks?projectId=${p.body.id}`))).toEqual([]);
    expect((await b.get('/projects')).body.items).toEqual([]);
    expect((await a.get(`/tasks/${t.body.id}`)).body.completed).toBe(false);
  });
});
