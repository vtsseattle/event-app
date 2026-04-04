'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  serverTimestamp,
  runTransaction,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { Shoutout } from '@/lib/types';
import { getShoutoutsRef, addDocument } from '@/lib/firestore';
import { db, auth } from '@/lib/firebase';
import { useEventId } from '@/contexts/EventContext';

const SHOUTOUT_RATE_LIMIT_MS = 3000;

export function useShoutouts() {
  const eventId = useEventId();
  const [shoutouts, setShoutouts] = useState<Shoutout[]>([]);
  const [loading, setLoading] = useState(true);
  const lastShoutoutTime = useRef(0);

  useEffect(() => {
    if (!db) {
      setShoutouts([]);
      setLoading(false);
      return;
    }

    const q = query(
      getShoutoutsRef(eventId),
      where('status', 'in', ['visible', 'flagged']),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Shoutout[];
        setShoutouts(items);
        setLoading(false);
      },
      (error) => {
        console.error('[useShoutouts] Firestore query error:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [eventId]);

  const sendShoutout = useCallback(async (text: string) => {
    if (!db || !auth?.currentUser) return;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 200) return;

    const now = Date.now();
    if (now - lastShoutoutTime.current < SHOUTOUT_RATE_LIMIT_MS) return;
    lastShoutoutTime.current = now;

    const displayName =
      (typeof window !== 'undefined' && localStorage.getItem(`${eventId}_displayName`)) || 'Anonymous';

    await addDocument(getShoutoutsRef(eventId), {
      text: trimmed,
      viewerId: auth.currentUser.uid,
      displayName,
      upvotes: 0,
      upvotedBy: [],
      status: 'visible',
      createdAt: serverTimestamp(),
    });
  }, [eventId]);

  const toggleUpvote = useCallback(async (shoutoutId: string) => {
    if (!db || !auth?.currentUser) return;
    const uid = auth.currentUser.uid;
    const shoutoutRef = doc(getShoutoutsRef(eventId), shoutoutId);

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(shoutoutRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const upvotedBy: string[] = data.upvotedBy || [];
      const hasUpvoted = upvotedBy.includes(uid);

      if (hasUpvoted) {
        transaction.update(shoutoutRef, {
          upvotedBy: arrayRemove(uid),
          upvotes: (data.upvotes || 1) - 1,
        });
      } else {
        transaction.update(shoutoutRef, {
          upvotedBy: arrayUnion(uid),
          upvotes: (data.upvotes || 0) + 1,
        });
      }
    });
  }, [eventId]);

  return { shoutouts, sendShoutout, toggleUpvote, loading };
}
