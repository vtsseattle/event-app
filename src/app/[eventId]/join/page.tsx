"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { useEventId } from "@/contexts/EventContext";
import { useEvent } from "@/hooks/useEvent";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

type Step = "form" | "signing-in" | "welcome";

export default function JoinPage() {
  const { user, loading, signIn } = useAuthContext();
  const eventId = useEventId();
  const { event } = useEvent();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("form");

  // Already authenticated — skip straight to /event
  useEffect(() => {
    if (!loading && user) {
      router.replace(`/${eventId}/event`);
    }
  }, [user, loading, router, eventId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmed = displayName.trim();
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    setError("");
    setStep("signing-in");

    try {
      await signIn(trimmed);
      localStorage.setItem(`${eventId}_displayName`, trimmed);
      setStep("welcome");
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("form");
    }
  }

  // Show nothing while checking existing auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  // Welcome screen after sign-in
  if (step === "welcome") {
    return <WelcomeScreen name={displayName.trim()} eventId={eventId} eventName={event?.name} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md animate-[fadeIn_0.6s_ease-out]">
        {/* Branding */}
        <div className="mb-8 text-center">
          <h1 className="text-gradient font-heading text-5xl font-bold tracking-tight">
            {event?.name || 'Event'}
          </h1>
          {event?.tagline && (
            <p className="mt-2 text-muted">{event.tagline}</p>
          )}
        </div>

        {/* Join Form */}
        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Your Name"
              placeholder="Enter your display name"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (error) setError("");
              }}
              error={error}
              autoFocus
              autoComplete="name"
              maxLength={50}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={step === "signing-in"}
              className="w-full"
            >
              {step === "signing-in" ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg border-t-transparent" />
                  Joining…
                </span>
              ) : (
                "Join Event 🎉"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function WelcomeScreen({ name, eventId, eventName }: { name: string; eventId: string; eventName?: string }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace(`/${eventId}/event`), 2000);
    return () => clearTimeout(timer);
  }, [router, eventId]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 animate-[fadeIn_0.5s_ease-out]"
      onClick={() => router.replace(`/${eventId}/event`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") router.replace(`/${eventId}/event`);
      }}
    >
      <h1 className="text-gradient font-heading text-4xl font-bold sm:text-5xl">
        Welcome, {name} 👋
      </h1>
      <p className="mt-4 text-gradient font-heading text-2xl font-semibold sm:text-3xl">
        {eventName || 'Event'}
      </p>
      <p className="mt-6 text-sm text-muted animate-pulse">
        Tap anywhere to continue
      </p>
    </div>
  );
}
