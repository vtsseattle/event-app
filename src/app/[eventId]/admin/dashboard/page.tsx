'use client';

import { useEvent } from '@/hooks/useEvent';
import { useViewerCount } from '@/hooks/useViewerCount';
import { useShoutouts } from '@/hooks/useShoutouts';
import { usePrograms } from '@/hooks/usePrograms';
import { usePledges } from '@/hooks/usePledges';
import { useEventId } from '@/contexts/EventContext';
import { getEventRef } from '@/lib/firestore';
import { updateDoc } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const PHASES = [
  { value: 'rsvp' as const, label: 'RSVP', icon: '📩', description: 'Pre-event — visitors see flyer and RSVP form' },
  { value: 'live' as const, label: 'Live', icon: '🎉', description: 'Event day — attendees join the live experience' },
  { value: 'ended' as const, label: 'Ended', icon: '🎭', description: 'Post-event — visitors see thank you message' },
];

export default function OverviewPage() {
  const { event, loading: eventLoading } = useEvent();
  const { count: viewerCount } = useViewerCount();
  const { shoutouts } = useShoutouts();
  const { programs } = usePrograms();
  const { pledges, totalKids, totalAmount } = usePledges();
  const eventId = useEventId();

  const currentProgram = programs.find(
    (p) => p.id === event?.currentProgramId
  );

  const currentPhase = event?.phase || 'live';

  async function setPhase(phase: 'rsvp' | 'live' | 'ended') {
    try {
      await updateDoc(getEventRef(eventId), { phase });
    } catch (error) {
      console.error('Error setting phase:', error);
    }
  }

  const liveStatus = currentProgram
    ? `Now Playing: ${currentProgram.emoji} ${currentProgram.title}`
    : 'No program live';

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">
        Dashboard
      </h1>

      {/* Status */}
      <div className="mb-6">
        <Badge variant={currentProgram ? 'live' : 'upcoming'}>
          {liveStatus}
        </Badge>
        {event?.announcementActive && (
          <Badge variant="live" className="ml-2">
            📢 Announcement Active
          </Badge>
        )}
      </div>

      {/* Phase switcher */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-muted mb-2">Event Phase</h2>
        <div className="grid grid-cols-3 gap-2">
          {PHASES.filter((p) => p.value !== 'rsvp' || event?.features?.rsvp !== false).map((phase) => (
            <button
              key={phase.value}
              onClick={() => setPhase(phase.value)}
              className={`flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-center transition-all ${
                currentPhase === phase.value
                  ? 'bg-accent text-bg ring-2 ring-accent/50'
                  : 'border border-white/10 text-muted hover:text-foreground hover:bg-white/5'
              }`}
            >
              <span className="text-xl">{phase.icon}</span>
              <span className="text-xs font-semibold">{phase.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted mt-1.5">
          {PHASES.find((p) => p.value === currentPhase)?.description}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-muted text-sm mb-1">Connected Viewers</p>
          <p className="text-3xl font-bold text-accent-light">{viewerCount}</p>
        </Card>

        <Card>
          <p className="text-muted text-sm mb-1">Total Programs</p>
          <p className="text-3xl font-bold text-accent-light">{programs.length}</p>
        </Card>

        <Card>
          <p className="text-muted text-sm mb-1">Total Shoutouts</p>
          <p className="text-3xl font-bold text-accent-light">{shoutouts.length}</p>
        </Card>

        <Card>
          <p className="text-muted text-sm mb-1">Current Announcement</p>
          <p className="text-sm text-foreground truncate">
            {event?.announcementActive ? event.announcementText : '—'}
          </p>
        </Card>

        <Card>
          <p className="text-muted text-sm mb-1">Pledges</p>
          <p className="text-3xl font-bold text-accent-light">{pledges.length}</p>
          <p className="text-xs text-muted mt-1">
            {totalKids} kids · ${totalAmount.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Quick program list */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-3">Programs</h2>
        <div className="space-y-2">
          {programs.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-bg-card px-4 py-3"
            >
              <span className="flex items-center gap-2">
                <span>{p.emoji}</span>
                <span className="text-foreground">{p.title}</span>
                <span className="text-muted text-sm">— {p.performers}</span>
              </span>
              <Badge variant={p.status}>{p.status}</Badge>
            </div>
          ))}
          {programs.length === 0 && (
            <p className="text-muted text-sm">No programs yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
