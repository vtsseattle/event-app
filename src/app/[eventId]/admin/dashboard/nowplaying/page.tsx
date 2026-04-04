'use client';

import { doc } from 'firebase/firestore';
import { useEvent } from '@/hooks/useEvent';
import { usePrograms } from '@/hooks/usePrograms';
import { useEventId } from '@/contexts/EventContext';
import {
  getEventRef,
  getProgramsRef,
  updateDocument,
} from '@/lib/firestore';
import { computeProgramTimes } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function NowPlayingPage() {
  const { event } = useEvent();
  const { programs, loading } = usePrograms();
  const eventId = useEventId();

  const times = computeProgramTimes(programs, event?.eventStartTime || '5:00 PM');

  async function setNowPlaying(programId: string) {
    // Clear previous live program
    const previousLive = programs.find((p) => p.status === 'live');
    if (previousLive) {
      const prevRef = doc(getProgramsRef(eventId), previousLive.id);
      await updateDocument(prevRef, { status: 'completed' });
    }

    // Set new program live
    const programRef = doc(getProgramsRef(eventId), programId);
    await updateDocument(programRef, { status: 'live' });

    // Update event's currentProgramId
    await updateDocument(getEventRef(eventId), { currentProgramId: programId });
  }

  async function clearNowPlaying() {
    const liveProgram = programs.find((p) => p.status === 'live');
    if (liveProgram) {
      const ref = doc(getProgramsRef(eventId), liveProgram.id);
      await updateDocument(ref, { status: 'completed' });
    }
    await updateDocument(getEventRef(eventId), { currentProgramId: null });
  }

  if (loading) {
    return <div className="text-muted py-20 text-center">Loading…</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Now Playing
        </h1>
        {event?.currentProgramId && (
          <Button variant="secondary" size="sm" onClick={clearNowPlaying}>
            Clear Now Playing
          </Button>
        )}
      </div>

      <p className="text-muted text-sm mb-4">
        Tap a program to set it live. All attendee screens update instantly.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {programs.map((p, i) => {
          const isLive = p.id === event?.currentProgramId;
          return (
            <button
              key={p.id}
              onClick={() => setNowPlaying(p.id)}
              className="text-left focus:outline-none"
            >
              <Card
                className={`transition-all cursor-pointer hover:border-accent/50 ${
                  isLive
                    ? 'border-accent ring-2 ring-accent/40 shadow-[0_0_24px_rgba(212,168,67,0.25)]'
                    : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{p.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{p.title}</p>
                    <p className="text-sm text-muted">{p.performers}</p>
                    <p className="text-xs text-muted mt-1">
                      {times[i]?.startTime} – {times[i]?.endTime}
                    </p>
                  </div>
                </div>
                {isLive && (
                  <div className="mt-3 flex items-center gap-2 text-accent-light text-sm font-medium">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                    </span>
                    LIVE NOW
                  </div>
                )}
              </Card>
            </button>
          );
        })}
      </div>

      {programs.length === 0 && (
        <p className="text-muted text-sm text-center py-10">
          No programs to display. Add them in the Programs section first.
        </p>
      )}
    </div>
  );
}
