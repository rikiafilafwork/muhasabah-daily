import request from 'supertest';
import { ErrorCode } from '@muhasabah/shared';
import {
  createTestApp,
  P,
  refreshCookieFrom,
  registerUser,
  resetData,
  type TestContext,
} from './helpers';

describe('Auth (integrasi)', () => {
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

  it('mendaftar, mengembalikan access token dan cookie refresh httpOnly', async () => {
    const res = await http()
      .post(`${P}/auth/register`)
      .send({ name: 'Aisyah', email: 'Aisyah@Example.com', password: 'rahasia-sekali' })
      .expect(201);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: 'aisyah@example.com', timezone: 'Asia/Jakarta' });
    expect(res.body.user.passwordHash).toBeUndefined();
    const cookie = ([] as string[]).concat(res.headers['set-cookie'] ?? []).join(';');
    expect(cookie).toMatch(/rt=.+HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/);

    const stored = await ctx.prisma.user.findUniqueOrThrow({
      where: { email: 'aisyah@example.com' },
    });
    expect(stored.passwordHash).toMatch(/^\$argon2id\$/);
    const token = await ctx.prisma.refreshToken.findFirstOrThrow({ where: { userId: stored.id } });
    expect(token.tokenHash).not.toContain(refreshCookieFrom(res.headers['set-cookie']).slice(3));
  });

  it('menolak email yang sudah terdaftar', async () => {
    await registerUser(ctx.app, { email: 'sama@example.com' });
    const res = await http()
      .post(`${P}/auth/register`)
      .send({ name: 'B', email: 'sama@example.com', password: 'rahasia-sekali' })
      .expect(409);
    expect(res.body).toMatchObject({ statusCode: 409, code: ErrorCode.EMAIL_TAKEN });
  });

  it('menolak input tidak valid dan field asing', async () => {
    const res = await http()
      .post(`${P}/auth/register`)
      .send({ name: 'B', email: 'bukan-email', password: 'pendek', isAdmin: true })
      .expect(400);
    expect(res.body.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(res.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'email' })]),
    );
  });

  it('masuk dengan kredensial benar dan menolak yang salah', async () => {
    const u = await registerUser(ctx.app);
    await http()
      .post(`${P}/auth/login`)
      .send({ email: u.user.email, password: u.password })
      .expect(200);
    const bad = await http()
      .post(`${P}/auth/login`)
      .send({ email: u.user.email, password: 'salah-salah' })
      .expect(401);
    expect(bad.body.code).toBe(ErrorCode.INVALID_CREDENTIALS);
    const unknown = await http()
      .post(`${P}/auth/login`)
      .send({ email: 'tidak-ada@example.com', password: 'apa-saja' })
      .expect(401);
    expect(unknown.body.code).toBe(ErrorCode.INVALID_CREDENTIALS);
  });

  it('endpoint terlindungi butuh token valid', async () => {
    const res = await http().get(`${P}/me`).expect(401);
    expect(res.body.code).toBe(ErrorCode.UNAUTHORIZED);
    await http().get(`${P}/me`).set('Authorization', 'Bearer palsu').expect(401);
  });

  describe('rotasi refresh token', () => {
    it('merotasi token setiap refresh', async () => {
      const u = await registerUser(ctx.app);
      const r1 = await http().post(`${P}/auth/refresh`).set('Cookie', u.cookie).expect(200);
      const c1 = refreshCookieFrom(r1.headers['set-cookie']);
      expect(c1).not.toBe(u.cookie);
      expect(r1.body.accessToken).toEqual(expect.any(String));

      const r2 = await http().post(`${P}/auth/refresh`).set('Cookie', c1).expect(200);
      expect(refreshCookieFrom(r2.headers['set-cookie'])).not.toBe(c1);
    });

    it('pemakaian ulang token lama mencabut seluruh keluarga token', async () => {
      const u = await registerUser(ctx.app);
      const r1 = await http().post(`${P}/auth/refresh`).set('Cookie', u.cookie).expect(200);
      const c1 = refreshCookieFrom(r1.headers['set-cookie']);

      // Penyerang memakai token awal yang sudah dirotasi.
      const reuse = await http().post(`${P}/auth/refresh`).set('Cookie', u.cookie).expect(401);
      expect(reuse.body.code).toBe(ErrorCode.REFRESH_TOKEN_REUSED);

      // Token terbaru milik pengguna sah pun ikut dicabut.
      const after = await http().post(`${P}/auth/refresh`).set('Cookie', c1).expect(401);
      expect(after.body.code).toBe(ErrorCode.REFRESH_TOKEN_REUSED);

      const active = await ctx.prisma.refreshToken.count({
        where: { userId: u.user.id, revokedAt: null },
      });
      expect(active).toBe(0);
    });

    it('pencabutan keluarga tidak memengaruhi sesi lain milik pengguna', async () => {
      const u = await registerUser(ctx.app);
      const login = await http()
        .post(`${P}/auth/login`)
        .send({ email: u.user.email, password: u.password })
        .expect(200);
      const otherSession = refreshCookieFrom(login.headers['set-cookie']);

      await http().post(`${P}/auth/refresh`).set('Cookie', u.cookie).expect(200);
      await http().post(`${P}/auth/refresh`).set('Cookie', u.cookie).expect(401);

      await http().post(`${P}/auth/refresh`).set('Cookie', otherSession).expect(200);
    });

    it('menolak refresh tanpa cookie, token tak dikenal, dan token kedaluwarsa', async () => {
      const none = await http().post(`${P}/auth/refresh`).expect(401);
      expect(none.body.code).toBe(ErrorCode.REFRESH_TOKEN_MISSING);
      const bogus = await http().post(`${P}/auth/refresh`).set('Cookie', 'rt=bogus').expect(401);
      expect(bogus.body.code).toBe(ErrorCode.REFRESH_TOKEN_INVALID);

      const u = await registerUser(ctx.app);
      await ctx.prisma.refreshToken.updateMany({
        where: { userId: u.user.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      const expired = await http().post(`${P}/auth/refresh`).set('Cookie', u.cookie).expect(401);
      expect(expired.body.code).toBe(ErrorCode.REFRESH_TOKEN_INVALID);
    });

    it('keluar mencabut token dan menghapus cookie', async () => {
      const u = await registerUser(ctx.app);
      const res = await http().post(`${P}/auth/logout`).set('Cookie', u.cookie).expect(204);
      expect(([] as string[]).concat(res.headers['set-cookie'] ?? []).join(';')).toMatch(/rt=;/);
      await http().post(`${P}/auth/refresh`).set('Cookie', u.cookie).expect(401);
    });
  });
});

describe('Rate limit auth', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp({ throttle: true });
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it('membatasi percobaan login', async () => {
    const http = request(ctx.app.getHttpServer());
    let last = 0;
    for (let i = 0; i < 11; i++) {
      const res = await http
        .post(`${P}/auth/login`)
        .send({ email: 'x@example.com', password: 'salah' });
      last = res.status;
      if (i === 10) expect(res.body.code).toBe(ErrorCode.TOO_MANY_REQUESTS);
    }
    expect(last).toBe(429);
  });
});
