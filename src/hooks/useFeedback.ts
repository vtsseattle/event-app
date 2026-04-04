'use client';

import { useState, useEffect, useCallback } from 'react';
import { onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Feedback } from '@/lib/types';
import { getFeedbackRef, addDocument } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { useEventId } from '@/contexts/EventContext';

export function useFeedback() {
  const eventId = useEventId();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setFeedback([]);
      setLoading(false);
      return;
    }

    const q = query(getFeedbackRef(eventId), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Feedback[];
        setFeedback(items);
        setLoading(false);
      },
      (error) => {
        console.error('[useFeedback] Firestore query error:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [eventId]);

  const submitFeedback = useCallback(async (data: {
    rating: number;
    enjoyed: string[];
    improve: string[];
    comment: string;
  }) => {
    if (!db) return;
    if (data.rating < 1 || data.rating > 5) return;

    await addDocument(getFeedbackRef(eventId), {
      rating: data.rating,
      enjoyed: data.enjoyed,
      improve: data.improve,
      comment: data.comment.trim().slice(0, 500),
      createdAt: serverTimestamp(),
    });
  }, [eventId]);

  return { feedback, submitFeedback, loading };
}
