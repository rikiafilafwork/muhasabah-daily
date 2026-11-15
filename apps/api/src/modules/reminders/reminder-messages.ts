import {
  eventReminderLabel,
  PRAYER_LABELS,
  toLocalDate,
  type ObligatoryPrayer,
  type PushPayload,
} from '@muhasabah/shared';

export function formatClock(at: Date, timezone: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(at);
}

export function prayerMessage(
  prayer: ObligatoryPrayer,
  at: Date,
  timezone: string,
  city: string | null,
): PushPayload {
  const where = city ? ` (${city})` : '';
  return {
    title: `Waktu ${PRAYER_LABELS[prayer]}`,
    body: `Telah masuk pukul ${formatClock(at, timezone)}${where}.`,
    url: '/',
    tag: `prayer-${prayer}`,
  };
}

export interface EventForMessage {
  id: string;
  title: string;
  location: string | null;
  startAt: Date;
  allDay: boolean;
  reminderMinutes: number | null;
}

export function eventMessage(e: EventForMessage, timezone: string): PushPayload {
  const minutes = e.reminderMinutes ?? 0;
  const when = e.allDay
    ? minutes >= 1440
      ? 'Besok, sepanjang hari'
      : 'Hari ini, sepanjang hari'
    : minutes === 0
      ? `Dimulai sekarang, ${formatClock(e.startAt, timezone)}`
      : `${eventReminderLabel(minutes).replace(' sebelumnya', ' lagi')}, pukul ${formatClock(e.startAt, timezone)}`;
  return {
    title: e.title,
    body: e.location ? `${when} · ${e.location}` : when,
    url: `/schedule?view=day&date=${toLocalDate(e.startAt, timezone)}`,
    tag: `event-${e.id}`,
  };
}
