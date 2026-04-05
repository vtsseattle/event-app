'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { useEventId } from '@/contexts/EventContext';
import { useEvent } from '@/hooks/useEvent';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const eventId = useEventId();
  const { event } = useEvent();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const f = event?.features;

  const NAV_ITEMS = [
    { href: `/${eventId}/admin/dashboard`, label: 'Overview', icon: '📊', feature: null },
    { href: `/${eventId}/admin/dashboard/programs`, label: 'Programs', icon: '🎭', feature: null },
    { href: `/${eventId}/admin/dashboard/nowplaying`, label: 'Now Playing', icon: '▶️', feature: null },
    { href: `/${eventId}/admin/dashboard/announcements`, label: 'Announcements', icon: '📢', feature: null },
    { href: `/${eventId}/admin/dashboard/shoutouts`, label: 'Shoutouts', icon: '💬', feature: 'shoutouts' as const },
    { href: `/${eventId}/admin/dashboard/photos`, label: 'Photos', icon: '📸', feature: 'photos' as const },
    { href: `/${eventId}/admin/dashboard/trivia`, label: 'Trivia', icon: '🧠', feature: 'trivia' as const },
    { href: `/${eventId}/admin/dashboard/pledges`, label: 'Pledges', icon: '💛', feature: 'pledges' as const },
    { href: `/${eventId}/admin/dashboard/rsvps`, label: 'RSVPs', icon: '📩', feature: 'rsvp' as const },
    { href: `/${eventId}/admin/dashboard/feedback`, label: 'Feedback', icon: '📝', feature: null },
    { href: `/${eventId}/admin/dashboard/screen`, label: 'Big Screen', icon: '🖥️', feature: null },
    { href: `/${eventId}/admin/dashboard/qrcode`, label: 'QR Code', icon: '📱', feature: null },
    { href: `/${eventId}/admin/dashboard/reset`, label: 'Reset Data', icon: '⚠️', feature: null },
  ].filter((item) => !item.feature || !f || f[item.feature] !== false);

  const adminTitle = event?.name ? `${event.name} Admin` : 'Admin';

  useEffect(() => {
    if (localStorage.getItem(`${eventId}_admin`) !== 'true') {
      router.replace(`/${eventId}/admin`);
    } else {
      if (auth && !auth.currentUser) {
        signInAnonymously(auth).then(() => setAuthorized(true)).catch(() => router.replace(`/${eventId}/admin`));
      } else {
        setAuthorized(true);
      }
    }
  }, [router, eventId]);

  if (!authorized) return null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-white/10 bg-bg-card px-4 py-3 md:hidden">
        <span className="font-heading text-lg font-bold text-gradient">{adminTitle}</span>
        <div className="flex items-center gap-3">
          <Link href={`/${eventId}/event`} className="text-xs text-accent hover:underline">
            Back to Event
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg border border-white/10 p-2 text-foreground hover:bg-white/5"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile nav dropdown */}
      {sidebarOpen && (
        <nav className="border-b border-white/10 bg-bg-card px-4 py-2 md:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-accent/10 text-accent-light font-medium'
                  : 'text-muted hover:text-foreground hover:bg-white/5'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-white/10 md:bg-bg-card">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <span className="font-heading text-lg font-bold text-gradient">{adminTitle}</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-accent/10 text-accent-light font-medium'
                  : 'text-muted hover:text-foreground hover:bg-white/5'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-4">
          <Link
            href={`/${eventId}/event`}
            className="text-sm text-accent hover:underline"
          >
            ← Back to Event
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
