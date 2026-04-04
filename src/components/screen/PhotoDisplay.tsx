'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePhotos } from '@/hooks/usePhotos';

export default function PhotoDisplay() {
  const { photos } = usePhotos('approved');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const approvedPhotos = useMemo(() => photos, [photos]);

  // Auto-rotate every 5 seconds with fade transition
  useEffect(() => {
    if (approvedPhotos.length <= 1) return;

    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % approvedPhotos.length);
        setFade(true);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, [approvedPhotos.length]);

  // Reset index if it exceeds available photos
  useEffect(() => {
    if (currentIndex >= approvedPhotos.length) {
      setCurrentIndex(0);
    }
  }, [approvedPhotos.length, currentIndex]);

  if (approvedPhotos.length === 0) {
    return (
      <div className="h-screen w-screen bg-bg flex items-center justify-center">
        <div className="text-center px-16">
          <p className="text-5xl lg:text-6xl font-heading text-gradient mb-6">
            Photo Wall
          </p>
          <p className="text-3xl text-foreground/60">
            Share photos from your phone 📸
          </p>
        </div>
      </div>
    );
  }

  const current = approvedPhotos[currentIndex];

  return (
    <div className="h-screen w-screen bg-bg flex items-center justify-center p-8">
      <div
        className="max-w-6xl w-full h-full flex flex-col items-center justify-center transition-opacity duration-500"
        style={{ opacity: fade ? 1 : 0 }}
      >
        {/* Photo */}
        <div className="relative flex-1 w-full flex items-center justify-center min-h-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.imageUrl}
            alt={current.caption || 'Event photo'}
            className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border-2 border-accent/30"
          />
        </div>

        {/* Caption & author */}
        <div className="mt-6 text-center">
          {current.caption && (
            <p className="text-3xl lg:text-4xl text-foreground mb-3 font-heading">
              &ldquo;{current.caption}&rdquo;
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-px bg-accent/40" />
            <p className="text-xl text-accent-light">
              📸 {current.displayName}
            </p>
            <div className="w-8 h-px bg-accent/40" />
          </div>
        </div>

        {/* Progress dots */}
        {approvedPhotos.length > 1 && (
          <div className="flex justify-center gap-3 mt-6">
            {approvedPhotos.slice(0, 20).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  i === currentIndex ? 'bg-accent' : 'bg-foreground/20'
                }`}
              />
            ))}
            {approvedPhotos.length > 20 && (
              <span className="text-muted text-sm ml-2">
                +{approvedPhotos.length - 20} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
