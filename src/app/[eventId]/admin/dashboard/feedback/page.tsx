'use client';

import { useMemo } from 'react';
import { useFeedback } from '@/hooks/useFeedback';
import Card from '@/components/ui/Card';

const ENJOYED_LABELS: Record<string, string> = {
  performances: '🎭 Performances',
  food: '🍽️ Food',
  decorations: '🎨 Decorations',
  trivia: '🧠 Trivia',
  photos: '📸 Photo Wall',
  shoutouts: '💬 Shoutouts',
  emcee: '🎤 Emcee',
  networking: '👥 Networking',
};

const IMPROVE_LABELS: Record<string, string> = {
  sound: '🔊 Sound / AV',
  seating: '💺 Seating',
  timing: '⏰ Timing',
  food: '🍽️ Food',
  activities: '🎯 More Activities',
  app: '📱 App Experience',
  parking: '🅿️ Parking',
  communication: '📋 Communication',
};

function TagCloud({ counts, labels, total }: { counts: Record<string, number>; labels: Record<string, string>; total: number }) {
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return <p className="text-xs text-muted">No selections yet</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {sorted.map(([key, count]) => (
        <span
          key={key}
          className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-foreground"
        >
          {labels[key] || key} <span className="text-accent font-medium ml-1">{count} ({Math.round((count / total) * 100)}%)</span>
        </span>
      ))}
    </div>
  );
}

export default function AdminFeedbackPage() {
  const { feedback, loading } = useFeedback();

  const stats = useMemo(() => {
    if (feedback.length === 0) return null;
    const total = feedback.length;
    const avgRating = feedback.reduce((sum, f) => sum + f.rating, 0) / total;
    const distribution = [0, 0, 0, 0, 0];
    const enjoyedCounts: Record<string, number> = {};
    const improveCounts: Record<string, number> = {};

    feedback.forEach((f) => {
      if (f.rating >= 1 && f.rating <= 5) distribution[f.rating - 1]++;
      (f.enjoyed || []).forEach((v) => { enjoyedCounts[v] = (enjoyedCounts[v] || 0) + 1; });
      (f.improve || []).forEach((v) => { improveCounts[v] = (improveCounts[v] || 0) + 1; });
    });
    return { total, avgRating, distribution, enjoyedCounts, improveCounts };
  }, [feedback]);

  if (loading) {
    return <div className="text-muted py-20 text-center">Loading…</div>;
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">
        Anonymous Feedback
      </h1>

      {/* Stats summary */}
      {stats && (
        <div className="space-y-4 mb-6">
          <Card>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-accent">{stats.avgRating.toFixed(1)}</p>
                <p className="text-xs text-muted mt-1">Average Rating</p>
                <div className="text-lg mt-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={i < Math.round(stats.avgRating) ? '' : 'opacity-20'}>
                      ⭐
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted mb-2">{stats.total} response{stats.total !== 1 ? 's' : ''}</p>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.distribution[star - 1];
                  const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted w-4 text-right">{star}</span>
                      <span className="text-xs">⭐</span>
                      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-medium text-foreground mb-3">✅ Most Enjoyed</h2>
            <TagCloud counts={stats.enjoyedCounts} labels={ENJOYED_LABELS} total={stats.total} />
          </Card>

          <Card>
            <h2 className="text-sm font-medium text-foreground mb-3">🔧 Areas to Improve</h2>
            <TagCloud counts={stats.improveCounts} labels={IMPROVE_LABELS} total={stats.total} />
          </Card>
        </div>
      )}

      {/* Individual feedback entries */}
      <h2 className="text-sm font-medium text-foreground mb-3">All Responses</h2>
      <div className="space-y-3">
        {feedback.map((f) => (
          <Card key={f.id}>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-sm">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={i < f.rating ? '' : 'opacity-20'}>
                    ⭐
                  </span>
                ))}
              </div>
              {f.createdAt && (
                <span className="text-xs text-muted ml-auto">
                  {f.createdAt.toDate?.()
                    ? f.createdAt.toDate().toLocaleDateString()
                    : ''}
                </span>
              )}
            </div>
            {(f.enjoyed?.length > 0 || f.improve?.length > 0) && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(f.enjoyed || []).map((v) => (
                  <span key={`e-${v}`} className="rounded-full bg-success/10 text-success px-2 py-0.5 text-xs">
                    {ENJOYED_LABELS[v] || v}
                  </span>
                ))}
                {(f.improve || []).map((v) => (
                  <span key={`i-${v}`} className="rounded-full bg-danger/10 text-danger px-2 py-0.5 text-xs">
                    {IMPROVE_LABELS[v] || v}
                  </span>
                ))}
              </div>
            )}
            {f.comment && (
              <p className="text-foreground text-sm whitespace-pre-wrap">{f.comment}</p>
            )}
          </Card>
        ))}

        {feedback.length === 0 && (
          <p className="text-muted text-sm text-center py-10">
            No feedback received yet.
          </p>
        )}
      </div>
    </div>
  );
}
