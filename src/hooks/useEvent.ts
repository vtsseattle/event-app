'use client';

import { useState, useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { Event } from '@/lib/types';
import { getEventRef } from '@/lib/firestore';
import { useEventId } from '@/contexts/EventContext';

export function useEvent() {
  const eventId = useEventId();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      getEventRef(eventId),
      (snapshot) => {
        if (snapshot.exists()) {
          setEvent(snapshot.data() as Event);
        } else {
          setEvent(null);
        }
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsubscribe();
  }, [eventId]);

  return { event, loading };
}
