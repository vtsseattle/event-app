'use client';

import { useState } from 'react';
import { useFeedback } from '@/hooks/useFeedback';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const ENJOYED_OPTIONS = [
  { label: '🎭 Performances', value: 'performances' },
  { label: '🍽️ Food', value: 'food' },
  { label: '🎨 Decorations', value: 'decorations' },
  { label: '📊 Presentations', value: 'presentations' },
  { label: '📸 Photo Wall', value: 'photos' },
  { label: '💬 Shoutouts', value: 'shoutouts' },
  { label: '🎤 Emcee', value: 'emcee' },
];

const IMPROVE_OPTIONS = [
  { label: '🔊 Sound / AV', value: 'sound' },
  { label: '💺 Seating', value: 'seating' },
  { label: '⏰ Timing', value: 'timing' },
  { label: '🍽️ Food', value: 'food' },
  { label: '🎯 More Activities', value: 'activities' },
  { label: '📱 App Experience', value: 'app' },
  { label: '📊 Presentations', value: 'presentations' },
];

const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
const MAX_COMMENT = 500;

function ChipSelect({
  options,
  selected,
  onToggle,
}: {
  options: { label: string; value: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
              isSelected
                ? 'bg-accent/20 text-accent-light border border-accent/40'
                : 'bg-white/5 text-muted border border-white/10 hover:bg-white/10 hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function FeedbackPage() {
  const { submitFeedback } = useFeedback();
  const [rating, setRating] = useState(0);
  const [enjoyed, setEnjoyed] = useState<string[]>([]);
  const [improve, setImprove] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSend = rating > 0 && !sending;

  const toggleEnjoyed = (value: string) => {
    setEnjoyed((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleImprove = (value: string) => {
    setImprove((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    if (!canSend) return;
    setSending(true);
    await submitFeedback({ rating, enjoyed, improve, comment });
    setRating(0);
    setEnjoyed([]);
    setImprove([]);
    setComment('');
    setSending(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
        <span className="text-5xl">🙏</span>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Thank You!
        </h1>
        <p className="text-muted max-w-sm">
          Your anonymous feedback has been submitted. It helps us make future events even better.
        </p>
        <Button onClick={() => setSubmitted(false)} variant="secondary" size="md">
          Submit Another
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Share Your Feedback
        </h1>
        <p className="text-sm text-muted mt-1">
          Your feedback is completely anonymous. Help us improve future events!
        </p>
      </div>

      {/* Overall Rating */}
      <Card>
        <label className="block text-sm font-medium text-foreground mb-2">
          How was the event overall?
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-3xl transition-transform hover:scale-110 ${
                star <= rating ? 'grayscale-0' : 'grayscale opacity-30'
              }`}
              aria-label={`${star} star`}
            >
              ⭐
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-xs text-accent mt-1">{ratingLabels[rating]}</p>
        )}
      </Card>

      {/* What did you enjoy? */}
      <Card>
        <label className="block text-sm font-medium text-foreground mb-2">
          What did you enjoy most? <span className="text-muted font-normal">(tap all that apply)</span>
        </label>
        <ChipSelect options={ENJOYED_OPTIONS} selected={enjoyed} onToggle={toggleEnjoyed} />
      </Card>

      {/* What could be improved? */}
      <Card>
        <label className="block text-sm font-medium text-foreground mb-2">
          What could be improved? <span className="text-muted font-normal">(tap all that apply)</span>
        </label>
        <ChipSelect options={IMPROVE_OPTIONS} selected={improve} onToggle={toggleImprove} />
      </Card>

      {/* Optional comment */}
      <Card>
        <label className="block text-sm font-medium text-foreground mb-2">
          Anything else? <span className="text-muted font-normal">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share any additional thoughts..."
          rows={3}
          maxLength={MAX_COMMENT + 10}
          className="w-full rounded-lg border border-white/10 bg-bg px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
        />
        {comment.length > 0 && (
          <div className="mt-1 flex justify-end">
            <span
              className={`text-xs tabular-nums ${
                comment.length > MAX_COMMENT ? 'text-danger' : 'text-muted'
              }`}
            >
              {comment.length}/{MAX_COMMENT}
            </span>
          </div>
        )}
      </Card>

      <Button onClick={handleSubmit} disabled={!canSend} size="md" className="w-full">
        {sending ? 'Submitting...' : 'Submit Feedback'}
      </Button>

      <p className="text-xs text-muted text-center">
        🔒 Your feedback is anonymous — no name or identity is attached.
      </p>
    </div>
  );
}
