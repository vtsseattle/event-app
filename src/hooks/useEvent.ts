'use client';

import { useState, useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Event } from '@/lib/types';
import { getEventRef } from '@/lib/firestore';
import { auth } from '@/lib/firebase';
import { useEventId } from '@/contexts/EventContext';

export function useEvent() {
  const eventId = useEventId();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firestore rules require request.auth != null. Subscribing synchronously
    // here can race ahead of anonymous sign-in (done elsewhere — e.g. in
    // useRsvp or /join), causing a permission_denied that detaches the
    // listener with no retry. Wait for auth state before subscribing and
    // re-subscribe on auth changes.
    let unsubscribeSnap: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeSnap) {
        unsubscribeSnap();
        unsubscribeSnap = null;
      }

      if (!user) {
        // Not authenticated yet — stay in loading state until sign-in completes.
        return;
      }

      unsubscribeSnap = onSnapshot(
        getEventRef(eventId),
        (snapshot) => {
          if (snapshot.exists()) {
            setEvent(snapshot.data() as Event);
          } else {
            setEvent(null);
          }
          setLoading(false);
        },
        (error) => {
          console.error('[useEvent] Firestore error:', error);
          setLoading(false);
        },
      );
    });

    return () => {
      if (unsubscribeSnap) unsubscribeSnap();
      unsubscribeAuth();
    };
  }, [eventId]);

  return { event, loading };
}
