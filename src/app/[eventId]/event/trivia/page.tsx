'use client';

import { useState } from 'react';
import { useTrivia } from '@/hooks/useTrivia';
import { useAuthContext } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';

export default function TriviaPage() {
  const { activeQuestion, myAnswerForQuestion, submitAnswer, leaderboard, loading } = useTrivia();
  const { user } = useAuthContext();
  const [submitting, setSubmitting] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const myAnswer = activeQuestion ? myAnswerForQuestion(activeQuestion.id) : null;
  const hasAnswered = !!myAnswer;
  const isRevealed = activeQuestion?.status === 'revealed';

  const handleAnswer = async (index: number) => {
    if (!activeQuestion || hasAnswered || submitting) return;
    setSubmitting(true);
    await submitAnswer(activeQuestion.id, index);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 px-4 pt-4">
        <div className="animate-pulse rounded-xl border border-white/5 bg-bg-card p-6">
          <div className="mb-4 h-5 w-3/4 rounded bg-white/10" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col px-4 pt-4">
      {/* Toggle between trivia and leaderboard */}
      <div className="mb-4 flex rounded-xl border border-white/10 bg-bg-card p-1">
        <button
          onClick={() => setShowLeaderboard(false)}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            !showLeaderboard ? 'bg-accent/20 text-accent-light' : 'text-muted hover:text-foreground'
          }`}
        >
          🧠 Trivia
        </button>
        <button
          onClick={() => setShowLeaderboard(true)}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            showLeaderboard ? 'bg-accent/20 text-accent-light' : 'text-muted hover:text-foreground'
          }`}
        >
          🏆 Leaderboard
        </button>
      </div>

      {showLeaderboard ? (
        /* Leaderboard view */
        <div className="flex-1 overflow-y-auto">
          {leaderboard.length === 0 ? (
            <div className="flex flex-col items-center gap-3 pt-16 text-center">
              <span className="text-4xl">🏆</span>
              <p className="font-heading text-lg font-semibold text-foreground">
                No scores yet
              </p>
              <p className="text-sm text-muted">Answer trivia questions to get on the board!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pb-4">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.viewerId}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    entry.viewerId === user?.uid
                      ? 'border-accent/30 bg-accent/10'
                      : 'border-white/10 bg-bg-card'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-accent-light w-8">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                    <span className="text-foreground font-medium">
                      {entry.displayName}
                      {entry.viewerId === user?.uid && (
                        <span className="ml-1 text-xs text-accent">(you)</span>
                      )}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-accent-light">
                    {entry.correct}/{entry.total}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Active question view */
        <div className="flex-1 overflow-y-auto">
          {!activeQuestion ? (
            <div className="flex flex-col items-center gap-3 pt-16 text-center">
              <span className="text-4xl">🧠</span>
              <p className="font-heading text-lg font-semibold text-foreground">
                Waiting for the next question...
              </p>
              <p className="text-sm text-muted">
                The host will launch a trivia question soon!
              </p>
            </div>
          ) : (
            <Card className="p-5">
              <p className="mb-5 text-lg font-semibold text-foreground leading-snug">
                {activeQuestion.question}
              </p>

              <div className="flex flex-col gap-3">
                {activeQuestion.options.map((option, index) => {
                  const isSelected = myAnswer?.selectedIndex === index;
                  const isCorrect = index === activeQuestion.correctIndex;

                  let style = 'border-white/10 bg-bg hover:bg-white/5 text-foreground';
                  if (hasAnswered || isRevealed) {
                    if (isRevealed && isCorrect) {
                      style = 'border-green-500/50 bg-green-500/15 text-green-300';
                    } else if (isSelected && !isCorrect && isRevealed) {
                      style = 'border-red-500/50 bg-red-500/15 text-red-300';
                    } else if (isSelected) {
                      style = 'border-accent/50 bg-accent/15 text-accent-light';
                    } else {
                      style = 'border-white/5 bg-bg text-muted';
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      disabled={hasAnswered || submitting}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all ${style} ${
                        !hasAnswered && !submitting ? 'active:scale-[0.98]' : ''
                      }`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {isRevealed && isCorrect && <span>✅</span>}
                      {isRevealed && isSelected && !isCorrect && <span>❌</span>}
                    </button>
                  );
                })}
              </div>

              {/* Status messages */}
              {hasAnswered && !isRevealed && (
                <div className="mt-4 rounded-lg bg-accent/10 px-4 py-2.5 text-center text-sm text-accent-light">
                  Answer locked in! Waiting for reveal...
                </div>
              )}
              {isRevealed && myAnswer?.correct && (
                <div className="mt-4 rounded-lg bg-green-500/10 px-4 py-2.5 text-center text-sm text-green-300">
                  🎉 Correct! Nice one!
                </div>
              )}
              {isRevealed && myAnswer && !myAnswer.correct && (
                <div className="mt-4 rounded-lg bg-red-500/10 px-4 py-2.5 text-center text-sm text-red-300">
                  Not this time — the answer was{' '}
                  <strong>{activeQuestion.options[activeQuestion.correctIndex]}</strong>
                </div>
              )}
              {isRevealed && !myAnswer && (
                <div className="mt-4 rounded-lg bg-white/5 px-4 py-2.5 text-center text-sm text-muted">
                  You didn&apos;t answer this one
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
