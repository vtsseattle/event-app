'use client';

import { useState, useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useShoutouts } from '@/hooks/useShoutouts';
import { useEventId } from '@/contexts/EventContext';
import { getShoutoutsRef, updateDocument } from '@/lib/firestore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type Filter = 'all' | 'featured' | 'visible';

export default function ShoutoutsModerationPage() {
  const { shoutouts, loading } = useShoutouts();
  const eventId = useEventId();
  const [filter, setFilter] = useState<Filter>('all');

  // The hook already excludes 'deleted', so we need to also fetch deleted ones
  // for admin. We'll work with what we have and show the filter on available data.
  const filtered = useMemo(() => {
    switch (filter) {
      case 'featured':
        return shoutouts.filter((s) => s.status === 'flagged');
      case 'visible':
        return shoutouts.filter((s) => s.status === 'visible');
      default:
        return shoutouts;
    }
  }, [shoutouts, filter]);

  async function flagForStage(id: string) {
    const ref = doc(getShoutoutsRef(eventId), id);
    await updateDocument(ref, { status: 'flagged' });
  }

  async function deleteShoutout(id: string) {
    const ref = doc(getShoutoutsRef(eventId), id);
    await updateDocument(ref, { status: 'deleted' });
  }

  async function unflag(id: string) {
    const ref = doc(getShoutoutsRef(eventId), id);
    await updateDocument(ref, { status: 'visible' });
  }

  if (loading) {
    return <div className="text-muted py-20 text-center">Loading…</div>;
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: `All (${shoutouts.length})` },
    { key: 'featured', label: `📺 On Screen (${shoutouts.filter((s) => s.status === 'flagged').length})` },
    { key: 'visible', label: `Visible (${shoutouts.filter((s) => s.status === 'visible').length})` },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">
        Shoutout Moderation
      </h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
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

      {/* Shoutout feed */}
      <div className="space-y-3">
        {filtered.map((s) => (
          <Card key={s.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-foreground text-sm">
                  {s.displayName}
                </span>
                {s.status === 'flagged' && (
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent-light">
                    � On Big Screen
                  </span>
                )}
              </div>
              <p className="text-foreground">{s.text}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                <span>👍 {s.upvotes}</span>
                {s.createdAt && (
                  <span>
                    {s.createdAt.toDate?.()
                      ? s.createdAt.toDate().toLocaleTimeString()
                      : ''}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {s.status === 'flagged' ? (
                <Button variant="secondary" size="sm" onClick={() => unflag(s.id)}>
                  Remove from Screen
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => flagForStage(s.id)}>
                  📺 Show on Screen
                </Button>
              )}
              <Button variant="danger" size="sm" onClick={() => deleteShoutout(s.id)}>
                🗑️ Delete
              </Button>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <p className="text-muted text-sm text-center py-10">
            {filter === 'all'
              ? 'No shoutouts yet.'
              : filter === 'featured'
                ? 'No shoutouts featured on the big screen yet.'
                : 'No visible shoutouts.'}
          </p>
        )}
      </div>
    </div>
  );
}
