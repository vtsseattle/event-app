import type { Event } from '@/lib/types';

const DEFAULT_DURATION_HOURS = 3;

/**
 * Parse the event's human-readable date + start time into a Date.
 * Returns null if the strings can't be parsed.
 *
 * `event.date` examples: "June 06, 2026", "March 29, 2026"
 * `event.eventStartTime` examples: "5:00 PM", "4:00 PM"
 *
 * Notes:
 * - The parsed Date is in the viewer's local timezone (best-effort — there's
 *   no per-event timezone stored). For local in-person events this is fine.
 */
export function parseEventStart(event: Pick<Event, 'date' | 'eventStartTime'>): Date | null {
  const date = (event.date || '').trim();
  const time = (event.eventStartTime || '').trim();
  if (!date) return null;
  const combined = time ? `${date} ${time}` : date;
  const parsed = new Date(combined);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

/**
 * Format a Date as ICS UTC: YYYYMMDDTHHMMSSZ
 */
function formatIcsDateUtc(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Escape a string for ICS TEXT fields (RFC 5545).
 */
function icsEscape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export interface CalendarEventInput {
  event: Pick<Event, 'name' | 'tagline' | 'date' | 'eventStartTime'>;
  eventId: string;
  eventUrl: string;
  durationHours?: number;
}

/**
 * Build an .ics file body for the given event. Returns null if dates can't be parsed.
 */
export function buildIcsContent(input: CalendarEventInput): string | null {
  const start = parseEventStart(input.event);
  if (!start) return null;

  const duration = input.durationHours ?? DEFAULT_DURATION_HOURS;
  const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
  const now = new Date();

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Event App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${input.eventId}@event-app`,
    `DTSTAMP:${formatIcsDateUtc(now)}`,
    `DTSTART:${formatIcsDateUtc(start)}`,
    `DTEND:${formatIcsDateUtc(end)}`,
    `SUMMARY:${icsEscape(input.event.name || 'Event')}`,
  ];

  if (input.event.tagline) {
    lines.push(`DESCRIPTION:${icsEscape(input.event.tagline)}`);
  }
  if (input.eventUrl) {
    lines.push(`URL:${input.eventUrl}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');
  // RFC 5545 mandates CRLF line endings.
  return lines.join('\r\n') + '\r\n';
}

/**
 * Build a Google Calendar event-creation URL. Returns null if dates can't be parsed.
 */
export function buildGoogleCalendarUrl(input: CalendarEventInput): string | null {
  const start = parseEventStart(input.event);
  if (!start) return null;

  const duration = input.durationHours ?? DEFAULT_DURATION_HOURS;
  const end = new Date(start.getTime() + duration * 60 * 60 * 1000);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.event.name || 'Event',
    dates: `${formatIcsDateUtc(start)}/${formatIcsDateUtc(end)}`,
  });
  if (input.event.tagline) {
    params.set('details', input.event.tagline);
  }
  if (input.eventUrl) {
    const existing = params.get('details') ?? '';
    params.set('details', existing ? `${existing}\n\n${input.eventUrl}` : input.eventUrl);
  }
  return `https://www.google.com/calendar/render?${params.toString()}`;
}
