'use client';

import { useState, useEffect, useMemo } from 'react';
import { useShoutouts } from '@/hooks/useShoutouts';

export default function ShoutoutDisplay() {
  const { shoutouts } = useShoutouts();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const flaggedShoutouts = useMemo(
    () => shoutouts.filter((s) => s.status === 'flagged'),
    [shoutouts]
  );

  // Auto-rotate every 6 seconds with fade transition
  useEffect(() => {
    if (flaggedShoutouts.length <= 1) return;

    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % flaggedShoutouts.length);
        setFade(true);
      }, 500);
    }, 6000);

    return () => clearInterval(interval);
  }, [flaggedShoutouts.length]);

  // Reset index if it exceeds available shoutouts
  useEffect(() => {
    if (currentIndex >= flaggedShoutouts.length) {
      setCurrentIndex(0);
    }
  }, [flaggedShoutouts.length, currentIndex]);

  if (flaggedShoutouts.length === 0) {
    return (
      <div className="h-screen w-screen bg-bg flex items-center justify-center">
        <div className="text-center px-16">
          <p className="text-5xl lg:text-6xl font-heading text-gradient mb-6">
            Share your thoughts!
          </p>
          <p className="text-3xl text-foreground/60">
            Send a shoutout from your phone 📱
          </p>
        </div>
      </div>
    );
  }

  const current = flaggedShoutouts[currentIndex];

  return (
    <div className="h-screen w-screen bg-bg flex items-center justify-center p-16">
      <div
        className="max-w-5xl w-full transition-opacity duration-500"
        style={{ opacity: fade ? 1 : 0 }}
      >
        {/* Shoutout Card */}
        <div className="relative rounded-3xl bg-bg-card border-2 border-accent/40 p-16 shadow-2xl">
          {/* Gold corner accents */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-accent rounded-tl-3xl" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-accent rounded-tr-3xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-accent rounded-bl-3xl" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-accent rounded-br-3xl" />

          {/* Quote mark */}
          <div className="text-accent/30 text-9xl font-serif leading-none mb-4 select-none">&ldquo;</div>

          {/* Message */}
          <p className="text-4xl lg:text-5xl text-foreground leading-relaxed mb-10">
            {current.text}
          </p>

          {/* Author */}
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-accent rounded-full" />
            <p className="text-2xl text-accent-light font-medium">
              — {current.displayName}
            </p>
          </div>
        </div>

        {/* Progress dots */}
        {flaggedShoutouts.length > 1 && (
          <div className="flex justify-center gap-3 mt-8">
            {flaggedShoutouts.map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  i === currentIndex ? 'bg-accent' : 'bg-foreground/20'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
