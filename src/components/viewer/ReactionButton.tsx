'use client';

import { useState } from 'react';

interface ReactionButtonProps {
  emoji: string;
  count: number;
  onClick: () => void;
  disabled?: boolean;
}

export default function ReactionButton({ emoji, count, onClick, disabled }: ReactionButtonProps) {
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setPressed(true);
    onClick();
    setTimeout(() => setPressed(false), 300);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1.5 disabled:opacity-40"
    >
      <span
        className={`flex h-[60px] w-[60px] items-center justify-center rounded-full border border-white/10 bg-bg-card text-3xl shadow-lg transition-transform ${
          pressed ? 'animate-[reactionPop_0.3s_ease-out]' : ''
        } active:scale-90`}
      >
        {emoji}
      </span>
      <span className="text-xs font-medium tabular-nums text-muted">
        {count > 0 ? count.toLocaleString() : ''}
      </span>
    </button>
  );
}
