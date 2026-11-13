import { summarizeFocus } from './focus-summary';

describe('summarizeFocus', () => {
  it('menjumlahkan per tanggal dan mengisi tanggal kosong', () => {
    const s = summarizeFocus('2026-11-10', '2026-11-12', [
      { date: '2026-11-10', focusedSeconds: 1500, status: 'completed' },
      { date: '2026-11-10', focusedSeconds: 600, status: 'cancelled' },
      { date: '2026-11-12', focusedSeconds: 3000, status: 'completed' },
      { date: '2026-11-13', focusedSeconds: 999, status: 'completed' },
    ]);
    expect(s).toEqual({
      from: '2026-11-10',
      to: '2026-11-12',
      totalFocusedSeconds: 5100,
      completedSessions: 2,
      byDate: [
        { date: '2026-11-10', focusedSeconds: 2100 },
        { date: '2026-11-11', focusedSeconds: 0 },
        { date: '2026-11-12', focusedSeconds: 3000 },
      ],
    });
  });
});
