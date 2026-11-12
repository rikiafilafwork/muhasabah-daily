import { describe, expect, it } from 'vitest';
import type { CalendarEvent } from '@muhasabah/shared';
import {
  datesToInstantRange,
  eventDates,
  eventTimeLabel,
  groupByDate,
  monthGrid,
  shiftAnchor,
  weekDates,
} from './calendar';

const TZ = 'Asia/Jakarta';
const ev = (over: Partial<CalendarEvent>): CalendarEvent => ({
  id: 'e',
  title: 'E',
  description: null,
  location: null,
  startAt: '2026-11-12T02:00:00.000Z',
  endAt: '2026-11-12T04:00:00.000Z',
  allDay: false,
  color: 'emerald',
  createdAt: '',
  updatedAt: '',
  ...over,
});

describe('calendar', () => {
  it('monthGrid dimulai Senin dan berisi 42 hari', () => {
    const grid = monthGrid('2026-11-12');
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe('2026-10-26');
    expect(grid).toContain('2026-11-30');
  });

  it('weekDates dan shiftAnchor', () => {
    expect(weekDates('2026-11-12')).toEqual([
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
    ]);
    expect(shiftAnchor('month', '2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftAnchor('month', '2026-03-31', -1)).toBe('2026-02-01');
    expect(shiftAnchor('week', '2026-11-12', -1)).toBe('2026-11-05');
  });

  it('rentang instan memakai tengah malam lokal', () => {
    expect(datesToInstantRange('2026-11-09', '2026-11-15', TZ)).toEqual({
      from: '2026-11-08T17:00:00.000Z',
      to: '2026-11-15T17:00:00.000Z',
    });
  });

  it('event lintas hari dan event sepanjang hari dengan akhir eksklusif', () => {
    expect(
      eventDates(ev({ startAt: '2026-11-12T15:00:00Z', endAt: '2026-11-12T18:00:00Z' }), TZ),
    ).toEqual(['2026-11-12', '2026-11-13']);
    const allDay = ev({
      allDay: true,
      startAt: '2026-11-11T17:00:00Z',
      endAt: '2026-11-12T17:00:00Z',
    });
    expect(eventDates(allDay, TZ)).toEqual(['2026-11-12']);
  });

  it('mengelompokkan dan memberi label jam', () => {
    const a = ev({ id: 'a', startAt: '2026-11-12T05:00:00Z', endAt: '2026-11-12T06:00:00Z' });
    const b = ev({
      id: 'b',
      allDay: true,
      startAt: '2026-11-11T17:00:00Z',
      endAt: '2026-11-12T17:00:00Z',
    });
    const c = ev({ id: 'c', startAt: '2026-11-12T01:00:00Z', endAt: '2026-11-12T02:00:00Z' });
    expect(
      groupByDate([a, b, c], TZ)
        .get('2026-11-12')!
        .map((e) => e.id),
    ).toEqual(['b', 'c', 'a']);
    expect(eventTimeLabel(a, '2026-11-12', TZ)).toBe('12.00–13.00');
    expect(eventTimeLabel(b, '2026-11-12', TZ)).toBe('Sepanjang hari');
    const overnight = ev({ startAt: '2026-11-12T15:00:00Z', endAt: '2026-11-12T18:00:00Z' });
    expect(eventTimeLabel(overnight, '2026-11-12', TZ)).toBe('22.00–24.00');
    expect(eventTimeLabel(overnight, '2026-11-13', TZ)).toBe('00.00–01.00');
  });
});
