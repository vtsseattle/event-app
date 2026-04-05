'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useEvent } from '@/hooks/useEvent';
import { useRsvp } from '@/hooks/useRsvp';
import { useEventId } from '@/contexts/EventContext';
import { getEventRef } from '@/lib/firestore';
import { updateDoc } from 'firebase/firestore';
import { uploadFlyer } from '@/lib/storage';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export default function AdminRsvpPage() {
  const eventId = useEventId();
  const { event } = useEvent();
  const { rsvps, counts, loading } = useRsvp();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFlyerUpload(file: File) {
    setUploading(true);
    try {
      const url = await uploadFlyer(eventId, file);
      await updateDoc(getEventRef(eventId), { flyerUrl: url });
    } catch (error) {
      console.error('Error uploading flyer:', error);
    } finally {
      setUploading(false);
    }
  }

  async function removeFLyer() {
    try {
      await updateDoc(getEventRef(eventId), { flyerUrl: null });
    } catch (error) {
      console.error('Error removing flyer:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">
        RSVPs
      </h1>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <p className="text-muted text-sm mb-1">Going</p>
          <p className="text-3xl font-bold text-accent-light">{counts.going}</p>
        </Card>
        <Card>
          <p className="text-muted text-sm mb-1">Maybe</p>
          <p className="text-3xl font-bold text-accent-light">{counts.maybe}</p>
        </Card>
        <Card>
          <p className="text-muted text-sm mb-1">Can&apos;t Make It</p>
          <p className="text-3xl font-bold text-accent-light">{counts.notGoing}</p>
        </Card>
        <Card>
          <p className="text-muted text-sm mb-1">Expected Guests</p>
          <p className="text-3xl font-bold text-accent-light">{counts.totalGuests}</p>
        </Card>
      </div>

      {/* Flyer management */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Event Flyer
        </h2>
        <Card>
          {event?.flyerUrl ? (
            <div className="flex flex-col gap-3">
              <Image
                src={event.flyerUrl}
                alt="Event flyer"
                width={300}
                height={400}
                className="rounded-lg object-contain max-h-64 w-auto"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-accent hover:underline"
                >
                  Replace
                </button>
                <button
                  onClick={removeFLyer}
                  className="text-sm text-danger hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-white/20 py-8 text-muted hover:border-accent/50 hover:text-foreground transition-colors"
            >
              <span className="text-3xl">📄</span>
              <span className="text-sm">
                {uploading ? 'Uploading…' : 'Upload event flyer'}
              </span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFlyerUpload(file);
              e.target.value = '';
            }}
          />
        </Card>
      </div>

      {/* RSVP list */}
      <h2 className="text-lg font-semibold text-foreground mb-3">
        All RSVPs
      </h2>

      {rsvps.length === 0 ? (
        <p className="text-muted text-sm">No RSVPs yet.</p>
      ) : (
        <div className="space-y-3">
          {rsvps.map((rsvp) => (
            <Card key={rsvp.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{rsvp.name}</p>
                  {rsvp.email && (
                    <p className="text-sm text-muted">{rsvp.email}</p>
                  )}
                  {rsvp.phone && (
                    <p className="text-sm text-muted">{rsvp.phone}</p>
                  )}
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <Badge
                    variant={
                      rsvp.status === 'going'
                        ? 'live'
                        : rsvp.status === 'maybe'
                        ? 'upcoming'
                        : 'completed'
                    }
                  >
                    {rsvp.status === 'going'
                      ? '✅ Going'
                      : rsvp.status === 'maybe'
                      ? '🤔 Maybe'
                      : '❌ Not Going'}
                  </Badge>
                  {rsvp.numberOfGuests > 0 && (
                    <p className="text-xs text-muted">
                      {rsvp.numberOfGuests} {rsvp.numberOfGuests === 1 ? 'guest' : 'guests'}
                    </p>
                  )}
                </div>
              </div>
              {rsvp.createdAt && (
                <p className="mt-2 text-xs text-muted">
                  {rsvp.createdAt.toDate?.().toLocaleString() ?? ''}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
