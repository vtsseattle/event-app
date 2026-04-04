import { render, screen } from '@testing-library/react';

jest.mock('@/contexts/EventContext', () => ({
  useEventId: () => 'test-event',
}));

jest.mock('@/hooks/useEvent', () => ({
  useEvent: () => ({
    event: { eventStartTime: '6:00 PM' },
    loading: false,
  }),
}));

jest.mock('@/hooks/usePrograms', () => ({
  usePrograms: () => ({
    programs: [
      {
        id: 'p1',
        title: 'Welcome Address',
        performers: 'MC',
        emoji: '🎤',
        durationMinutes: 15,
        order: 1,
        status: 'completed',
      },
      {
        id: 'p2',
        title: 'Dance Performance',
        performers: 'Group A',
        emoji: '💃',
        durationMinutes: 30,
        order: 2,
        status: 'live',
      },
      {
        id: 'p3',
        title: 'Dinner',
        performers: '',
        emoji: '🍽️',
        durationMinutes: 45,
        order: 3,
        status: 'upcoming',
      },
    ],
    loading: false,
  }),
}));

import AgendaPage from '@/app/[eventId]/event/agenda/page';

describe('Agenda Page', () => {
  test('renders page title', () => {
    render(<AgendaPage />);
    expect(screen.getByText('📋 Event Schedule')).toBeInTheDocument();
  });

  test('renders all programs', () => {
    render(<AgendaPage />);
    expect(screen.getByText(/Welcome Address/)).toBeInTheDocument();
    expect(screen.getByText(/Dance Performance/)).toBeInTheDocument();
    expect(screen.getByText(/Dinner/)).toBeInTheDocument();
  });

  test('shows LIVE badge for live program', () => {
    render(<AgendaPage />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  test('shows Up Next badge for upcoming program', () => {
    render(<AgendaPage />);
    expect(screen.getByText('Up Next')).toBeInTheDocument();
  });

  test('shows time ranges for programs', () => {
    render(<AgendaPage />);
    expect(screen.getByText('6:00 PM – 6:15 PM')).toBeInTheDocument();
    expect(screen.getByText('6:15 PM – 6:45 PM')).toBeInTheDocument();
  });

  test('shows performers when available', () => {
    render(<AgendaPage />);
    expect(screen.getByText('MC')).toBeInTheDocument();
    expect(screen.getByText('Group A')).toBeInTheDocument();
  });
});

describe('Agenda Page - Empty', () => {
  test('shows empty state when no programs', () => {
    jest.resetModules();
    jest.doMock('@/hooks/usePrograms', () => ({
      usePrograms: () => ({ programs: [], loading: false }),
    }));

    const EmptyAgendaPage = require('@/app/[eventId]/event/agenda/page').default;
    render(<EmptyAgendaPage />);
    expect(screen.getByText('Schedule Coming Soon')).toBeInTheDocument();
  });
});
