'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { Reaction } from '@/lib/types';
import { getReactionsRef, addDocument } from '@/lib/firestore';
import { db, auth } from '@/lib/firebase';
import { useEventId } from '@/contexts/EventContext';

export function useReactions(programId: string | null) {
  const eventId = useEventId();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const lastReactionTime = useRef(0);

  useEffect(() => {
    if (!db || !programId) {
      setReactions([]);
      setLoading(false);
      return;
    }

    const q = query(getReactionsRef(eventId), where('programId', '==', programId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Reaction[];
        setReactions(items);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => unsubscribe();
  }, [programId, eventId]);

  const reactionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of reactions) {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    }
    return counts;
  }, [reactions]);

  const sendReaction = useCallback(async (emoji: string) => {
    if (!db || !auth?.currentUser || !programId) return;

    const now = Date.now();
    if (now - lastReactionTime.current < 500) return;
    lastReactionTime.current = now;

    await addDocument(getReactionsRef(eventId), {
      emoji,
      viewerId: auth.currentUser.uid,
      programId,
      createdAt: serverTimestamp(),
    });
  }, [programId, eventId]);

  return { reactions, reactionCounts, sendReaction, loading };
}
