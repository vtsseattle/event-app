"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useEvent } from "@/hooks/useEvent";
import { usePrograms } from "@/hooks/usePrograms";
import { useEventId } from "@/contexts/EventContext";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function EventHomePage() {
  const { event } = useEvent();
  const { programs } = usePrograms();
  const eventId = useEventId();
  const [displayName, setDisplayName] = useState("Guest");

  const featureCards = [
    { href: `/${eventId}/event/agenda`, icon: "📋", title: "Agenda", subtitle: "View schedule", feature: 'agenda' as const },
    { href: `/${eventId}/event/react`, icon: "🎉", title: "React Live", subtitle: "Cheer performers", feature: 'reactions' as const },
    { href: `/${eventId}/event/shoutouts`, icon: "💬", title: "Shoutouts", subtitle: "Message the crowd", feature: 'shoutouts' as const },
    { href: `/${eventId}/event/photos`, icon: "📸", title: "Photo Wall", subtitle: "Share moments", feature: 'photos' as const },
    { href: `/${eventId}/event/feedback`, icon: "📝", title: "Feedback", subtitle: "Share thoughts", feature: null },
  ];

  const f = event?.features;
  const visibleCards = featureCards.filter((c) => !c.feature || !f || f[c.feature] !== false);

  useEffect(() => {
    const stored = localStorage.getItem(`${eventId}_displayName`);
    if (stored) setDisplayName(stored);
  }, [eventId]);

  const currentProgram = programs.find(
    (p) => p.id === event?.currentProgramId
  );

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      {/* Greeting */}
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Good Evening, {displayName} 👋
      </h1>

      {/* Now Playing Banner */}
      {currentProgram ? (
        <Link href={`/${eventId}/event/react`}>
          <Card className="border-accent/30 shadow-[0_0_24px_rgba(212,168,67,0.08)]">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <Badge variant="live">LIVE</Badge>
                <h2 className="mt-1 font-heading text-lg font-bold text-foreground">
                  {currentProgram.emoji} {currentProgram.title}
                </h2>
                {currentProgram.performers && (
                  <p className="text-sm text-muted">
                    {currentProgram.performers}
                  </p>
                )}
              </div>
              <span className="text-2xl">🎶</span>
            </div>
            <p className="mt-3 text-xs font-medium text-accent">
              Tap to cheer →
            </p>
          </Card>
        </Link>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <span className="text-3xl">🎭</span>
            <p className="font-heading text-base font-semibold text-foreground">
              No performance right now
            </p>
            <p className="text-xs text-muted">
              Check the agenda for upcoming programs
            </p>
          </div>
        </Card>
      )}

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {visibleCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="flex h-full flex-col items-center gap-2 py-5 text-center transition-transform active:scale-[0.97]">
              <span className="text-3xl">{card.icon}</span>
              <h3 className="font-heading text-sm font-semibold text-foreground">
                {card.title}
              </h3>
              <p className="text-xs text-muted">{card.subtitle}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Sponsor a Child — subtle CTA */}
      {(!f || f.pledges !== false) && (
      <Link href={`/${eventId}/event/pledge`}>
        <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-transparent transition-transform active:scale-[0.98]">
          <div className="flex items-center gap-4">
            <span className="text-3xl">💛</span>
            <div className="flex-1">
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Make a Difference
              </h3>
              <p className="text-xs text-muted">
                Sponsor a child&apos;s education — just $1/day
              </p>
            </div>
            <span className="text-muted text-sm">→</span>
          </div>
        </Card>
      </Link>
      )}
    </div>
  );
}
