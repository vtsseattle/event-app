'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useEvent } from '@/hooks/useEvent';
import { usePrograms } from '@/hooks/usePrograms';
import { useReactions } from '@/hooks/useReactions';

interface FloatingEmoji {
  id: string;
  emoji: string;
  left: number;
  size: number;
  drift: number;
}

export default function ReactionStream() {
  const { event } = useEvent();
  const { programs } = usePrograms();
  const { reactions, reactionCounts } = useReactions(event?.currentProgramId ?? null);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const prevCountRef = useRef(reactions.length);

  const currentProgram = programs.find((p) => p.id === event?.currentProgramId);

  const removeEmoji = useCallback((id: string) => {
    setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Spawn floating emojis when new reactions arrive
  useEffect(() => {
    if (reactions.length > prevCountRef.current) {
      const newReactions = reactions.slice(0, reactions.length - prevCountRef.current);
      const newEmojis: FloatingEmoji[] = newReactions.map((r) => ({
        id: `${r.id}-${Date.now()}-${Math.random()}`,
        emoji: r.emoji,
        left: Math.random() * 90 + 5,
        size: Math.random() * 24 + 48, // 48–72px for big screen
        drift: Math.random() * 80 - 40,
      }));
      setFloatingEmojis((prev) => [...prev, ...newEmojis]);
    }
    prevCountRef.current = reactions.length;
  }, [reactions]);

  // Auto-cleanup old emojis
  useEffect(() => {
    if (floatingEmojis.length === 0) return;
    const timer = setTimeout(() => {
      setFloatingEmojis((prev) => prev.slice(Math.max(0, prev.length - 50)));
    }, 3000);
    return () => clearTimeout(timer);
  }, [floatingEmojis]);

  const emojiTypes = Object.entries(reactionCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-bg flex flex-col">
      {/* Hero Image Background */}
      {currentProgram?.heroImageUrl && (
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <Image
            src={currentProgram.heroImageUrl}
            alt={currentProgram.title}
            fill
            className="object-contain"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/40" />
        </div>
      )}

      {/* Program Title */}
      <div className="pt-12 pb-6 text-center z-10">
        {currentProgram ? (
          <>
            <p className="text-muted text-2xl uppercase tracking-widest mb-2">Now Playing</p>
            <h1 className="font-heading text-6xl lg:text-7xl text-gradient leading-tight">
              {currentProgram.title}
            </h1>
            {currentProgram.performers && (
              <p className="text-3xl text-foreground/70 mt-3">{currentProgram.performers}</p>
            )}
          </>
        ) : (
          <h1 className="font-heading text-6xl text-gradient">{event?.name || 'Event'}</h1>
        )}
      </div>

      {/* Floating Emojis Area */}
      <div className="flex-1 relative">
        {floatingEmojis.map((fe) => (
          <span
            key={fe.id}
            className="pointer-events-none absolute bottom-0"
            style={{
              left: `${fe.left}%`,
              fontSize: `${fe.size}px`,
              ['--drift' as string]: `${fe.drift}px`,
              animation: 'floatUp 3s ease-out forwards',
            }}
            onAnimationEnd={() => removeEmoji(fe.id)}
          >
            {fe.emoji}
          </span>
        ))}
      </div>

      {/* Reaction Counts Bar */}
      {emojiTypes.length > 0 && (
        <div className="z-10 px-8 pb-8">
          <div className="flex justify-center gap-8 bg-bg-card/80 backdrop-blur rounded-2xl px-10 py-6 border border-accent/20">
            {emojiTypes.map(([emoji, count]) => (
              <div key={emoji} className="flex items-center gap-3">
                <span className="text-5xl">{emoji}</span>
                <span className="text-4xl font-bold text-accent-light tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
