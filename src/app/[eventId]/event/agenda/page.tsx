'use client';

import { usePrograms } from '@/hooks/usePrograms';
import { useEvent } from '@/hooks/useEvent';
import { computeProgramTimes } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import type { Program } from '@/lib/types';

function StatusDot({ status }: { status: Program['status'] }) {
  if (status === 'live') {
    return (
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-danger" />
      </span>
    );
  }
  if (status === 'completed') {
    return (
      <span className="flex h-3 w-3 items-center justify-center rounded-full bg-muted/40 text-[8px] text-muted">
        ✓
      </span>
    );
  }
  return <span className="h-3 w-3 rounded-full bg-accent" />;
}

function ProgramItem({ program, startTime, endTime }: { program: Program; startTime: string; endTime: string }) {
  const isLive = program.status === 'live';
  const isCompleted = program.status === 'completed';

  return (
    <div className="flex gap-4">
      {/* Timeline column */}
      <div className="flex flex-col items-center">
        <StatusDot status={program.status} />
        <div className="mt-1 w-px flex-1 bg-white/10" />
      </div>

      {/* Content */}
      <div
        className={`mb-4 flex-1 rounded-xl border p-4 transition-all ${
          isLive
            ? 'border-accent/50 bg-bg-card shadow-[0_0_20px_rgba(212,168,67,0.1)]'
            : 'border-white/5 bg-bg-card/60'
        } ${isCompleted ? 'opacity-60' : ''}`}
      >
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-medium text-muted">
            {startTime} – {endTime}
          </span>
          {isLive && <Badge variant="live">LIVE</Badge>}
          {program.status === 'upcoming' && (
            <Badge variant="upcoming">Up Next</Badge>
          )}
        </div>

        <h3
          className={`font-heading text-lg font-semibold ${
            isCompleted ? 'text-muted' : 'text-foreground'
          }`}
        >
          {program.emoji} {program.title}
        </h3>

        {program.performers && (
          <p className="mt-1 text-sm text-muted">{program.performers}</p>
        )}

        {program.heroImageUrl && (
          <img
            src={program.heroImageUrl}
            alt={program.title}
            className="mt-3 w-full rounded-lg border border-white/10"
          />
        )}

        {program.description && (
          <p className="mt-2 text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
            {program.description}
          </p>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-4 py-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="h-3 w-3 animate-pulse rounded-full bg-white/10" />
            <div className="mt-1 w-px flex-1 bg-white/5" />
          </div>
          <div className="mb-4 flex-1 animate-pulse rounded-xl border border-white/5 bg-bg-card/40 p-4">
            <div className="mb-2 h-3 w-24 rounded bg-white/10" />
            <div className="mb-1 h-5 w-40 rounded bg-white/10" />
            <div className="h-3 w-32 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AgendaPage() {
  const { programs, loading } = usePrograms();
  const { event } = useEvent();

  const times = computeProgramTimes(programs, event?.eventStartTime || '5:00 PM');

  // Split programs into revealed and hidden surprises
  const revealedPrograms: { program: Program; index: number }[] = [];
  const hiddenSurprises: { program: Program; index: number }[] = [];

  programs.forEach((program, i) => {
    const isSurpriseHidden = program.surprise && program.status === 'upcoming';
    if (isSurpriseHidden) {
      hiddenSurprises.push({ program, index: i });
    } else {
      revealedPrograms.push({ program, index: i });
    }
  });

  if (loading) return <LoadingSkeleton />;

  if (programs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-20 text-center">
        <span className="text-4xl">📋</span>
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Schedule Coming Soon
        </h2>
        <p className="text-sm text-muted">
          The event schedule will appear here once it&apos;s published.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-24">
      <h1 className="font-heading mb-6 text-2xl font-bold text-foreground">
        📋 Event Schedule
      </h1>

      <div className="flex flex-col">
        {revealedPrograms.map(({ program, index: i }) => (
          <ProgramItem
            key={program.id}
            program={program}
            startTime={times[i]?.startTime || ''}
            endTime={times[i]?.endTime || ''}
          />
        ))}

        {hiddenSurprises.length > 0 && (
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="h-3 w-3 rounded-full bg-accent" />
              <div className="mt-1 w-px flex-1 bg-white/10" />
            </div>
            <div className="mb-4 flex-1 rounded-xl border border-accent/20 bg-bg-card/60 p-4">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-medium text-muted">
                  {times[hiddenSurprises[0].index]?.startTime || ''} – {times[hiddenSurprises[hiddenSurprises.length - 1].index]?.endTime || ''}
                </span>
                <Badge variant="upcoming">Up Next</Badge>
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                🎁 {hiddenSurprises.length === 1 ? 'Surprise Awaits!' : `${hiddenSurprises.length} Surprises Await!`}
              </h3>
              <p className="mt-1 text-sm text-muted">
                Stay tuned — something special is coming!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
