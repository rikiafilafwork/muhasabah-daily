import { ErrorCode } from '@muhasabah/shared';
import { as, createTestApp, registerUser, resetData, type TestContext } from './helpers';

describe('Jadwal / events (integrasi)', () => {
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

  const kajian = {
    title: 'Kajian Ahad',
    location: 'Masjid Raya',
    startAt: '2026-11-15T01:00:00.000Z',
    endAt: '2026-11-15T03:00:00.000Z',
  };

  it('membuat, membaca, mengubah, dan menghapus event', async () => {
    const created = await a.post('/events', kajian).expect(201);
    expect(created.body).toMatchObject({
      ...kajian,
      allDay: false,
      color: 'emerald',
      description: null,
    });
    const id = created.body.id;

    await a.get(`/events/${id}`).expect(200);
    const updated = await a
      .patch(`/events/${id}`, { title: 'Kajian Tafsir', color: 'violet' })
      .expect(200);
    expect(updated.body).toMatchObject({
      title: 'Kajian Tafsir',
      color: 'violet',
      location: 'Masjid Raya',
    });

    await a.delete(`/events/${id}`).expect(204);
    const gone = await a.get(`/events/${id}`).expect(404);
    expect(gone.body.code).toBe(ErrorCode.EVENT_NOT_FOUND);
  });

  it('mengembalikan event yang beririsan dengan rentang', async () => {
    await a.post('/events', kajian).expect(201);
    await a
      .post('/events', {
        ...kajian,
        title: 'Lintas hari',
        startAt: '2026-11-14T20:00:00Z',
        endAt: '2026-11-15T00:30:00Z',
      })
      .expect(201);
    await a
      .post('/events', {
        ...kajian,
        title: 'Minggu depan',
        startAt: '2026-11-22T01:00:00Z',
        endAt: '2026-11-22T02:00:00Z',
      })
      .expect(201);

    const res = await a
      .get('/events?from=2026-11-15T00:00:00Z&to=2026-11-16T00:00:00Z')
      .expect(200);
    expect(res.body.items.map((e: { title: string }) => e.title)).toEqual([
      'Lintas hari',
      'Kajian Ahad',
    ]);
    expect(res.body.nextCursor).toBeNull();
  });

  it('memvalidasi waktu dan rentang', async () => {
    await a.post('/events', { ...kajian, endAt: '2026-11-15T00:00:00Z' }).expect(400);
    const { body } = await a.post('/events', kajian).expect(201);
    const bad = await a.patch(`/events/${body.id}`, { endAt: '2026-11-14T00:00:00Z' }).expect(400);
    expect(bad.body.code).toBe(ErrorCode.VALIDATION_FAILED);
    await a.get('/events?from=2026-01-01T00:00:00Z&to=2026-12-31T00:00:00Z').expect(400);
    await a.get('/events').expect(400);
  });

  it('pengguna B tidak bisa melihat, mengubah, atau menghapus event pengguna A', async () => {
    const { body } = await a.post('/events', kajian).expect(201);
    await b.get(`/events/${body.id}`).expect(404);
    await b.patch(`/events/${body.id}`, { title: 'diretas' }).expect(404);
    await b.delete(`/events/${body.id}`).expect(404);
    const list = await b
      .get('/events?from=2026-11-01T00:00:00Z&to=2026-12-01T00:00:00Z')
      .expect(200);
    expect(list.body.items).toEqual([]);
    const still = await a.get(`/events/${body.id}`).expect(200);
    expect(still.body.title).toBe('Kajian Ahad');
  });
});
