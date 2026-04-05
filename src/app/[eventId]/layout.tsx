'use client';

import { useParams } from 'next/navigation';
import { EventProvider } from '@/contexts/EventContext';
import { AuthProvider } from '@/contexts/AuthContext';

export default function EventIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const eventId = (params.eventId as string).toLowerCase();

  return (
    <EventProvider eventId={eventId}>
      <AuthProvider eventId={eventId}>{children}</AuthProvider>
    </EventProvider>
  );
}
