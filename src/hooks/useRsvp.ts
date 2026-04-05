'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { Rsvp } from '@/lib/types';
import { getRsvpsRef } from '@/lib/firestore';
import { db, auth } from '@/lib/firebase';
import { useEventId } from '@/contexts/EventContext';

export function useRsvp() {
  const eventId = useEventId();
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [myRsvp, setMyRsvp] = useState<Rsvp | null>(null);
  const [loading, setLoading] = useState(true);
  const [myRsvpLoading, setMyRsvpLoading] = useState(true);
  const submitting = useRef(false);

  // Listen to all RSVPs (for admin view / counts)
  useEffect(() => {
    if (!db) {
      setRsvps([]);
      setLoading(false);
      return;
    }

    const q = query(getRsvpsRef(eventId), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Rsvp[];
        setRsvps(items);
        setLoading(false);
      },
      (error) => {
        console.error('[useRsvp] Firestore query error:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [eventId]);

  // Load current user's RSVP
  useEffect(() => {
    if (!db) {
      setMyRsvpLoading(false);
      return;
    }

    async function loadMyRsvp() {
      try {
        if (!auth?.currentUser) {
          await signInAnonymously(auth);
        }
        const uid = auth.currentUser?.uid;
        if (!uid) {
          setMyRsvpLoading(false);
          return;
        }
        const docRef = doc(db, 'events', eventId, 'rsvps', uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setMyRsvp({ id: snap.id, ...snap.data() } as Rsvp);
        }
      } catch (error) {
        console.error('[useRsvp] Error loading my RSVP:', error);
      } finally {
        setMyRsvpLoading(false);
      }
    }

    loadMyRsvp();
  }, [eventId]);

  const submitRsvp = useCallback(
    async (data: {
      name: string;
      email: string;
      phone: string;
      status: 'going' | 'maybe' | 'not-going';
      numberOfGuests: number;
    }) => {
      if (!db) return false;
      if (submitting.current) return false;

      submitting.current = true;
      try {
        if (!auth?.currentUser) {
          await signInAnonymously(auth);
        }
        const uid = auth.currentUser?.uid;
        if (!uid) return false;

        const docRef = doc(db, 'events', eventId, 'rsvps', uid);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          // Update existing RSVP
          await updateDoc(docRef, {
            name: data.name.trim(),
            email: data.email.trim(),
            phone: data.phone.trim(),
            status: data.status,
            numberOfGuests: data.numberOfGuests,
            updatedAt: serverTimestamp(),
          });
        } else {
          // Create new RSVP
          await setDoc(docRef, {
            name: data.name.trim(),
            email: data.email.trim(),
            phone: data.phone.trim(),
            status: data.status,
            numberOfGuests: data.numberOfGuests,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        const updated = await getDoc(docRef);
        if (updated.exists()) {
          setMyRsvp({ id: updated.id, ...updated.data() } as Rsvp);
        }
        return true;
      } catch (error) {
        console.error('[useRsvp] Error submitting RSVP:', error);
        return false;
      } finally {
        submitting.current = false;
      }
    },
    [eventId],
  );

  const counts = {
    going: rsvps.filter((r) => r.status === 'going').length,
    maybe: rsvps.filter((r) => r.status === 'maybe').length,
    notGoing: rsvps.filter((r) => r.status === 'not-going').length,
    totalGuests: rsvps
      .filter((r) => r.status === 'going')
      .reduce((sum, r) => sum + (r.numberOfGuests || 1), 0),
  };

  return { rsvps, myRsvp, submitRsvp, counts, loading, myRsvpLoading };
}
