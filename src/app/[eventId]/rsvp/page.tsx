'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useEvent } from '@/hooks/useEvent';
import { useRsvp } from '@/hooks/useRsvp';
import { useEventId } from '@/contexts/EventContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

type RsvpStatus = 'going' | 'maybe' | 'not-going';

const STATUS_OPTIONS: { value: RsvpStatus; label: string; icon: string }[] = [
  { value: 'going', label: "I'm Going!", icon: '🎉' },
  { value: 'maybe', label: 'Maybe', icon: '🤔' },
  { value: "not-going", label: "Can't Make It", icon: '😢' },
];

export default function RsvpPage() {
  const eventId = useEventId();
  const { event, loading: eventLoading } = useEvent();
  const { myRsvp, submitRsvp, counts, myRsvpLoading } = useRsvp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<RsvpStatus | null>(null);
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Pre-fill form when existing RSVP loads
  if (!myRsvpLoading && myRsvp && !initialized && !editing) {
    setName(myRsvp.name);
    setEmail(myRsvp.email);
    setPhone(myRsvp.phone || '');
    setStatus(myRsvp.status);
    setNumberOfGuests(myRsvp.numberOfGuests || 1);
    setInitialized(true);
  }

  if (eventLoading || myRsvpLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  // Show existing RSVP (view mode)
  if (myRsvp && !editing && initialized && !submitted) {
    const statusInfo = STATUS_OPTIONS.find((s) => s.value === myRsvp.status);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-md animate-[fadeIn_0.6s_ease-out]">
          {/* Event header */}
          <div className="mb-6 text-center">
            <h1 className="text-gradient font-heading text-4xl font-bold tracking-tight">
              {event?.name || 'Event'}
            </h1>
            {event?.tagline && (
              <p className="mt-2 text-muted">{event.tagline}</p>
            )}
          </div>

          <Card>
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <span className="text-5xl">{statusInfo?.icon || '✅'}</span>
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">
                  Your RSVP: {statusInfo?.label}
                </h2>
                <p className="text-sm text-muted mt-1">
                  {myRsvp.name} · {myRsvp.numberOfGuests} {myRsvp.numberOfGuests === 1 ? 'guest' : 'guests'}
                </p>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-accent hover:underline"
              >
                Edit RSVP
              </button>
            </div>
          </Card>

          {/* RSVP counts */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-white/10 bg-bg-card px-3 py-2">
              <p className="text-lg font-bold text-accent-light">{counts.going}</p>
              <p className="text-xs text-muted">Going</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-bg-card px-3 py-2">
              <p className="text-lg font-bold text-accent-light">{counts.maybe}</p>
              <p className="text-xs text-muted">Maybe</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-bg-card px-3 py-2">
              <p className="text-lg font-bold text-accent-light">{counts.totalGuests}</p>
              <p className="text-xs text-muted">Total Guests</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation screen
  if (submitted && !editing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="animate-[fadeIn_0.5s_ease-out]">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
            {myRsvp ? 'RSVP Updated!' : 'You\'re All Set!'}
          </h1>
          <p className="text-muted max-w-sm">
            {status === 'going'
              ? `We can't wait to see you at ${event?.name || 'the event'}!`
              : status === 'maybe'
              ? "We hope you can make it! We'll save a spot for you."
              : "Sorry you can't make it. Maybe next time!"}
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setEditing(false);
              setInitialized(true);
            }}
            className="mt-6 text-sm text-accent hover:underline"
          >
            View RSVP
          </button>
        </div>
      </div>
    );
  }

  const canSubmit =
    name.trim().length > 0 &&
    status !== null &&
    !submitting;

  async function handleSubmit() {
    if (!canSubmit || !status) return;
    setSubmitting(true);
    const success = await submitRsvp({
      name,
      email,
      phone,
      status,
      numberOfGuests: status === 'not-going' ? 0 : numberOfGuests,
    });
    setSubmitting(false);
    if (success) {
      setSubmitted(true);
      setEditing(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-8">
      <div className="w-full max-w-md animate-[fadeIn_0.6s_ease-out]">
        {/* Event header */}
        <div className="mb-6 text-center">
          <h1 className="text-gradient font-heading text-4xl font-bold tracking-tight">
            {event?.name || 'Event'}
          </h1>
          {event?.tagline && (
            <p className="mt-2 text-muted">{event.tagline}</p>
          )}
        </div>

        {/* Flyer */}
        {event?.flyerUrl && (
          <div className="mb-6 overflow-hidden rounded-xl border border-white/10">
            <Image
              src={event.flyerUrl}
              alt={`${event.name} flyer`}
              width={600}
              height={800}
              className="w-full h-auto object-contain"
              priority
            />
          </div>
        )}

        {/* RSVP form */}
        <Card>
          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-lg font-bold text-foreground text-center">
              {editing ? 'Update Your RSVP' : 'RSVP'}
            </h2>

            {/* Status selector */}
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl py-3 transition-all ${
                    status === opt.value
                      ? 'bg-accent text-bg ring-2 ring-accent/50'
                      : 'border border-white/10 text-muted hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="text-xs font-semibold">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Guest count (only for going/maybe) */}
            {status && status !== 'not-going' && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">
                  Number of Guests (including you)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNumberOfGuests(Math.max(1, numberOfGuests - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-foreground hover:bg-white/5"
                  >
                    −
                  </button>
                  <span className="text-xl font-bold text-foreground w-8 text-center">
                    {numberOfGuests}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNumberOfGuests(Math.min(20, numberOfGuests + 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-foreground hover:bg-white/5"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Contact info */}
            <Input
              label="Your Name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            <Input
              label="Email"
              type="email"
              placeholder="Email address (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="Phone number (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              size="lg"
              className="w-full"
            >
              {submitting
                ? 'Submitting…'
                : editing
                ? 'Update RSVP'
                : status
                ? `${STATUS_OPTIONS.find((s) => s.value === status)?.icon} Confirm RSVP`
                : 'Select a Response'}
            </Button>

            {editing && (
              <button
                onClick={() => {
                  setEditing(false);
                  setSubmitted(false);
                }}
                className="text-sm text-muted hover:text-foreground text-center"
              >
                Cancel
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
