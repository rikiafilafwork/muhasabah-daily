import { ErrorCode, addMonths } from '@muhasabah/shared';
import {
  as,
  createTestApp,
  registerUser,
  resetData,
  todayJakarta,
  type TestContext,
} from './helpers';

describe('Keuangan (integrasi)', () => {
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

  async function categoryId(client: typeof a, name: string): Promise<string> {
    const res = await client.get('/finance/categories').expect(200);
    const found = (res.body.items as { id: string; name: string }[]).find((c) => c.name === name);
    if (!found) throw new Error(`kategori ${name} tidak ada`);
    return found.id;
  }

  it('membuat kategori bawaan sekali saja', async () => {
    const [r1, r2] = await Promise.all([
      a.get('/finance/categories').expect(200),
      a.get('/finance/categories').expect(200),
    ]);
    expect(r1.body.items.length).toBeGreaterThan(5);
    const again = await a.get('/finance/categories').expect(200);
    expect(again.body.items).toHaveLength(r1.body.items.length);
    expect(r2.body.items.length).toBeLessThanOrEqual(r1.body.items.length);
    const types = new Set(again.body.items.map((c: { type: string }) => c.type));
    expect(types).toEqual(new Set(['income', 'expense']));
  });

  it('CRUD transaksi; jenis mengikuti kategori', async () => {
    const gaji = await categoryId(a, 'Gaji');
    const makan = await categoryId(a, 'Makan');
    const date = todayJakarta();

    const t = await a
      .post('/finance/transactions', { amount: 5_000_000, date, categoryId: gaji, note: 'Bulanan' })
      .expect(201);
    expect(t.body).toMatchObject({
      type: 'income',
      amount: 5_000_000,
      date,
      note: 'Bulanan',
      category: { id: gaji, name: 'Gaji' },
    });

    const moved = await a
      .patch(`/finance/transactions/${t.body.id}`, { categoryId: makan, amount: 25_000 })
      .expect(200);
    expect(moved.body).toMatchObject({ type: 'expense', amount: 25_000 });

    await a.delete(`/finance/transactions/${t.body.id}`).expect(204);
    await a.get(`/finance/transactions/${t.body.id}`).expect(404);
  });

  it('memvalidasi nominal', async () => {
    const makan = await categoryId(a, 'Makan');
    const date = todayJakarta();
    for (const amount of [0, -5, 1.5, 1_000_000_000_000, '1000']) {
      const res = await a.post('/finance/transactions', { amount, date, categoryId: makan });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ErrorCode.VALIDATION_FAILED);
    }
    await a
      .post('/finance/transactions', { amount: 999_999_999_999, date, categoryId: makan })
      .expect(201);
  });

  it('ringkasan bulanan, bulan lalu, dan rincian kategori', async () => {
    const gaji = await categoryId(a, 'Gaji');
    const makan = await categoryId(a, 'Makan');
    const tagihan = await categoryId(a, 'Tagihan');
    const post = (amount: number, date: string, categoryId: string) =>
      a.post('/finance/transactions', { amount, date, categoryId }).expect(201);

    await post(8_000_000, '2026-10-01', gaji);
    await post(50_000, '2026-10-31', makan); // batas akhir bulan lalu
    await post(10_000_000, '2026-11-01', gaji); // batas awal bulan
    await post(30_000, '2026-11-15', makan);
    await post(45_000, '2026-11-30', makan); // batas akhir bulan
    await post(750_000, '2026-11-20', tagihan);
    await post(99_000, '2026-12-01', makan); // bulan depan, tidak dihitung

    const s = await a.get('/finance/summary?month=2026-11').expect(200);
    expect(s.body).toMatchObject({
      month: '2026-11',
      income: 10_000_000,
      expense: 825_000,
      balance: 9_175_000,
      transactionCount: 4,
      previous: { month: '2026-10', income: 8_000_000, expense: 50_000, balance: 7_950_000 },
    });
    expect(
      s.body.byCategory.map((c: { name: string; total: number }) => [c.name, c.total]),
    ).toEqual([
      ['Gaji', 10_000_000],
      ['Tagihan', 750_000],
      ['Makan', 75_000],
    ]);

    const list = await a.get('/finance/transactions?month=2026-11&type=expense').expect(200);
    expect(list.body.items.map((t: { date: string }) => t.date)).toEqual([
      '2026-11-30',
      '2026-11-20',
      '2026-11-15',
    ]);

    const m = await a.get('/finance/monthly?to=2026-12&months=3').expect(200);
    expect(m.body.months).toEqual([
      { month: '2026-10', income: 8_000_000, expense: 50_000, balance: 7_950_000 },
      { month: '2026-11', income: 10_000_000, expense: 825_000, balance: 9_175_000 },
      { month: '2026-12', income: 0, expense: 99_000, balance: -99_000 },
    ]);
  });

  it('bawaan memakai bulan berjalan pengguna dan paginasi kursor', async () => {
    const makan = await categoryId(a, 'Makan');
    const today = todayJakarta();
    for (let i = 0; i < 3; i++) {
      await a
        .post('/finance/transactions', { amount: 1000 + i, date: today, categoryId: makan })
        .expect(201);
    }
    const s = await a.get('/finance/summary').expect(200);
    expect(s.body).toMatchObject({ month: today.slice(0, 7), expense: 3003 });

    const p1 = await a.get('/finance/transactions?limit=2').expect(200);
    expect(p1.body.items).toHaveLength(2);
    const p2 = await a
      .get(`/finance/transactions?limit=2&cursor=${p1.body.nextCursor}`)
      .expect(200);
    expect(p2.body.items).toHaveLength(1);
    expect(p2.body.nextCursor).toBeNull();

    const m = await a.get('/finance/monthly').expect(200);
    expect(m.body.months).toHaveLength(12);
    expect(m.body.months[11].month).toBe(today.slice(0, 7));
    expect(m.body.months[0].month).toBe(addMonths(today.slice(0, 7), -11));
  });

  it('kategori: nama unik, arsip, dan tidak bisa dihapus bila dipakai', async () => {
    await a.get('/finance/categories').expect(200);
    const dup = await a.post('/finance/categories', { type: 'expense', name: 'Makan' });
    expect(dup.status).toBe(409);
    expect(dup.body.code).toBe(ErrorCode.FINANCE_CATEGORY_TAKEN);
    // Nama sama boleh untuk jenis berbeda.
    await a.post('/finance/categories', { type: 'income', name: 'Makan' }).expect(201);

    const kopi = await a
      .post('/finance/categories', { type: 'expense', name: 'Kopi', color: 'amber' })
      .expect(201);
    expect(kopi.body).toMatchObject({ type: 'expense', color: 'amber', transactionCount: 0 });
    await a
      .post('/finance/transactions', {
        amount: 18_000,
        date: todayJakarta(),
        categoryId: kopi.body.id,
      })
      .expect(201);

    const del = await a.delete(`/finance/categories/${kopi.body.id}`);
    expect(del.status).toBe(409);
    expect(del.body.code).toBe(ErrorCode.FINANCE_CATEGORY_IN_USE);

    await a.patch(`/finance/categories/${kopi.body.id}`, { archived: true }).expect(200);
    const active = await a.get('/finance/categories').expect(200);
    expect(active.body.items.some((c: { id: string }) => c.id === kopi.body.id)).toBe(false);
    const all = await a.get('/finance/categories?includeArchived=true').expect(200);
    expect(all.body.items.find((c: { id: string }) => c.id === kopi.body.id)).toMatchObject({
      archived: true,
      transactionCount: 1,
    });

    // Jenis tidak bisa diubah.
    await a.patch(`/finance/categories/${kopi.body.id}`, { type: 'income' }).expect(400);

    const kosong = await a
      .post('/finance/categories', { type: 'income', name: 'Bonus' })
      .expect(201);
    await a.delete(`/finance/categories/${kosong.body.id}`).expect(204);
  });

  it('data milik pengguna lain tidak bisa dibaca atau diubah', async () => {
    const makanA = await categoryId(a, 'Makan');
    const t = await a
      .post('/finance/transactions', { amount: 20_000, date: todayJakarta(), categoryId: makanA })
      .expect(201);

    await b.get(`/finance/transactions/${t.body.id}`).expect(404);
    await b.patch(`/finance/transactions/${t.body.id}`, { amount: 1 }).expect(404);
    await b.delete(`/finance/transactions/${t.body.id}`).expect(404);
    await b.patch(`/finance/categories/${makanA}`, { name: 'Diretas' }).expect(404);
    await b.delete(`/finance/categories/${makanA}`).expect(404);

    // B tidak bisa memakai kategori A.
    const res = await b.post('/finance/transactions', {
      amount: 1000,
      date: todayJakarta(),
      categoryId: makanA,
    });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe(ErrorCode.FINANCE_CATEGORY_NOT_FOUND);

    const sb = await b.get(`/finance/summary?month=${todayJakarta().slice(0, 7)}`).expect(200);
    expect(sb.body).toMatchObject({ income: 0, expense: 0, transactionCount: 0, byCategory: [] });
    expect((await b.get('/finance/transactions').expect(200)).body.items).toHaveLength(0);
    await b.get(`/finance/transactions?cursor=${t.body.id}`).expect(400);
  });

  it('menghapus akun ikut menghapus kategori dan transaksi', async () => {
    const u = await registerUser(ctx.app);
    const c = as(ctx.app, u.accessToken);
    const makan = await categoryId(c, 'Makan');
    await c
      .post('/finance/transactions', { amount: 5000, date: todayJakarta(), categoryId: makan })
      .expect(201);
    await c.delete('/me').expect(204);
    expect(await ctx.prisma.financeTransaction.count({ where: { userId: u.user.id } })).toBe(0);
    expect(await ctx.prisma.financeCategory.count({ where: { userId: u.user.id } })).toBe(0);
  });
});
