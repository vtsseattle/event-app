'use client';

import { useMemo } from 'react';
import { useTrivia } from '@/hooks/useTrivia';

export default function TriviaDisplay() {
  const { activeQuestion, getAnswerDistribution, leaderboard } = useTrivia();

  const dist = useMemo(
    () => (activeQuestion ? getAnswerDistribution(activeQuestion.id) : {}),
    [activeQuestion, getAnswerDistribution],
  );
  const totalAnswers = Object.values(dist).reduce((a, b) => a + b, 0);
  const isRevealed = activeQuestion?.status === 'revealed';

  // If no active question, show leaderboard
  if (!activeQuestion) {
    if (leaderboard.length === 0) {
      return (
        <div className="h-screen w-screen bg-bg flex items-center justify-center">
          <div className="text-center px-16">
            <p className="text-6xl lg:text-7xl font-heading text-gradient mb-6">🧠 Trivia</p>
            <p className="text-3xl text-foreground/60">Coming up next...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen w-screen bg-bg flex flex-col items-center justify-center p-16">
        <h1 className="text-5xl lg:text-6xl font-heading text-gradient mb-10">🏆 Leaderboard</h1>
        <div className="max-w-3xl w-full space-y-4">
          {leaderboard.slice(0, 10).map((entry, index) => (
            <div
              key={entry.viewerId}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-bg-card px-8 py-5"
            >
              <div className="flex items-center gap-5">
                <span className="text-4xl w-14 text-center">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </span>
                <span className="text-2xl lg:text-3xl font-semibold text-foreground">
                  {entry.displayName}
                </span>
              </div>
              <span className="text-3xl font-bold text-accent-light">
                {entry.correct}/{entry.total}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-bg flex items-center justify-center p-16">
      <div className="max-w-5xl w-full">
        {/* Question */}
        <div className="mb-10 text-center">
          <p className="text-4xl lg:text-5xl font-heading font-bold text-foreground leading-snug">
            {activeQuestion.question}
          </p>
          {totalAnswers > 0 && (
            <p className="mt-4 text-xl text-muted">
              {totalAnswers} answer{totalAnswers !== 1 ? 's' : ''} submitted
            </p>
          )}
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeQuestion.options.map((option, index) => {
            const count = dist[index] || 0;
            const pct = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
            const isCorrect = index === activeQuestion.correctIndex;

            const optionColors = [
              'border-blue-500/30 bg-blue-500/10',
              'border-orange-500/30 bg-orange-500/10',
              'border-purple-500/30 bg-purple-500/10',
              'border-pink-500/30 bg-pink-500/10',
            ];

            let style = optionColors[index % 4];
            if (isRevealed) {
              style = isCorrect
                ? 'border-green-500/60 bg-green-500/20 ring-2 ring-green-500/40'
                : 'border-white/5 bg-white/5 opacity-60';
            }

            return (
              <div
                key={index}
                className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-500 ${style}`}
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-current text-xl font-bold text-foreground">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-2xl lg:text-3xl font-semibold text-foreground flex-1">
                    {option}
                  </span>
                  {isRevealed && isCorrect && <span className="text-4xl">✅</span>}
                  {isRevealed && !isCorrect && <span className="text-4xl">❌</span>}
                </div>

                {/* Bar chart overlay when revealed */}
                {isRevealed && totalAnswers > 0 && (
                  <div className="mt-4">
                    <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          isCorrect ? 'bg-green-500' : 'bg-white/20'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {count} ({pct}%)
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
