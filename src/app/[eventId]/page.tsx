'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getEventRef } from '@/lib/firestore';
import { useEventId } from '@/contexts/EventContext';
import type { Event } from '@/lib/types';

export default function EventLandingPage() {
  const eventId = useEventId();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap: anonymously sign in (required by Firestore rules) and read the event.
  // We do this directly rather than via useEvent() because /rsvp signs in via useRsvp,
  // but this landing page has no other auth path — without this, fresh visitors on the
  // public URL hit "Event Not Found" because the Firestore read is denied.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (auth && !auth.currentUser) {
          await signInAnonymously(auth);
        }
        const snap = await getDoc(getEventRef(eventId));
        if (cancelled) return;
        if (snap.exists()) {
          setEvent(snap.data() as Event);
        }
      } catch (err) {
        console.error('[EventLandingPage] failed to load event', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

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
