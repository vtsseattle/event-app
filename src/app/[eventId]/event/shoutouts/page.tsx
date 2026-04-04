'use client';

import { useState } from 'react';
import { useShoutouts } from '@/hooks/useShoutouts';
import { useAuthContext } from '@/contexts/AuthContext';
import ShoutoutCard from '@/components/viewer/ShoutoutCard';
import Button from '@/components/ui/Button';

const MAX_LENGTH = 200;

export default function ShoutoutsPage() {
  const { shoutouts, sendShoutout, toggleUpvote, loading } = useShoutouts();
  const { user } = useAuthContext();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const charCount = text.length;
  const isOverLimit = charCount > MAX_LENGTH;
  const canSend = text.trim().length > 0 && !isOverLimit && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    await sendShoutout(text);
    setText('');
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col px-4 pt-4">
      {/* Input area — sticky top */}
      <div className="mb-4 rounded-xl border border-white/10 bg-bg-card p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share a shoutout with the crowd..."
            maxLength={MAX_LENGTH + 10}
            className="flex-1 rounded-lg border border-white/10 bg-bg px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <Button
            onClick={handleSend}
            disabled={!canSend}
            size="md"
            className="flex-shrink-0"
          >
            Send 🎤
          </Button>
        </div>
        <div className="mt-1.5 flex justify-end">
          <span
            className={`text-xs tabular-nums ${
              isOverLimit ? 'text-danger' : charCount > MAX_LENGTH * 0.8 ? 'text-accent' : 'text-muted'
            }`}
          >
            {charCount}/{MAX_LENGTH}
          </span>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-white/5 bg-bg-card p-4"
              >
                <div className="mb-2 h-3 w-24 rounded bg-white/10" />
                <div className="h-4 w-full rounded bg-white/5" />
                <div className="mt-1 h-4 w-2/3 rounded bg-white/5" />
              </div>
            ))}
          </div>
        ) : shoutouts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 pt-16 text-center">
            <span className="text-4xl">🎤</span>
            <p className="font-heading text-lg font-semibold text-foreground">
              Be the first to shout out!
            </p>
            <p className="text-sm text-muted">
              Share your love for the performers
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-4">
            {shoutouts.map((shoutout) => (
              <ShoutoutCard
                key={shoutout.id}
                shoutout={shoutout}
                onUpvote={toggleUpvote}
                isUpvoted={
                  !!user && Array.isArray(shoutout.upvotedBy) && shoutout.upvotedBy.includes(user.uid)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
