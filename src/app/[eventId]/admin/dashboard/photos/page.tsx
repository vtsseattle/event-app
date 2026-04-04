'use client';

import { useState, useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { usePhotos } from '@/hooks/usePhotos';
import { useEventId } from '@/contexts/EventContext';
import { getPhotosRef, updateDocument, deleteDocument } from '@/lib/firestore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type Filter = 'all' | 'pending' | 'approved' | 'rejected';

export default function PhotoModerationPage() {
  const { photos, loading } = usePhotos('all');
  const eventId = useEventId();
  const [filter, setFilter] = useState<Filter>('pending');

  const filtered = useMemo(() => {
    if (filter === 'all') return photos;
    return photos.filter((p) => p.status === filter);
  }, [photos, filter]);

  async function approvePhoto(id: string) {
    const ref = doc(getPhotosRef(eventId), id);
    await updateDocument(ref, { status: 'approved' });
  }

  async function rejectPhoto(id: string) {
    const ref = doc(getPhotosRef(eventId), id);
    await updateDocument(ref, { status: 'rejected' });
  }

  async function deletePhoto(id: string) {
    const ref = doc(getPhotosRef(eventId), id);
    await deleteDocument(ref);
  }

  if (loading) {
    return <div className="text-muted py-20 text-center">Loading…</div>;
  }

  const counts = {
    all: photos.length,
    pending: photos.filter((p) => p.status === 'pending').length,
    approved: photos.filter((p) => p.status === 'approved').length,
    rejected: photos.filter((p) => p.status === 'rejected').length,
  };

  const filters: { key: Filter; label: string }[] = [
    { key: 'pending', label: `⏳ Pending (${counts.pending})` },
    { key: 'approved', label: `✅ Approved (${counts.approved})` },
    { key: 'all', label: `All (${counts.all})` },
    { key: 'rejected', label: `❌ Rejected (${counts.rejected})` },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">
        Photo Moderation
      </h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-accent/20 text-accent-light'
                : 'bg-white/5 text-muted hover:text-foreground hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((photo) => (
          <Card key={photo.id} padding={false}>
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.imageUrl}
                alt={photo.caption || 'User photo'}
                className="w-full aspect-[4/3] object-cover rounded-t-xl"
                loading="lazy"
              />
              {photo.status === 'pending' && (
                <span className="absolute top-2 right-2 rounded-full bg-yellow-500/90 px-2 py-0.5 text-xs font-medium text-black">
                  Pending
                </span>
              )}
              {photo.status === 'approved' && (
                <span className="absolute top-2 right-2 rounded-full bg-green-500/90 px-2 py-0.5 text-xs font-medium text-black">
                  Approved
                </span>
              )}
              {photo.status === 'rejected' && (
                <span className="absolute top-2 right-2 rounded-full bg-red-500/90 px-2 py-0.5 text-xs font-medium text-white">
                  Rejected
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-foreground text-sm">
                  {photo.displayName}
                </span>
                {photo.createdAt && (
                  <span className="text-xs text-muted">
                    {photo.createdAt.toDate?.()
                      ? photo.createdAt.toDate().toLocaleTimeString()
                      : ''}
                  </span>
                )}
              </div>
              {photo.caption && (
                <p className="text-sm text-muted mb-3">{photo.caption}</p>
              )}
              <div className="flex items-center gap-2">
                {photo.status !== 'approved' && (
                  <Button variant="primary" size="sm" onClick={() => approvePhoto(photo.id)}>
                    ✅ Approve
                  </Button>
                )}
                {photo.status !== 'rejected' && photo.status !== 'approved' && (
                  <Button variant="secondary" size="sm" onClick={() => rejectPhoto(photo.id)}>
                    ❌ Reject
                  </Button>
                )}
                {photo.status === 'approved' && (
                  <Button variant="secondary" size="sm" onClick={() => rejectPhoto(photo.id)}>
                    Remove from Wall
                  </Button>
                )}
                <Button variant="danger" size="sm" onClick={() => deletePhoto(photo.id)}>
                  🗑️ Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-muted text-sm text-center py-10">
            {filter === 'pending'
              ? 'No photos waiting for approval.'
              : filter === 'approved'
                ? 'No approved photos yet.'
                : filter === 'rejected'
                  ? 'No rejected photos.'
                  : 'No photos uploaded yet.'}
          </div>
        )}
      </div>
    </div>
  );
}
