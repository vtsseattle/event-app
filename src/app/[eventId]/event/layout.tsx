"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { useEventId } from "@/contexts/EventContext";
import { useEvent } from "@/hooks/useEvent";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import BottomNav from "@/components/viewer/BottomNav";

function AnnouncementBanner() {
  const { event } = useEvent();
  const [dismissed, setDismissed] = useState(false);
  const lastText = useRef("");

  useEffect(() => {
    if (event?.announcementText && event.announcementText !== lastText.current) {
      lastText.current = event.announcementText;
      setDismissed(false);
    }
  }, [event?.announcementText]);

  if (!event?.announcementActive || !event.announcementText || dismissed) {
    return null;
  }

  return (
    <div className="animate-pulse-subtle relative bg-accent/90 px-4 py-2.5 text-center text-sm font-semibold text-bg">
      <span>{event.announcementText}</span>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-bg/70 hover:text-bg"
        aria-label="Dismiss announcement"
      >
        ✕
      </button>
    </div>
  );
}

function OfflineBanner() {
  const { isOnline } = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-danger px-4 py-2 text-center text-sm font-medium text-white animate-pulse">
      You&apos;re offline — reconnecting...
    </div>
  );
}

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthContext();
  const eventId = useEventId();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/${eventId}/join`);
    }
  }, [user, loading, router, eventId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <OfflineBanner />
      <AnnouncementBanner />
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
