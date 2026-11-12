import {
  addDays,
  dateRange,
  startOfWeek,
  toLocalDate,
  toLocalTime,
  zonedTimeToUtc,
  type CalendarEvent,
} from '@muhasabah/shared';

export type CalendarView = 'day' | 'week' | 'month';

/** 42 tanggal (6 minggu, Senin–Ahad) yang menampilkan bulan dari `anchor`. */
export function monthGrid(anchor: string): string[] {
  const first = `${anchor.slice(0, 7)}-01`;
  return dateRange(startOfWeek(first), addDays(startOfWeek(first), 41));
}

export function weekDates(anchor: string): string[] {
  const start = startOfWeek(anchor);
  return dateRange(start, addDays(start, 6));
}

/** Tanggal-tanggal yang terlihat untuk sebuah tampilan. */
export function visibleDates(view: CalendarView, anchor: string): string[] {
  if (view === 'day') return [anchor];
  if (view === 'week') return weekDates(anchor);
  return monthGrid(anchor);
}

/** Menggeser tanggal acuan satu langkah sesuai tampilan. */
export function shiftAnchor(view: CalendarView, anchor: string, step: number): string {
  if (view === 'day') return addDays(anchor, step);
  if (view === 'week') return addDays(anchor, step * 7);
  const [y, m] = anchor.split('-').map(Number);
  const d = new Date(Date.UTC(y!, m! - 1 + step, 1));
  return d.toISOString().slice(0, 10);
}

/** Rentang instan `[from, to)` untuk kueri API dari tanggal lokal pertama dan terakhir. */
export function datesToInstantRange(first: string, last: string, timeZone: string) {
  return {
    from: zonedTimeToUtc(first, '00:00', timeZone).toISOString(),
    to: zonedTimeToUtc(addDays(last, 1), '00:00', timeZone).toISOString(),
  };
}

/** Tanggal lokal yang dilalui event. Waktu selesai bersifat eksklusif. */
export function eventDates(
  event: Pick<CalendarEvent, 'startAt' | 'endAt'>,
  timeZone: string,
): string[] {
  const start = toLocalDate(new Date(event.startAt), timeZone);
  const endMs = Math.max(Date.parse(event.startAt), Date.parse(event.endAt) - 1);
  const end = toLocalDate(new Date(endMs), timeZone);
  return dateRange(start, end < start ? start : end);
}

/** Mengelompokkan event per tanggal lokal; event sepanjang hari di atas, lalu urut jam mulai. */
export function groupByDate(
  events: CalendarEvent[],
  timeZone: string,
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    for (const d of eventDates(e, timeZone)) {
      const list = map.get(d) ?? [];
      list.push(e);
      map.set(d, list);
    }
  }
  for (const list of map.values()) {
    list.sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.startAt.localeCompare(b.startAt));
  }
  return map;
}

/** Label jam event pada tanggal tertentu, mis. "09:00–11:00", "Sepanjang hari", "lanjutan". */
export function eventTimeLabel(event: CalendarEvent, date: string, timeZone: string): string {
  if (event.allDay) return 'Sepanjang hari';
  const startDate = toLocalDate(new Date(event.startAt), timeZone);
  const endDate = toLocalDate(new Date(event.endAt), timeZone);
  const start = startDate === date ? toLocalTime(new Date(event.startAt), timeZone) : '00:00';
  const end = endDate === date ? toLocalTime(new Date(event.endAt), timeZone) : '24:00';
  // Format jam Indonesia memakai titik (09.00), sama dengan formatTime.
  return `${start}–${end}`.replaceAll(':', '.');
}
