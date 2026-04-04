'use client';

import { useState, useCallback, useRef } from 'react';
import { useEvent } from '@/hooks/useEvent';
import { usePrograms } from '@/hooks/usePrograms';
import { useReactions } from '@/hooks/useReactions';
import { useViewerCount } from '@/hooks/useViewerCount';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import FloatingEmoji from '@/components/viewer/FloatingEmoji';
import ReactionButton from '@/components/viewer/ReactionButton';

const EMOJI_OPTIONS = ['👏', '❤️', '🔥', '🎉', '🪷', '🙏'] as const;

interface FloatingItem {
  id: string;
  emoji: string;
}

export default function ReactPage() {
  const { event, loading: eventLoading } = useEvent();
  const { programs } = usePrograms();
  const { reactionCounts, sendReaction, reactions } = useReactions(
    event?.currentProgramId ?? null
  );
  const { count: viewerCount } = useViewerCount();
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingItem[]>([]);
  const [heroExpanded, setHeroExpanded] = useState(false);
  const idCounter = useRef(0);
  const prevReactionCount = useRef(0);

  // Seed floating emojis from latest incoming reactions
  const currentTotal = reactions.length;
  if (currentTotal > prevReactionCount.current && prevReactionCount.current > 0) {
    const newReactions = reactions.slice(0, currentTotal - prevReactionCount.current);
    const newFloats = newReactions.slice(0, 5).map((r) => ({
      id: `server-${r.id}`,
      emoji: r.emoji,
    }));
    if (newFloats.length > 0) {
      // Defer state update
      setTimeout(() => {
        setFloatingEmojis((prev) => [...prev, ...newFloats].slice(-30));
      }, 0);
    }
  }
  prevReactionCount.current = currentTotal;

  const handleReaction = useCallback(
    (emoji: string) => {
      sendReaction(emoji);
      const id = `local-${++idCounter.current}`;
      setFloatingEmojis((prev) => [...prev, { id, emoji }].slice(-30));
    },
    [sendReaction]
  );

  const removeFloating = useCallback((id: string) => {
    setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const currentProgram = programs.find((p) => p.id === event?.currentProgramId);

  if (eventLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] flex-col px-4 pt-4">
      {/* Stage area */}
      {currentProgram ? (
        <Card className="mb-3 border-accent/30 shadow-[0_0_24px_rgba(212,168,67,0.08)]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <Badge variant="live">NOW PERFORMING</Badge>
              <h2 className="mt-1 font-heading text-lg font-bold text-foreground">
                {currentProgram.emoji} {currentProgram.title}
              </h2>
              {currentProgram.performers && (
                <p className="text-sm text-muted">{currentProgram.performers}</p>
              )}
              {(currentProgram.heroImageUrl || currentProgram.description) && (
                <button
                  type="button"
                  onClick={() => setHeroExpanded((prev) => !prev)}
                  className="mt-1 text-xs text-accent hover:text-accent-light transition-colors text-left"
                >
                  {heroExpanded ? 'Show less ▴' : 'Learn more ▾'}
                </button>
              )}
            </div>
            {viewerCount > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                <span className="text-xs font-medium text-muted">{viewerCount}</span>
              </div>
            )}
          </div>
          {heroExpanded && (
            <div className="mt-3 border-t border-white/10 pt-3">
              {currentProgram.heroImageUrl && (
                <img
                  src={currentProgram.heroImageUrl}
                  alt={currentProgram.title}
                  className="w-full rounded-lg border border-white/10"
                />
              )}
              {currentProgram.description && (
                <p className="mt-2 text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                  {currentProgram.description}
                </p>
              )}
            </div>
          )}
        </Card>
      ) : (
        <Card className="mb-3">
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <span className="text-3xl">✨</span>
            <p className="font-heading text-base font-semibold text-foreground">
              Waiting for the next performance...
            </p>
            <p className="text-xs text-muted">
              Reactions will light up when a program goes live
            </p>
          </div>
        </Card>
      )}

      {/* Floating emoji zone */}
      <div className="relative flex-1 overflow-hidden">
        {floatingEmojis.map((item) => (
          <FloatingEmoji
            key={item.id}
            id={item.id}
            emoji={item.emoji}
            onComplete={() => removeFloating(item.id)}
          />
        ))}
      </div>

      {/* Reaction buttons grid */}
      <div className="pb-20 pt-2">
        <div className="grid grid-cols-3 justify-items-center gap-y-4">
          {EMOJI_OPTIONS.map((emoji) => (
            <ReactionButton
              key={emoji}
              emoji={emoji}
              count={reactionCounts[emoji] || 0}
              onClick={() => handleReaction(emoji)}
              disabled={!currentProgram}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
