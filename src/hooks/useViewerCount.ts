'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, query, where } from 'firebase/firestore';
import { getViewersRef } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { useEventId } from '@/contexts/EventContext';

export function useViewerCount() {
  const eventId = useEventId();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setCount(0);
      setLoading(false);
      return;
    }

    const q = query(getViewersRef(eventId), where('isOnline', '==', true));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCount(snapshot.size);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => unsubscribe();
  }, [eventId]);

  return { count, loading };
}
