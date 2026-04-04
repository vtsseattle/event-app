'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { Photo } from '@/lib/types';
import { getPhotosRef, addDocument } from '@/lib/firestore';
import { db, auth } from '@/lib/firebase';
import { uploadPhoto } from '@/lib/storage';
import { useEventId } from '@/contexts/EventContext';

const PHOTO_RATE_LIMIT_MS = 5000;

export function usePhotos(statusFilter?: 'approved' | 'pending' | 'all') {
  const eventId = useEventId();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const lastUploadTime = useRef(0);

  useEffect(() => {
    if (!db) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    const constraints =
      statusFilter === 'all' || !statusFilter
        ? [orderBy('createdAt', 'desc')]
        : [where('status', '==', statusFilter), orderBy('createdAt', 'desc')];

    const q = query(getPhotosRef(eventId), ...constraints);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Photo[];
        setPhotos(items);
        setLoading(false);
      },
      (error) => {
        console.error('[usePhotos] Firestore query error:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [statusFilter, eventId]);

  const submitPhoto = useCallback(async (file: File, caption: string) => {
    if (!db || !auth?.currentUser) return;

    const now = Date.now();
    if (now - lastUploadTime.current < PHOTO_RATE_LIMIT_MS) return;
    lastUploadTime.current = now;

    const displayName =
      (typeof window !== 'undefined' && localStorage.getItem(`${eventId}_displayName`)) || 'Anonymous';

    const imageUrl = await uploadPhoto(eventId, auth.currentUser.uid, file);

    await addDocument(getPhotosRef(eventId), {
      imageUrl,
      caption: caption.trim().slice(0, 150),
      viewerId: auth.currentUser.uid,
      displayName,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  }, [eventId]);

  return { photos, submitPhoto, loading };
}
