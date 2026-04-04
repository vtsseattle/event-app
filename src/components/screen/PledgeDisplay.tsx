'use client';

import { usePledges } from '@/hooks/usePledges';

export default function PledgeDisplay() {
  const { pledges, totalKids, totalAmount } = usePledges();

  if (pledges.length === 0) {
    return (
      <div className="h-screen w-screen bg-bg flex items-center justify-center">
        <div className="text-center px-16">
          <p className="text-5xl lg:text-6xl font-heading text-gradient mb-6">
            Sponsor a Child&apos;s Education
          </p>
          <p className="text-3xl text-foreground/60">
            Just $1 a day can change a life 💛
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-bg flex items-center justify-center p-16">
      <div className="max-w-5xl w-full text-center">
        {/* Headline */}
        <p className="text-3xl lg:text-4xl text-muted mb-4 tracking-wide uppercase">
          Tonight&apos;s Impact
        </p>

        {/* Big kid count */}
        <div className="mb-8">
          <p className="text-[10rem] lg:text-[12rem] font-heading text-gradient leading-none font-bold">
            {totalKids}
          </p>
          <p className="text-4xl lg:text-5xl text-foreground/80 font-heading mt-2">
            {totalKids === 1 ? 'child' : 'children'} sponsored
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="w-24 h-px bg-accent/40" />
          <span className="text-4xl">💛</span>
          <div className="w-24 h-px bg-accent/40" />
        </div>

        {/* Total amount */}
        <p className="text-5xl lg:text-6xl font-bold text-accent-light">
          ${totalAmount.toLocaleString()}
        </p>
        <p className="text-2xl text-muted mt-2">
          pledged for education
        </p>

        {/* Pledge count */}
        <p className="text-xl text-foreground/40 mt-8">
          from {pledges.length} {pledges.length === 1 ? 'generous pledge' : 'generous pledges'}
        </p>

        {/* CTA */}
        <div className="mt-12 flex items-center justify-center gap-3">
          <div className="w-16 h-px bg-accent/40" />
          <p className="text-2xl text-accent/70">
            $365 educates a child for a year — a dollar a day
          </p>
          <div className="w-16 h-px bg-accent/40" />
        </div>
      </div>
    </div>
  );
}
