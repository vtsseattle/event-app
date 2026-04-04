'use client';

import { useEvent } from '@/hooks/useEvent';
import ReactionStream from '@/components/screen/ReactionStream';
import ShoutoutDisplay from '@/components/screen/ShoutoutDisplay';
import TriviaDisplay from '@/components/screen/TriviaDisplay';
import PhotoDisplay from '@/components/screen/PhotoDisplay';
import PledgeDisplay from '@/components/screen/PledgeDisplay';

export default function BigScreenPage() {
  const { event, loading } = useEvent();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-bg flex items-center justify-center">
        <div className="text-accent text-3xl animate-pulse">Loading...</div>
      </div>
    );
  }

  const mode = event?.bigScreenMode ?? '';

  return (
    <div className="h-screen w-screen overflow-hidden bg-bg">
      {/* Reactions Mode */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: mode === 'reactions' ? 1 : 0, pointerEvents: mode === 'reactions' ? 'auto' : 'none' }}
      >
        {mode === 'reactions' && <ReactionStream />}
      </div>

      {/* Shoutouts Mode */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: mode === 'shoutouts' ? 1 : 0, pointerEvents: mode === 'shoutouts' ? 'auto' : 'none' }}
      >
        {mode === 'shoutouts' && <ShoutoutDisplay />}
      </div>

      {/* Trivia Mode */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: mode === 'trivia' ? 1 : 0, pointerEvents: mode === 'trivia' ? 'auto' : 'none' }}
      >
        {mode === 'trivia' && <TriviaDisplay />}
      </div>

      {/* Photos Mode */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: mode === 'photos' ? 1 : 0, pointerEvents: mode === 'photos' ? 'auto' : 'none' }}
      >
        {mode === 'photos' && <PhotoDisplay />}
      </div>

      {/* Pledges Mode */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: mode === 'pledges' ? 1 : 0, pointerEvents: mode === 'pledges' ? 'auto' : 'none' }}
      >
        {mode === 'pledges' && <PledgeDisplay />}
      </div>

      {/* Idle / Default Mode */}
      <div
        className="absolute inset-0 transition-opacity duration-700 flex items-center justify-center"
        style={{ opacity: mode !== 'reactions' && mode !== 'shoutouts' && mode !== 'trivia' && mode !== 'photos' && mode !== 'pledges' ? 1 : 0 }}
      >
        <div className="text-center">
          <h1 className="font-heading text-8xl lg:text-9xl text-gradient mb-6">
            {event?.name || 'Event'}
          </h1>
          {event?.tagline && (
            <div className="mt-12 flex items-center justify-center gap-3">
              <div className="w-16 h-px bg-accent/40" />
              <p className="text-2xl text-muted tracking-widest uppercase">{event.tagline}</p>
              <div className="w-16 h-px bg-accent/40" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
