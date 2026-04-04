'use client';

import { createContext, useContext, ReactNode } from 'react';

interface EventContextValue {
  eventId: string;
}

const EventContext = createContext<EventContextValue | undefined>(undefined);

export function EventProvider({
  eventId,
  children,
}: {
  eventId: string;
  children: ReactNode;
}) {
  return (
    <EventContext.Provider value={{ eventId }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEventId(): string {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEventId must be used within an EventProvider');
  }
  return context.eventId;
}
