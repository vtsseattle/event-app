'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { Pledge } from '@/lib/types';
import { getPledgesRef, addDocument } from '@/lib/firestore';
import { db, auth } from '@/lib/firebase';
import { useEventId } from '@/contexts/EventContext';
import { useEvent } from '@/hooks/useEvent';

const DEFAULT_COST_PER_CHILD = 365;

export function usePledges() {
  const eventId = useEventId();
  const { event } = useEvent();
  const costPerChild = event?.pledgeCostPerUnit ?? DEFAULT_COST_PER_CHILD;
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [loading, setLoading] = useState(true);
  const submitting = useRef(false);

  useEffect(() => {
    if (!db) {
      setPledges([]);
      setLoading(false);
      return;
    }

    const q = query(getPledgesRef(eventId), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Pledge[];
        setPledges(items);
        setLoading(false);
      },
      (error) => {
        console.error('[usePledges] Firestore query error:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [eventId]);

  const submitPledge = useCallback(
    async (data: {
      name: string;
      email: string;
      phone: string;
      numberOfKids: number;
    }) => {
      if (!db || !auth?.currentUser) return false;
      if (submitting.current) return false;

      const trimmedName = data.name.trim();
      const trimmedEmail = data.email.trim();
      const trimmedPhone = data.phone.trim();

      if (!trimmedName || !trimmedEmail || data.numberOfKids < 1) return false;

      submitting.current = true;
      try {
        await addDocument(getPledgesRef(eventId), {
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          numberOfKids: data.numberOfKids,
          totalAmount: data.numberOfKids * costPerChild,
          viewerId: auth.currentUser.uid,
          createdAt: serverTimestamp(),
        });
        return true;
      } catch (error) {
        console.error('[usePledges] Error submitting pledge:', error);
        return false;
      } finally {
        submitting.current = false;
      }
    },
    [eventId, costPerChild],
  );

  const totalKids = pledges.reduce((sum, p) => sum + p.numberOfKids, 0);
  const totalAmount = pledges.reduce((sum, p) => sum + p.totalAmount, 0);

  return { pledges, submitPledge, totalKids, totalAmount, costPerChild, loading };
}
