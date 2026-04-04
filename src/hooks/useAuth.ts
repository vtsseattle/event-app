'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { signInAnonymously } from '@/lib/auth';
import { getViewersRef } from '@/lib/firestore';

function deriveInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

export function useAuth(eventId?: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (displayName: string) => {
    if (!eventId) throw new Error('eventId is required for sign in');
    const firebaseUser = await signInAnonymously();
    const viewerRef = doc(getViewersRef(eventId), firebaseUser.uid);
    await setDoc(
      viewerRef,
      {
        displayName,
        initials: deriveInitials(displayName),
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        isOnline: true,
      },
      { merge: true }
    );
    return firebaseUser;
  }, [eventId]);

  const signOut = useCallback(async () => {
    if (auth.currentUser && eventId) {
      const viewerRef = doc(getViewersRef(eventId), auth.currentUser.uid);
      await setDoc(viewerRef, { isOnline: false }, { merge: true });
    }
    await auth.signOut();
  }, [eventId]);

  return { user, loading, signIn, signOut };
}
