import { ErrorCode } from '@muhasabah/shared';
import { as, createTestApp, registerUser, resetData, type TestContext } from './helpers';

describe('Catatan kajian (integrasi)', () => {
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

  const content = {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Tauhid adalah pondasi.' }] },
      { type: 'ayahRef', attrs: { surahId: 112, from: 1, to: 4 } },
    ],
  };
  const note = {
    title: 'Kajian Tauhid',
    speaker: 'Ustadz Fulan',
    date: '2026-11-10',
    tags: ['Aqidah', 'aqidah'],
    content,
  };

  it('membuat, mencari, mengubah, dan menghapus catatan', async () => {
    const created = await a.post('/lecture-notes', note).expect(201);
    expect(created.body).toMatchObject({
      title: 'Kajian Tauhid',
      tags: ['aqidah'],
      preview: 'Tauhid adalah pondasi.',
      ayahRefs: [{ surahId: 112, from: 1, to: 4 }],
      content,
    });
    const id = created.body.id;
    expect((await a.get('/lecture-notes?q=pondasi').expect(200)).body.items).toHaveLength(1);
    expect((await a.get('/lecture-notes?q=fulan').expect(200)).body.items).toHaveLength(1);
    expect((await a.get('/lecture-notes?q=fiqih').expect(200)).body.items).toHaveLength(0);

    const updated = await a
      .patch(`/lecture-notes/${id}`, {
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Revisi.' }] }],
        },
      })
      .expect(200);
    expect(updated.body).toMatchObject({
      preview: 'Revisi.',
      ayahRefs: [],
      title: 'Kajian Tauhid',
    });

    await a.delete(`/lecture-notes/${id}`).expect(204);
    expect((await a.get(`/lecture-notes/${id}`).expect(404)).body.code).toBe(
      ErrorCode.LECTURE_NOTE_NOT_FOUND,
    );
  });

  it('menolak dokumen yang bukan format editor', async () => {
    await a.post('/lecture-notes', { ...note, content: '<script>alert(1)</script>' }).expect(400);
    await a
      .post('/lecture-notes', {
        ...note,
        content: { type: 'doc', content: [{ type: 'p', onload: 'x' }] },
      })
      .expect(400);
  });

  it('paginasi kursor', async () => {
    for (let i = 1; i <= 3; i++)
      await a
        .post('/lecture-notes', { ...note, title: `K${i}`, date: `2026-11-0${i}` })
        .expect(201);
    const p1 = await a.get('/lecture-notes?limit=2').expect(200);
    expect(p1.body.items.map((n: { title: string }) => n.title)).toEqual(['K3', 'K2']);
    const p2 = await a.get(`/lecture-notes?limit=2&cursor=${p1.body.nextCursor}`).expect(200);
    expect(p2.body.items.map((n: { title: string }) => n.title)).toEqual(['K1']);
    expect(p2.body.nextCursor).toBeNull();
  });

  it('pengguna B tidak bisa mengakses catatan A', async () => {
    const { body } = await a.post('/lecture-notes', note).expect(201);
    await b.get(`/lecture-notes/${body.id}`).expect(404);
    await b.patch(`/lecture-notes/${body.id}`, { title: 'x' }).expect(404);
    await b.delete(`/lecture-notes/${body.id}`).expect(404);
    expect((await b.get('/lecture-notes')).body.items).toEqual([]);
    expect((await b.get(`/lecture-notes?cursor=${body.id}`).expect(400)).body.code).toBe(
      ErrorCode.INVALID_CURSOR,
    );
  });
});
