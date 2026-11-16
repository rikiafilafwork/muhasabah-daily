import { ErrorCode } from '@muhasabah/shared';
import {
  as,
  createTestApp,
  registerUser,
  resetData,
  todayJakarta,
  type TestContext,
} from './helpers';

describe('Keuangan: template bulanan dan rencana (integrasi)', () => {
  let ctx: TestContext;
  let a: ReturnType<typeof as>;
  let b: ReturnType<typeof as>;
  let cat: Record<string, string>;

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
    const res = await a.get('/finance/categories').expect(200);
    cat = Object.fromEntries(
      (res.body.items as { id: string; name: string }[]).map((c) => [c.name, c.id]),
    );
  });

  async function seedTemplate() {
    const items = [
      { name: 'Gaji', categoryId: cat.Gaji, amount: 8_500_000, dayOfMonth: 1 },
      { name: 'Listrik', categoryId: cat.Tagihan, amount: 450_000, dayOfMonth: 3 },
      { name: 'Internet', categoryId: cat.Tagihan, amount: 300_000, dayOfMonth: 5 },
      { name: 'Cicilan', categoryId: cat['Pengeluaran lain'], amount: 1_000_000, dayOfMonth: 31 },
    ];
    for (const i of items) await a.post('/finance/template', i).expect(201);
  }

  it('CRUD template; jenis mengikuti kategori', async () => {
    const t = await a
      .post('/finance/template', {
        name: 'Listrik',
        categoryId: cat.Tagihan,
        amount: 450_000,
        dayOfMonth: 3,
      })
      .expect(201);
    expect(t.body).toMatchObject({ type: 'expense', amount: 450_000, dayOfMonth: 3 });
    const u = await a
      .patch(`/finance/template/${t.body.id}`, { amount: 500_000, dayOfMonth: 4 })
      .expect(200);
    expect(u.body).toMatchObject({ amount: 500_000, dayOfMonth: 4 });
    await a
      .post('/finance/template', { name: 'X', categoryId: cat.Gaji, amount: 1, dayOfMonth: 32 })
      .expect(400);
    expect((await a.get('/finance/template').expect(200)).body.items).toHaveLength(1);
    await a.delete(`/finance/template/${t.body.id}`).expect(204);
    expect((await a.get('/finance/template').expect(200)).body.items).toHaveLength(0);
  });

  it('menerapkan template: tanggal dipotong ke akhir bulan, diulang tanpa duplikat', async () => {
    await seedTemplate();
    const r1 = await a.post('/finance/plans/apply-template', { month: '2026-02' }).expect(200);
    expect(r1.body).toMatchObject({ created: 4, skipped: 0 });
    const cicilan = r1.body.items.find((p: { name: string }) => p.name === 'Cicilan');
    expect(cicilan).toMatchObject({ date: '2026-02-28', status: 'pending', month: '2026-02' });

    const r2 = await a.post('/finance/plans/apply-template', { month: '2026-02' }).expect(200);
    expect(r2.body).toMatchObject({ created: 0, skipped: 4 });
    expect(r2.body.items).toHaveLength(4);

    // Item template baru ikut ditambahkan saat diterapkan ulang.
    await a
      .post('/finance/template', {
        name: 'Zakat',
        categoryId: cat.Zakat,
        amount: 212_500,
        dayOfMonth: 2,
      })
      .expect(201);
    const r3 = await a.post('/finance/plans/apply-template', { month: '2026-02' }).expect(200);
    expect(r3.body).toMatchObject({ created: 1, skipped: 4 });

    // Mengubah template tidak mengubah bulan yang sudah diterapkan.
    const tpl = (await a.get('/finance/template').expect(200)).body.items;
    const listrik = tpl.find((t: { name: string }) => t.name === 'Listrik');
    await a.patch(`/finance/template/${listrik.id}`, { amount: 999_000 }).expect(200);
    const plans = (await a.get('/finance/plans?month=2026-02').expect(200)).body.items;
    expect(plans.find((p: { name: string }) => p.name === 'Listrik').amount).toBe(450_000);
    expect(plans.map((p: { date: string }) => p.date)).toEqual(
      [...plans.map((p: { date: string }) => p.date)].sort(),
    );
  });

  it('realisasi: transaksi tertaut, selisih, dan rencana vs real di ringkasan', async () => {
    await seedTemplate();
    const { body } = await a
      .post('/finance/plans/apply-template', { month: '2026-11' })
      .expect(200);
    const plan = (name: string) => body.items.find((p: { name: string }) => p.name === name);

    const tx = await a
      .post(`/finance/plans/${plan('Listrik').id}/realize`, { amount: 512_000, date: '2026-11-04' })
      .expect(201);
    expect(tx.body).toMatchObject({
      type: 'expense',
      amount: 512_000,
      note: 'Listrik',
      planId: plan('Listrik').id,
      category: { id: cat.Tagihan },
    });
    await a
      .post(`/finance/plans/${plan('Gaji').id}/realize`, { amount: 8_500_000, date: '2026-11-01' })
      .expect(201);
    // Dua kali realisasi ditolak.
    const again = await a.post(`/finance/plans/${plan('Listrik').id}/realize`, {
      amount: 1,
      date: '2026-11-04',
    });
    expect(again.status).toBe(409);
    expect(again.body.code).toBe(ErrorCode.FINANCE_PLAN_REALIZED);

    // Transaksi di luar rencana tetap masuk real.
    await a
      .post('/finance/transactions', { amount: 60_000, date: '2026-11-10', categoryId: cat.Makan })
      .expect(201);

    const plans = (await a.get('/finance/plans?month=2026-11').expect(200)).body.items;
    expect(plans.find((p: { name: string }) => p.name === 'Listrik')).toMatchObject({
      status: 'done',
      difference: 62_000,
      transaction: { amount: 512_000, date: '2026-11-04' },
    });

    const s = (await a.get('/finance/summary?month=2026-11').expect(200)).body;
    expect(s).toMatchObject({
      income: 8_500_000,
      expense: 572_000,
      planned: { income: 8_500_000, expense: 1_750_000, balance: 6_750_000 },
      plans: { total: 4, done: 2, pending: 2 },
    });
    const tagihan = s.byCategory.find((c: { name: string }) => c.name === 'Tagihan');
    expect(tagihan).toMatchObject({ total: 512_000, planned: 750_000 });
    // Kategori yang hanya punya rencana tetap muncul.
    expect(s.byCategory.find((c: { name: string }) => c.name === 'Pengeluaran lain')).toMatchObject(
      {
        total: 0,
        planned: 1_000_000,
        count: 0,
      },
    );
    expect(s.byCategory.find((c: { name: string }) => c.name === 'Makan')).toMatchObject({
      total: 60_000,
      planned: 0,
    });
  });

  it('membatalkan realisasi atau menghapus transaksinya mengembalikan rencana', async () => {
    await seedTemplate();
    const { body } = await a
      .post('/finance/plans/apply-template', { month: '2026-11' })
      .expect(200);
    const [p1, p2] = body.items;
    await a.post(`/finance/plans/${p1.id}/realize`, { amount: 5, date: '2026-11-01' }).expect(201);
    const undone = await a.delete(`/finance/plans/${p1.id}/realize`).expect(200);
    expect(undone.body).toMatchObject({ status: 'pending', transaction: null });
    expect(
      (await a.get('/finance/transactions?month=2026-11').expect(200)).body.items,
    ).toHaveLength(0);
    const not = await a.delete(`/finance/plans/${p1.id}/realize`);
    expect(not.body.code).toBe(ErrorCode.FINANCE_PLAN_NOT_REALIZED);

    const tx = await a
      .post(`/finance/plans/${p2.id}/realize`, { amount: 7, date: '2026-11-02' })
      .expect(201);
    await a.delete(`/finance/transactions/${tx.body.id}`).expect(204);
    const plans = (await a.get('/finance/plans?month=2026-11').expect(200)).body.items;
    expect(plans.find((p: { id: string }) => p.id === p2.id).status).toBe('pending');

    // Menghapus rencana tidak menghapus transaksinya.
    const tx2 = await a
      .post(`/finance/plans/${p2.id}/realize`, { amount: 9, date: '2026-11-02' })
      .expect(201);
    await a.delete(`/finance/plans/${p2.id}`).expect(204);
    const kept = await a.get(`/finance/transactions/${tx2.body.id}`).expect(200);
    expect(kept.body.planId).toBeNull();
  });

  it('rencana manual, terlambat, dan pindah bulan', async () => {
    const today = todayJakarta();
    const yesterday = todayJakarta(-1);
    await a
      .post('/finance/plans', {
        name: 'Servis motor',
        categoryId: cat.Transportasi,
        amount: 350_000,
        date: yesterday,
      })
      .expect(201);
    const p = await a
      .post('/finance/plans', {
        name: 'Aqiqah',
        categoryId: cat['Pengeluaran lain'],
        amount: 3_000_000,
        date: today,
      })
      .expect(201);
    expect(p.body).toMatchObject({ templateItemId: null, status: 'pending' });

    const month = today.slice(0, 7);
    const s = (await a.get(`/finance/summary?month=${month}`).expect(200)).body;
    const overdue = yesterday.slice(0, 7) === month ? 1 : 0;
    expect(s.plans).toMatchObject({ overdue });

    const moved = await a.patch(`/finance/plans/${p.body.id}`, { date: '2027-01-15' }).expect(200);
    expect(moved.body.month).toBe('2027-01');

    // Item template yang sama tidak boleh dipindah ke bulan yang sudah punya item itu.
    await a
      .post('/finance/template', {
        name: 'Gaji',
        categoryId: cat.Gaji,
        amount: 1000,
        dayOfMonth: 1,
      })
      .expect(201);
    const r1 = (await a.post('/finance/plans/apply-template', { month: '2027-01' })).body.items[0];
    await a.post('/finance/plans/apply-template', { month: '2027-02' }).expect(200);
    const dup = await a.patch(`/finance/plans/${r1.id}`, { date: '2027-02-10' });
    expect(dup.status).toBe(409);
    expect(dup.body.code).toBe(ErrorCode.FINANCE_PLAN_DUPLICATE);
  });

  it('kategori yang dipakai template tidak bisa dihapus', async () => {
    const c = await a.post('/finance/categories', { type: 'expense', name: 'Kos' }).expect(201);
    await a
      .post('/finance/template', {
        name: 'Kos',
        categoryId: c.body.id,
        amount: 1_500_000,
        dayOfMonth: 1,
      })
      .expect(201);
    const del = await a.delete(`/finance/categories/${c.body.id}`);
    expect(del.status).toBe(409);
    expect(del.body.code).toBe(ErrorCode.FINANCE_CATEGORY_IN_USE);
  });

  it('data milik pengguna lain tidak bisa dibaca atau diubah', async () => {
    await seedTemplate();
    const { body } = await a
      .post('/finance/plans/apply-template', { month: '2026-11' })
      .expect(200);
    const plan = body.items[0];
    const tpl = (await a.get('/finance/template').expect(200)).body.items[0];

    expect((await b.get('/finance/template').expect(200)).body.items).toHaveLength(0);
    expect((await b.get('/finance/plans?month=2026-11').expect(200)).body.items).toHaveLength(0);
    await b.patch(`/finance/template/${tpl.id}`, { amount: 1 }).expect(404);
    await b.delete(`/finance/template/${tpl.id}`).expect(404);
    await b.patch(`/finance/plans/${plan.id}`, { amount: 1 }).expect(404);
    await b.delete(`/finance/plans/${plan.id}`).expect(404);
    await b
      .post(`/finance/plans/${plan.id}/realize`, { amount: 1, date: '2026-11-01' })
      .expect(404);
    // B tidak bisa memakai kategori A di template atau rencana.
    await b
      .post('/finance/template', { name: 'X', categoryId: cat.Gaji, amount: 1, dayOfMonth: 1 })
      .expect(404);
    await b
      .post('/finance/plans', { name: 'X', categoryId: cat.Gaji, amount: 1, date: '2026-11-01' })
      .expect(404);
    // Terapkan template B tidak menyentuh template A.
    const rb = await b.post('/finance/plans/apply-template', { month: '2026-11' }).expect(200);
    expect(rb.body).toMatchObject({ created: 0, items: [] });
  });
});
