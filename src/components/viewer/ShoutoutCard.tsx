'use client';

import type { Shoutout } from '@/lib/types';

interface ShoutoutCardProps {
  shoutout: Shoutout;
  onUpvote: (id: string) => void;
  isUpvoted: boolean;
}

function timeAgo(ts: { seconds: number } | null): string {
  if (!ts) return 'just now';
  const seconds = Math.floor(Date.now() / 1000 - ts.seconds);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function ShoutoutCard({ shoutout, onUpvote, isUpvoted }: ShoutoutCardProps) {
  return (
    <div
      className="rounded-xl border border-white/5 bg-bg-card p-4"
      style={{ animation: 'fadeIn 0.3s ease-out' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-semibold text-accent-light">
              {shoutout.displayName}
            </span>
            <span className="text-xs text-muted">
              {timeAgo(shoutout.createdAt as unknown as { seconds: number })}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{shoutout.text}</p>
        </div>

        <button
          type="button"
          onClick={() => onUpvote(shoutout.id)}
          className={`flex flex-shrink-0 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-colors ${
            isUpvoted
              ? 'bg-pink/15 text-pink'
              : 'text-muted hover:bg-white/5 hover:text-pink'
          }`}
        >
          <span className="text-base">{isUpvoted ? '❤️' : '🤍'}</span>
          <span className="text-xs font-medium tabular-nums">
            {shoutout.upvotes || 0}
          </span>
        </button>
      </div>
    </div>
  );
}
