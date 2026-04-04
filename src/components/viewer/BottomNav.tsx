'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEventId } from '@/contexts/EventContext';
import { useEvent } from '@/hooks/useEvent';

export default function BottomNav() {
  const pathname = usePathname();
  const eventId = useEventId();
  const { event } = useEvent();
  const f = event?.features;

  const allTabs = [
    { href: `/${eventId}/event`, label: 'Home', icon: '🏠', feature: null },
    { href: `/${eventId}/event/agenda`, label: 'Agenda', icon: '📋', feature: 'agenda' as const },
    { href: `/${eventId}/event/react`, label: 'React', icon: '🎉', feature: 'reactions' as const },
    { href: `/${eventId}/event/shoutouts`, label: 'Shoutouts', icon: '💬', feature: 'shoutouts' as const },
    { href: `/${eventId}/event/photos`, label: 'Photos', icon: '📸', feature: 'photos' as const },
  ];

  const tabs = allTabs.filter((tab) => !tab.feature || !f || f[tab.feature] !== false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex h-[60px] max-w-md items-center justify-around pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive =
            tab.href === `/${eventId}/event`
              ? pathname === `/${eventId}/event`
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 text-xs transition-colors ${
                isActive
                  ? 'text-accent'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
