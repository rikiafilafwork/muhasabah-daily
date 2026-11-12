import request from 'supertest';
import { ErrorCode } from '@muhasabah/shared';
import { createTestApp, P, registerUser, resetData, type TestContext } from './helpers';

describe('Profil dan kepemilikan data (integrasi)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  beforeEach(async () => {
    await resetData(ctx);
  });

  it('GET /me mengembalikan profil milik token', async () => {
    const a = await registerUser(ctx.app, { name: 'Ali' });
    const res = await http()
      .get(`${P}/me`)
      .set('Authorization', `Bearer ${a.accessToken}`)
      .expect(200);
    expect(res.body).toMatchObject({ id: a.user.id, name: 'Ali', latitude: null, theme: 'system' });
  });

  it('PATCH /me memperbarui lokasi, zona waktu, dan tema', async () => {
    const a = await registerUser(ctx.app);
    const res = await http()
      .patch(`${P}/me`)
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({
        latitude: -6.2,
        longitude: 106.8167,
        city: 'Jakarta',
        timezone: 'Asia/Makassar',
        theme: 'dark',
      })
      .expect(200);
    expect(res.body).toMatchObject({
      latitude: -6.2,
      city: 'Jakarta',
      timezone: 'Asia/Makassar',
      theme: 'dark',
    });
  });

  it('PATCH /me menolak field asing seperti id, userId, email, passwordHash', async () => {
    const a = await registerUser(ctx.app);
    for (const body of [
      { id: 'x' },
      { userId: 'x' },
      { email: 'b@example.com' },
      { passwordHash: 'x' },
    ]) {
      const res = await http()
        .patch(`${P}/me`)
        .set('Authorization', `Bearer ${a.accessToken}`)
        .send(body)
        .expect(400);
      expect(res.body.code).toBe(ErrorCode.VALIDATION_FAILED);
    }
  });

  it('pengguna A tidak bisa membaca atau mengubah data pengguna B', async () => {
    const a = await registerUser(ctx.app, { name: 'A' });
    const b = await registerUser(ctx.app, { name: 'B' });

    // Tidak ada cara menyebut userId lain: endpoint hanya memakai id dari token.
    const readA = await http()
      .get(`${P}/me`)
      .set('Authorization', `Bearer ${a.accessToken}`)
      .expect(200);
    expect(readA.body.id).toBe(a.user.id);
    expect(readA.body.id).not.toBe(b.user.id);

    await http()
      .patch(`${P}/me`)
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ name: 'Diubah A' })
      .expect(200);
    const readB = await http()
      .get(`${P}/me`)
      .set('Authorization', `Bearer ${b.accessToken}`)
      .expect(200);
    expect(readB.body.name).toBe('B');

    await http()
      .get(`${P}/me?userId=${b.user.id}`)
      .set('Authorization', `Bearer ${a.accessToken}`)
      .expect(200)
      .expect((res) => expect(res.body.id).toBe(a.user.id));
  });

  it('DELETE /me menghapus akun beserta token (cascade)', async () => {
    const a = await registerUser(ctx.app);
    await http().delete(`${P}/me`).set('Authorization', `Bearer ${a.accessToken}`).expect(204);
    expect(await ctx.prisma.user.count({ where: { id: a.user.id } })).toBe(0);
    expect(await ctx.prisma.refreshToken.count({ where: { userId: a.user.id } })).toBe(0);
    const res = await http()
      .get(`${P}/me`)
      .set('Authorization', `Bearer ${a.accessToken}`)
      .expect(404);
    expect(res.body.code).toBe(ErrorCode.USER_NOT_FOUND);
  });
});
