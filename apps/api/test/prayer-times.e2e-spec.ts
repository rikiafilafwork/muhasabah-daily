import request from 'supertest';
import { ErrorCode } from '@muhasabah/shared';
import { createTestApp, P, registerUser, resetData, type TestContext } from './helpers';

describe('Waktu sholat (integrasi)', () => {
  let ctx: TestContext;
  let token: string;
  const http = () => request(ctx.app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  beforeEach(async () => {
    await resetData(ctx);
    ctx.aladhan.calls = 0;
    ctx.aladhan.fail = false;
    token = (await registerUser(ctx.app)).accessToken;
  });

  const setJakarta = () =>
    http()
      .patch(`${P}/me`)
      .set(auth())
      .send({ latitude: -6.2088, longitude: 106.8456 })
      .expect(200);

  it('422 bila lokasi belum diatur', async () => {
    const res = await http().get(`${P}/prayer-times`).set(auth()).expect(422);
    expect(res.body.code).toBe(ErrorCode.PROFILE_LOCATION_MISSING);
  });

  it('mengambil dari sumber lalu memakai cache', async () => {
    await setJakarta();
    const first = await http().get(`${P}/prayer-times?date=2026-11-11`).set(auth()).expect(200);
    expect(first.body).toMatchObject({ date: '2026-11-11', cached: false, stale: false });
    expect(first.body.timings.fajr).toBe('2026-11-10T21:10:00.000Z');

    const second = await http().get(`${P}/prayer-times?date=2026-11-11`).set(auth()).expect(200);
    expect(second.body.cached).toBe(true);
    expect(ctx.aladhan.calls).toBe(1);
    expect(await ctx.redis.exists('pt:-6.21,106.85:2026-11-11:20')).toBe(1);
    expect(await ctx.redis.ttl('pt:-6.21,106.85:2026-11-11:20')).toBeGreaterThan(0);
  });

  it('pengguna di kota yang sama berbagi cache (koordinat dibulatkan)', async () => {
    await setJakarta();
    await http().get(`${P}/prayer-times?date=2026-11-11`).set(auth()).expect(200);
    const other = await registerUser(ctx.app);
    await http()
      .patch(`${P}/me`)
      .set('Authorization', `Bearer ${other.accessToken}`)
      .send({ latitude: -6.2111, longitude: 106.8499 })
      .expect(200);
    const res = await http()
      .get(`${P}/prayer-times?date=2026-11-11`)
      .set('Authorization', `Bearer ${other.accessToken}`)
      .expect(200);
    expect(res.body.cached).toBe(true);
    expect(ctx.aladhan.calls).toBe(1);
  });

  it('memakai data terakhir (stale) bila sumber gagal', async () => {
    await setJakarta();
    await http().get(`${P}/prayer-times?date=2026-11-11`).set(auth()).expect(200);
    ctx.aladhan.fail = true;
    const res = await http().get(`${P}/prayer-times?date=2026-11-12`).set(auth()).expect(200);
    expect(res.body).toMatchObject({ date: '2026-11-12', stale: true });
    expect(res.body.timings.fajr).toBe('2026-11-11T21:10:00.000Z');
  });

  it('503 PRAYER_TIMES_UNAVAILABLE bila sumber gagal dan tidak ada cache', async () => {
    await setJakarta();
    ctx.aladhan.fail = true;
    const res = await http().get(`${P}/prayer-times?date=2026-11-11`).set(auth()).expect(503);
    expect(res.body.code).toBe(ErrorCode.PRAYER_TIMES_UNAVAILABLE);
  });

  it('memvalidasi parameter tanggal', async () => {
    await setJakarta();
    await http().get(`${P}/prayer-times?date=2026-13-40`).set(auth()).expect(400);
  });

  it('GET /prayer-times/next mengembalikan sholat berikutnya', async () => {
    await setJakarta();
    const res = await http().get(`${P}/prayer-times/next`).set(auth()).expect(200);
    expect(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']).toContain(res.body.prayer);
    expect(Date.parse(res.body.at)).toBeGreaterThan(Date.now());
    expect(res.body.secondsRemaining).toBeGreaterThanOrEqual(0);
  });
});
