'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, query, orderBy } from 'firebase/firestore';
import { Program } from '@/lib/types';
import { getProgramsRef } from '@/lib/firestore';
import { useEventId } from '@/contexts/EventContext';

export function usePrograms() {
  const eventId = useEventId();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(getProgramsRef(eventId), orderBy('order'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Program[];
        setPrograms(items);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsubscribe();
  }, [eventId]);

  return { programs, loading };
}
