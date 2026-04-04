'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { usePledges } from '@/hooks/usePledges';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const DEFAULT_COST_PER_CHILD = 365;

const PLEDGE_PHOTOS = [
  '/pledge-photos/5a.JPG',
  '/pledge-photos/5b.JPG',
  '/pledge-photos/5c.JPG',
  '/pledge-photos/5d.JPG',
  '/pledge-photos/5e.JPG',
  '/pledge-photos/5f.JPG',
  '/pledge-photos/5g.JPG',
  '/pledge-photos/5h.JPG',
  '/pledge-photos/5i.JPG',
  '/pledge-photos/5k.JPG',
];

export default function PledgePage() {
  const { submitPledge, costPerChild: hookCost } = usePledges();
  const costPerChild = hookCost ?? DEFAULT_COST_PER_CHILD;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [numberOfKids, setNumberOfKids] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const photo = useMemo(
    () => PLEDGE_PHOTOS[Math.floor(Math.random() * PLEDGE_PHOTOS.length)],
    [],
  );

  const totalAmount = (numberOfKids ?? 0) * costPerChild;

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && numberOfKids !== null && numberOfKids >= 1 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const success = await submitPledge({ name, email, phone, numberOfKids: numberOfKids! });
    setSubmitting(false);
    if (success) setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex h-[calc(100vh-80px)] flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-4">🙏</div>
        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
          Thank You!
        </h1>
        <p className="text-muted max-w-sm">
          Your pledge to support {numberOfKids === 1 ? 'a child' : `${numberOfKids} children`} means
          the world. We&apos;ll be in touch with details on how to complete your gift.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setName('');
            setEmail('');
            setPhone('');
            setNumberOfKids(null);
          }}
          className="mt-6 text-sm text-accent hover:underline"
        >
          Make another pledge
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between px-4 py-5 h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-2 h-24 w-24 overflow-hidden rounded-full border-2 border-accent/30">
          <Image
            src={photo}
            alt="A child at our school"
            width={96}
            height={96}
            className="h-full w-full object-cover"
          />
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground">
          Sponsor a Child&apos;s Education
        </h1>
        <p className="text-muted text-xs mt-1 max-w-xs mx-auto">
          Just <span className="text-accent-light font-semibold">${Math.round(costPerChild / 365)}/day</span> educates a child for a year
        </p>
      </div>

      {/* Kids selector */}
      <div>
        <div className="flex gap-2 justify-center items-end">
          {[1, 2, 3].map((n) => {
            const label = n === 1 ? '1 child' : `${n} children`;
            const sub = `$${(n * costPerChild).toLocaleString()}/yr`;
            return (
            <button
              key={n}
              onClick={() => setNumberOfKids(n)}
              className={`relative flex-1 rounded-xl text-center transition-all ${
                numberOfKids === n
                  ? 'bg-accent text-bg ring-2 ring-accent/50 py-3'
                  : 'border border-white/10 text-muted hover:text-foreground hover:bg-white/5 py-3'
              }`}
            >
              <span className="block text-sm font-semibold">{label}</span>
              <span className={`block text-xs mt-0.5 ${numberOfKids === n ? 'text-bg/70' : 'text-muted'}`}>{sub}</span>
            </button>
            );
          })}
        </div>
      </div>

      {/* Contact info — compact */}
      <div className="flex flex-col gap-2.5">
        <Input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="tel"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      {/* Submit */}
      <div>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          size="lg"
          className="w-full"
        >
          {submitting ? 'Submitting…' : numberOfKids ? `🙏 Pledge $${totalAmount.toLocaleString()}/year` : '🙏 Choose & Pledge'}
        </Button>
        <p className="text-center text-[11px] text-muted mt-2">
          No payment now — we&apos;ll follow up with details
        </p>
      </div>
    </div>
  );
}
