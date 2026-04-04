'use client';

import { useEffect, useState } from 'react';

interface FloatingEmojiProps {
  emoji: string;
  id: string;
  onComplete?: () => void;
}

export default function FloatingEmoji({ emoji, id, onComplete }: FloatingEmojiProps) {
  const [drift] = useState(() => Math.random() * 60 - 30);
  const [left] = useState(() => Math.random() * 80 + 10);
  const [size] = useState(() => Math.random() * 12 + 24);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <span
      key={id}
      className="pointer-events-none absolute bottom-0"
      style={{
        left: `${left}%`,
        fontSize: `${size}px`,
        ['--drift' as string]: `${drift}px`,
        animation: 'floatUp 2s ease-out forwards',
      }}
    >
      {emoji}
    </span>
  );
}
