import { render, screen } from '@testing-library/react';

jest.mock('@/contexts/EventContext', () => ({
  useEventId: () => 'test-event',
}));

jest.mock('next/link', () => {
  return ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  );
});

jest.mock('@/hooks/useEvent', () => ({
  useEvent: () => ({
    event: {
      name: 'Test Event 2026',
      currentProgramId: 'prog-1',
      announcementText: '',
      announcementActive: false,
    },
    loading: false,
  }),
}));

jest.mock('@/hooks/usePrograms', () => ({
  usePrograms: () => ({
    programs: [
      {
        id: 'prog-1',
        title: 'Dance Performance',
        performers: 'Group A',
        emoji: '💃',
        durationMinutes: 30,
        order: 1,
        status: 'live',
      },
      {
        id: 'prog-2',
        title: 'Music',
        performers: 'Band B',
        emoji: '🎵',
        durationMinutes: 30,
        order: 2,
        status: 'upcoming',
      },
    ],
    loading: false,
  }),
}));

import EventHomePage from '@/app/[eventId]/event/page';

describe('Event Home Page', () => {
  beforeEach(() => {
    Storage.prototype.getItem = jest.fn(() => 'TestUser');
  });

  test('renders greeting with display name', () => {
    render(<EventHomePage />);
    expect(screen.getByText(/Good Evening, TestUser/)).toBeInTheDocument();
  });

  test('shows currently playing program', () => {
    render(<EventHomePage />);
    expect(screen.getByText(/Dance Performance/)).toBeInTheDocument();
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  test('renders feature cards for Agenda, React, Shoutouts', () => {
    render(<EventHomePage />);
    expect(screen.getByText('Agenda')).toBeInTheDocument();
    expect(screen.getByText('React Live')).toBeInTheDocument();
    expect(screen.getByText('Shoutouts')).toBeInTheDocument();
  });

  test('feature cards link to correct pages', () => {
    render(<EventHomePage />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/test-event/event/agenda');
    expect(hrefs).toContain('/test-event/event/react');
    expect(hrefs).toContain('/test-event/event/shoutouts');
  });
});


