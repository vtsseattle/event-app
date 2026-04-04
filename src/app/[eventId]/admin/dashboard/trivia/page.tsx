'use client';

import { useState } from 'react';
import { useTrivia } from '@/hooks/useTrivia';
import { TriviaQuestion } from '@/lib/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function AdminTriviaPage() {
  const {
    questions,
    leaderboard,
    getAnswerDistribution,
    addQuestion,
    activateQuestion,
    revealAnswer,
    closeQuestion,
    deleteQuestion,
    loading,
  } = useTrivia();

  const [showForm, setShowForm] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectIndex(0);
    setShowForm(false);
  };

  const handleAddQuestion = async () => {
    const trimmedQuestion = questionText.trim();
    const trimmedOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (!trimmedQuestion || trimmedOptions.length < 2) return;

    // Clamp correctIndex to valid range after filtering empty options
    const clampedIndex = Math.min(correctIndex, trimmedOptions.length - 1);

    setSaving(true);
    try {
      await addQuestion(trimmedQuestion, trimmedOptions, clampedIndex);
      resetForm();
    } catch (err) {
      console.error('[Trivia] Failed to save question:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const statusBadge = (status: TriviaQuestion['status']) => {
    const variants: Record<string, 'upcoming' | 'live' | 'completed'> = {
      draft: 'upcoming',
      active: 'live',
      revealed: 'live',
      closed: 'completed',
    };
    const labels: Record<string, string> = {
      draft: 'Draft',
      active: '🟢 Live',
      revealed: '👁️ Revealed',
      closed: 'Closed',
    };
    return <Badge variant={variants[status] ?? 'upcoming'}>{labels[status] ?? status}</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted">Loading…</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Trivia</h1>
        <Button onClick={() => setShowForm(!showForm)} size="md">
          {showForm ? 'Cancel' : '+ Add Question'}
        </Button>
      </div>

      {/* Add question form */}
      {showForm && (
        <Card className="mb-6 p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4">New Question</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1">Question</label>
              <input
                type="text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="e.g. What year was our org founded?"
                className="w-full rounded-lg border border-white/10 bg-bg px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>

            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCorrectIndex(i)}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                    correctIndex === i
                      ? 'border-green-500 bg-green-500/20 text-green-300'
                      : 'border-white/20 text-muted hover:border-white/40'
                  }`}
                  title={correctIndex === i ? 'Correct answer' : 'Mark as correct'}
                >
                  {String.fromCharCode(65 + i)}
                </button>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  className="flex-1 rounded-lg border border-white/10 bg-bg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            ))}
            <p className="text-xs text-muted">
              Click a letter to mark it as the correct answer. Leave options blank to have fewer choices.
            </p>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleAddQuestion} disabled={saving} size="md">
                {saving ? 'Saving…' : 'Save Question'}
              </Button>
              <Button onClick={resetForm} size="md" className="bg-white/5 text-muted hover:bg-white/10">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Questions list */}
      <div className="space-y-4 mb-8">
        {questions.length === 0 && !showForm && (
          <div className="text-center py-12 text-muted">
            <span className="text-4xl block mb-3">🧠</span>
            <p className="text-lg font-medium text-foreground mb-1">No trivia questions yet</p>
            <p className="text-sm">Add questions to run a live trivia game during the event.</p>
          </div>
        )}

        {questions.map((q) => {
          const dist = getAnswerDistribution(q.id);
          const totalAnswers = Object.values(dist).reduce((a, b) => a + b, 0);

          return (
            <Card key={q.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-foreground font-semibold flex-1 mr-4">{q.question}</p>
                {statusBadge(q.status)}
              </div>

              <div className="space-y-1.5 mb-4">
                {q.options.map((opt, i) => {
                  const count = dist[i] || 0;
                  const pct = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;

                  return (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span
                        className={`w-5 text-center font-bold ${
                          i === q.correctIndex ? 'text-green-400' : 'text-muted'
                        }`}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className={`flex-1 ${i === q.correctIndex ? 'text-green-300' : 'text-foreground'}`}>
                        {opt}
                        {i === q.correctIndex && ' ✓'}
                      </span>
                      {totalAnswers > 0 && (
                        <span className="text-xs text-muted tabular-nums">
                          {count} ({pct}%)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {totalAnswers > 0 && (
                <p className="text-xs text-muted mb-3">{totalAnswers} answer{totalAnswers !== 1 ? 's' : ''}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {q.status === 'draft' && (
                  <>
                    <Button size="sm" onClick={() => activateQuestion(q.id)}>
                      ▶️ Go Live
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      onClick={() => deleteQuestion(q.id)}
                    >
                      Delete
                    </Button>
                  </>
                )}
                {q.status === 'active' && (
                  <Button size="sm" onClick={() => revealAnswer(q.id)}>
                    👁️ Reveal Answer
                  </Button>
                )}
                {q.status === 'revealed' && (
                  <Button size="sm" onClick={() => closeQuestion(q.id)}>
                    Close
                  </Button>
                )}
                {q.status === 'closed' && (
                  <Button
                    size="sm"
                    className="bg-white/5 text-muted hover:bg-white/10"
                    onClick={() => deleteQuestion(q.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">🏆 Leaderboard</h2>
          <Card className="p-4">
            <div className="space-y-2">
              {leaderboard.slice(0, 20).map((entry, index) => (
                <div
                  key={entry.viewerId}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center font-bold text-accent-light">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                    <span className="text-foreground">{entry.displayName}</span>
                  </div>
                  <span className="text-sm font-semibold text-accent-light">
                    {entry.correct}/{entry.total} correct
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
