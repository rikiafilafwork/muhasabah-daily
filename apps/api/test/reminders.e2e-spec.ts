import { ErrorCode } from '@muhasabah/shared';
import { RemindersService } from '../src/modules/reminders/reminders.service';
import { as, createTestApp, registerUser, resetData, type TestContext } from './helpers';

const sub = (n: number) => ({
  endpoint: `https://fcm.googleapis.com/fcm/send/perangkat-${n}`,
  keys: { p256dh: `kunci-${n}`, auth: `auth-${n}` },
});

describe('Pengingat / Web Push (integrasi)', () => {
  let ctx: TestContext;
  let reminders: RemindersService;
  let a: ReturnType<typeof as>;
  let b: ReturnType<typeof as>;

  beforeAll(async () => {
    ctx = await createTestApp();
    reminders = ctx.app.get(RemindersService);
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  beforeEach(async () => {
    await resetData(ctx);
    ctx.push.sent = [];
    ctx.push.gone.clear();
    a = as(ctx.app, (await registerUser(ctx.app)).accessToken);
    b = as(ctx.app, (await registerUser(ctx.app)).accessToken);
  });

  it('memberi kunci publik VAPID', async () => {
    const res = await a.get('/push/config').expect(200);
    expect(res.body.enabled).toBe(true);
    expect(res.body.publicKey).toMatch(/^B/);
  });

  it('menolak endpoint di luar layanan push yang dikenal', async () => {
    for (const endpoint of [
      'http://fcm.googleapis.com/x',
      'https://localhost/x',
      'https://169.254.169.254/latest',
      'https://fcm.googleapis.com.evil.test/x',
      'https://fcm.googleapis.com:8443/x',
    ]) {
      const res = await a.post('/push/subscriptions', { ...sub(1), endpoint }).expect(400);
      expect(res.body.code).toBe(ErrorCode.VALIDATION_FAILED);
    }
  });

  it('langganan, tes kirim, lalu berhenti berlangganan', async () => {
    const none = await a.post('/push/test').expect(422);
    expect(none.body.code).toBe(ErrorCode.PUSH_NO_SUBSCRIPTION);

    await a.post('/push/subscriptions', sub(1)).expect(204);
    await a.post('/push/subscriptions', sub(1)).expect(204); // idempoten
    const res = await a.post('/push/test').expect(201);
    expect(res.body.sent).toBe(1);
    expect(ctx.push.sent[0].payload).toMatchObject({ title: 'Notifikasi aktif', tag: 'test' });

    // Pengguna lain tidak bisa mencabut langganan milik A.
    await b.post('/push/subscriptions/remove', { endpoint: sub(1).endpoint }).expect(204);
    expect(await ctx.prisma.pushSubscription.count()).toBe(1);

    await a.post('/push/subscriptions/remove', { endpoint: sub(1).endpoint }).expect(204);
    expect(await ctx.prisma.pushSubscription.count()).toBe(0);
  });

  it('endpoint yang sama pindah ke akun yang sedang masuk', async () => {
    await a.post('/push/subscriptions', sub(1)).expect(204);
    await b.post('/push/subscriptions', sub(1)).expect(204);
    await a.post('/push/test').expect(422);
    expect((await b.post('/push/test').expect(201)).body.sent).toBe(1);
  });

  it('langganan kedaluwarsa (410) dihapus', async () => {
    await a.post('/push/subscriptions', sub(1)).expect(204);
    await a.post('/push/subscriptions', sub(2)).expect(204);
    ctx.push.gone.add(sub(1).endpoint);
    expect((await a.post('/push/test').expect(201)).body.sent).toBe(1);
    const left = await ctx.prisma.pushSubscription.findMany();
    expect(left.map((s) => s.endpoint)).toEqual([sub(2).endpoint]);
  });

  describe('agenda', () => {
    const start = new Date('2026-11-20T03:00:00.000Z'); // 10.00 WIB
    const event = (reminderMinutes: number | null) => ({
      title: 'Kajian Ahad',
      location: 'Masjid Raya',
      startAt: start.toISOString(),
      endAt: new Date(start.getTime() + 3600_000).toISOString(),
      reminderMinutes,
    });
    const at = (minutesBefore: number, plusSeconds = 0) =>
      new Date(start.getTime() - minutesBefore * 60_000 + plusSeconds * 1000);

    beforeEach(async () => {
      await a.post('/push/subscriptions', sub(1)).expect(204);
    });

    it('mengirim sekali saat jatuh tempo, tidak sebelum dan tidak berulang', async () => {
      const created = await a.post('/events', event(10)).expect(201);
      expect(created.body.reminderMinutes).toBe(10);

      expect((await reminders.tick(at(11))).events).toBe(0);
      expect((await reminders.tick(at(10, 20))).events).toBe(1);
      expect((await reminders.tick(at(9))).events).toBe(0);

      expect(ctx.push.sent).toHaveLength(1);
      expect(ctx.push.sent[0].payload).toEqual({
        title: 'Kajian Ahad',
        body: '10 menit lagi, pukul 10.00 · Masjid Raya',
        url: '/schedule?view=day&date=2026-11-20',
        tag: `event-${created.body.id}`,
      });
    });

    it('menjadwal ulang saat waktu mulai diubah', async () => {
      const { body } = await a.post('/events', event(0)).expect(201);
      await reminders.tick(at(0, 5));
      expect(ctx.push.sent).toHaveLength(1);

      const later = new Date(start.getTime() + 2 * 3600_000);
      await a
        .patch(`/events/${body.id}`, {
          startAt: later.toISOString(),
          endAt: new Date(later.getTime() + 3600_000).toISOString(),
        })
        .expect(200);
      await reminders.tick(new Date(later.getTime() + 5000));
      expect(ctx.push.sent).toHaveLength(2);
      expect(ctx.push.sent[1].payload.body).toBe('Dimulai sekarang, 12.00 · Masjid Raya');
    });

    it('tidak mengirim pengingat yang terlambat lebih dari 10 menit atau tanpa pengingat', async () => {
      await a.post('/events', event(30)).expect(201);
      await a.post('/events', event(null)).expect(201);
      expect((await reminders.tick(at(15))).events).toBe(0);
      expect(ctx.push.sent).toHaveLength(0);
    });

    it('menolak pilihan menit yang tidak dikenal', async () => {
      await a.post('/events', event(7)).expect(400);
    });
  });

  describe('waktu sholat', () => {
    // FakeAladhan: Dzuhur 11.45 WIB, Ashar 15.05 WIB.
    const date = '2026-11-20';
    const wib = (hhmm: string, plusSeconds = 0) =>
      new Date(new Date(`${date}T${hhmm}:00+07:00`).getTime() + plusSeconds * 1000);

    beforeEach(async () => {
      await a.patch('/me', { latitude: -6.2088, longitude: 106.8456, city: 'Jakarta' }).expect(200);
      await a.post('/push/subscriptions', sub(1)).expect(204);
    });

    it('menyimpan pilihan sholat di profil', async () => {
      const res = await a.patch('/me', { prayerReminders: ['isha', 'fajr', 'fajr'] }).expect(200);
      expect(res.body.prayerReminders).toEqual(['fajr', 'isha']);
      await a.patch('/me', { prayerReminders: ['sunrise'] }).expect(400);
    });

    it('mengirim tepat sekali untuk sholat yang dipilih', async () => {
      await a.patch('/me', { prayerReminders: ['dhuhr'] }).expect(200);

      expect((await reminders.tick(wib('11:44'))).prayers).toBe(0);
      expect((await reminders.tick(wib('11:45', 30))).prayers).toBe(1);
      expect((await reminders.tick(wib('11:46'))).prayers).toBe(0);
      expect((await reminders.tick(wib('15:05', 10))).prayers).toBe(0); // Ashar tidak dipilih

      expect(ctx.push.sent.map((s) => s.payload)).toEqual([
        {
          title: 'Waktu Dzuhur',
          body: 'Telah masuk pukul 11.45 (Jakarta).',
          url: '/',
          tag: 'prayer-dhuhr',
        },
      ]);
    });

    it('tidak mengirim saat jadwal hanya perkiraan dari cache lama', async () => {
      await a.patch('/me', { prayerReminders: ['dhuhr'] }).expect(200);
      ctx.aladhan.fail = true;
      expect((await reminders.tick(wib('11:45', 30))).prayers).toBe(0);
      ctx.aladhan.fail = false;
    });

    it('pengguna tanpa perangkat terdaftar tidak diproses', async () => {
      await b.patch('/me', { latitude: -6.2, longitude: 106.8, prayerReminders: ['dhuhr'] });
      expect((await reminders.tick(wib('11:45', 30))).prayers).toBe(0);
    });
  });
});
