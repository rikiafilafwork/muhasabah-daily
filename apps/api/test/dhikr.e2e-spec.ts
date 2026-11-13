import { ErrorCode } from '@muhasabah/shared';
import {
  as,
  createTestApp,
  registerUser,
  resetData,
  todayJakarta,
  type TestContext,
} from './helpers';

describe('Dzikir (integrasi)', () => {
  let ctx: TestContext;
  let a: ReturnType<typeof as>;
  let b: ReturnType<typeof as>;
  const today = () => todayJakarta();

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

  it('menyajikan konten per grup lengkap dengan rujukan dan hitungan 0', async () => {
    const res = await a.get('/dhikr?group=pagi').expect(200);
    expect(res.body).toMatchObject({ group: 'pagi', date: today(), nextCursor: null });
    expect(res.body.items.length).toBeGreaterThanOrEqual(10);
    expect(res.body.items[0]).toMatchObject({ id: 'pagi-ayat-kursi', count: 0, repeat: 1 });
    for (const item of res.body.items) expect(item.reference).toEqual(expect.any(String));
    await a.get('/dhikr?group=siang').expect(400);
  });

  it('PUT menetapkan hitungan secara idempoten dan 0 menghapusnya', async () => {
    const url = `/dhikr/pagi-subhanallah-wabihamdihi/logs/${today()}`;
    await a
      .put(url, { count: 40 })
      .expect(200, { dhikrId: 'pagi-subhanallah-wabihamdihi', date: today(), count: 40 });
    await a.put(url, { count: 40 }).expect(200);
    await a.put(url, { count: 100 }).expect(200);
    const item = (await a.get('/dhikr?group=pagi')).body.items.find(
      (i: { id: string }) => i.id === 'pagi-subhanallah-wabihamdihi',
    );
    expect(item.count).toBe(100);
    expect(await ctx.prisma.dhikrLog.count()).toBe(1);

    await a.put(url, { count: 0 }).expect(200);
    expect(await ctx.prisma.dhikrLog.count()).toBe(0);
  });

  it('hitungan terpisah per tanggal dan ringkasan menghitung yang tuntas', async () => {
    await a.put(`/dhikr/pagi-ayat-kursi/logs/${today()}`, { count: 1 }).expect(200);
    await a.put(`/dhikr/pagi-al-ikhlas/logs/${today()}`, { count: 2 }).expect(200);
    await a.put(`/dhikr/petang-al-ikhlas/logs/${today()}`, { count: 3 }).expect(200);
    await a.put(`/dhikr/pagi-ayat-kursi/logs/${todayJakarta(-1)}`, { count: 1 }).expect(200);

    const sum = await a.get('/dhikr/summary').expect(200);
    const pagi = sum.body.groups.find((g: { group: string }) => g.group === 'pagi');
    const petang = sum.body.groups.find((g: { group: string }) => g.group === 'petang');
    expect(pagi.completed).toBe(1); // Ikhlas baru 2 dari 3
    expect(petang.completed).toBe(1);

    const yesterday = await a.get(`/dhikr?group=pagi&date=${todayJakarta(-1)}`).expect(200);
    expect(yesterday.body.items[0].count).toBe(1);
    expect(yesterday.body.items[1].count).toBe(0);
  });

  it('menolak tanggal mendatang, dzikir tak dikenal, dan hitungan tidak valid', async () => {
    const future = await a
      .put(`/dhikr/pagi-ayat-kursi/logs/${todayJakarta(1)}`, { count: 1 })
      .expect(422);
    expect(future.body.code).toBe(ErrorCode.DHIKR_LOG_FUTURE_DATE);
    const missing = await a.put(`/dhikr/pagi-tidak-ada/logs/${today()}`, { count: 1 }).expect(404);
    expect(missing.body.code).toBe(ErrorCode.DHIKR_NOT_FOUND);
    await a.put(`/dhikr/pagi-ayat-kursi/logs/${today()}`, { count: -1 }).expect(400);
    await a.put(`/dhikr/pagi-ayat-kursi/logs/${today()}`, { count: 1, userId: 'x' }).expect(400);
  });

  it('hitungan pengguna A tidak terlihat oleh pengguna B', async () => {
    await a.put(`/dhikr/pagi-ayat-kursi/logs/${today()}`, { count: 1 }).expect(200);
    const res = await b.get('/dhikr?group=pagi').expect(200);
    expect(res.body.items[0].count).toBe(0);
    const sum = await b.get('/dhikr/summary').expect(200);
    expect(sum.body.groups.every((g: { completed: number }) => g.completed === 0)).toBe(true);
  });
});
