'use client';

import { useState, useRef, useEffect } from 'react';
import type { Event } from '@/lib/types';
import { buildIcsContent, buildGoogleCalendarUrl, parseEventStart } from '@/lib/calendar';

interface AddToCalendarProps {
  event: Pick<Event, 'name' | 'tagline' | 'date' | 'eventStartTime'>;
  eventId: string;
}

export default function AddToCalendar({ event, eventId }: AddToCalendarProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // If we can't parse a date, don't render anything.
  if (!parseEventStart(event)) return null;

  const eventUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${eventId}`
      : '';

  function downloadIcs() {
    const ics = buildIcsContent({ event, eventId, eventUrl });
    if (!ics) return;
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${eventId}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  function openGoogleCalendar() {
    const url = buildGoogleCalendarUrl({ event, eventId, eventUrl });
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-bg-card px-4 py-2.5 text-sm text-foreground hover:border-accent/50 hover:text-accent transition-colors"
      >
        <span>📅</span>
        <span>Add to Calendar</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-10 mt-2 overflow-hidden rounded-lg border border-white/20 bg-bg-card shadow-lg">
          <button
            onClick={openGoogleCalendar}
            className="block w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-white/5"
          >
            Google Calendar
          </button>
          <button
            onClick={downloadIcs}
            className="block w-full border-t border-white/10 px-4 py-2.5 text-left text-sm text-foreground hover:bg-white/5"
          >
            Apple Calendar / Outlook (.ics)
          </button>
        </div>
      )}
    </div>
  );
}
