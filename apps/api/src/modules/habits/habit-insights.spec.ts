import { computeHabitStats, summarizeHabitStats } from './habit-insights';

const base = { startDate: '2026-10-01', from: '2026-11-01', to: '2026-11-10', today: '2026-11-10' };

describe('computeHabitStats', () => {
  it('menghitung check-in, streak terbaik, dan konsistensi dalam rentang', () => {
    const s = computeHabitStats({
      ...base,
      doneDates: [
        '2026-10-31',
        '2026-11-01',
        '2026-11-02',
        '2026-11-03',
        '2026-11-05',
        '2026-11-06',
      ],
    });
    expect(s.checkIns).toBe(5); // 31 Okt di luar rentang
    expect(s.bestStreak).toBe(3); // 1–3 Nov (deret sebelum rentang tidak ikut)
    expect(s.activeDays).toBe(10);
    expect(s.consistency).toBe(50);
  });

  it('hari aktif dimulai dari tanggal mulai habit dan berhenti di hari ini', () => {
    const s = computeHabitStats({
      startDate: '2026-11-06',
      from: '2026-11-01',
      to: '2026-11-30',
      today: '2026-11-10',
      doneDates: ['2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'],
    });
    expect(s.activeDays).toBe(5);
    expect(s.consistency).toBe(100);
  });

  it('mengabaikan log sebelum tanggal mulai atau setelah hari ini', () => {
    const s = computeHabitStats({
      ...base,
      startDate: '2026-11-05',
      doneDates: ['2026-11-04', '2026-11-11'],
    });
    expect(s.checkIns).toBe(0);
    expect(s.consistency).toBe(0);
  });

  it('streak berjalan dihitung sampai kemarin bila hari ini belum dicentang', () => {
    const doneDates = ['2026-11-07', '2026-11-08', '2026-11-09'];
    expect(computeHabitStats({ ...base, doneDates }).currentStreak).toBe(3);
    expect(
      computeHabitStats({ ...base, doneDates: [...doneDates, '2026-11-10'] }).currentStreak,
    ).toBe(4);
    expect(computeHabitStats({ ...base, doneDates: ['2026-11-08'] }).currentStreak).toBe(0);
  });

  it('streak berjalan tidak dibatasi rentang kueri', () => {
    const doneDates = ['2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'];
    const s = computeHabitStats({ ...base, today: '2026-11-01', doneDates });
    expect(s.currentStreak).toBe(5);
  });

  it('proyeksi dari rata-rata 4 minggu terakhir', () => {
    // 14 check-in dalam 28 hari terakhir → 3,5 per minggu → 4.
    const doneDates = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.UTC(2026, 10, 10 - i * 2));
      return d.toISOString().slice(0, 10);
    });
    expect(computeHabitStats({ ...base, doneDates }).projectedNextWeek).toBe(4);
  });

  it('proyeksi habit muda memakai hari aktifnya saja', () => {
    const s = computeHabitStats({
      ...base,
      startDate: '2026-11-08',
      doneDates: ['2026-11-08', '2026-11-09', '2026-11-10'],
    });
    expect(s.projectedNextWeek).toBe(7);
  });

  it('nol untuk habit tanpa hari aktif', () => {
    const s = computeHabitStats({ ...base, startDate: '2026-12-01', doneDates: [] });
    expect(s).toEqual({
      checkIns: 0,
      bestStreak: 0,
      currentStreak: 0,
      activeDays: 0,
      consistency: 0,
      projectedNextWeek: 0,
    });
  });
});

describe('summarizeHabitStats', () => {
  it('menggabungkan beberapa habit', () => {
    const a = {
      checkIns: 5,
      bestStreak: 3,
      currentStreak: 1,
      activeDays: 10,
      consistency: 50,
      projectedNextWeek: 4,
    };
    const b = {
      checkIns: 10,
      bestStreak: 10,
      currentStreak: 10,
      activeDays: 10,
      consistency: 100,
      projectedNextWeek: 7,
    };
    expect(summarizeHabitStats([a, b])).toEqual({
      checkIns: 15,
      bestStreak: 10,
      currentStreak: 10,
      activeDays: 20,
      consistency: 75,
      projectedNextWeek: 11,
    });
    expect(summarizeHabitStats([]).consistency).toBe(0);
  });
});
