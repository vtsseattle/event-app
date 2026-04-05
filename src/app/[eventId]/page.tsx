'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEvent } from '@/hooks/useEvent';
import { useEventId } from '@/contexts/EventContext';

export default function EventLandingPage() {
  const { event, loading } = useEvent();
  const eventId = useEventId();
  const router = useRouter();

  useEffect(() => {
    if (loading || !event) return;

    const phase = event.phase || 'live';

    if (phase === 'rsvp' && event.features?.rsvp !== false) {
      router.replace(`/${eventId}/rsvp`);
    } else if (phase === 'ended') {
      // Stay on this page — show ended UI below
    } else {
      router.replace(`/${eventId}/join`);
    }
  }, [event, loading, eventId, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
          Event Not Found
        </h1>
        <p className="text-muted">This event doesn&apos;t exist or has been removed.</p>
      </div>
    );
  }

  // Ended phase UI
  if (event.phase === 'ended') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="animate-[fadeIn_0.6s_ease-out]">
          <span className="text-6xl mb-4 block">🎭</span>
          <h1 className="text-gradient font-heading text-4xl font-bold tracking-tight">
            {event.name}
          </h1>
          {event.tagline && (
            <p className="mt-2 text-muted">{event.tagline}</p>
          )}
          <p className="mt-6 text-lg text-foreground">
            This event has ended. Thank you for being a part of it!
          </p>
        </div>
      </div>
    );
  }

  // Loading / redirecting state
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}
