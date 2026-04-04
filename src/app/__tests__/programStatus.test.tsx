/**
 * Program Status Management Tests
 *
 * Tests all status transitions across admin (NowPlaying, Programs)
 * and viewer (React, Agenda) screens. Verifies that program.status
 * and event.currentProgramId stay in sync across every operation.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// --- EventContext mock (must be before component imports) ---
jest.mock('@/contexts/EventContext', () => ({
  useEventId: () => 'test-event',
}));

// --- Mock setup ---

const mockUpdateDocument = jest.fn(() => Promise.resolve());
const mockDeleteDocument = jest.fn(() => Promise.resolve());
const mockAddDocument = jest.fn(() => Promise.resolve({ id: 'new-prog' }));

let mockEvent: Record<string, unknown> | null = null;
let mockPrograms: Array<Record<string, unknown>> = [];

jest.mock('@/hooks/useEvent', () => ({
  useEvent: () => ({ event: mockEvent, loading: false }),
}));

jest.mock('@/hooks/usePrograms', () => ({
  usePrograms: () => ({ programs: mockPrograms, loading: false }),
}));

jest.mock('@/hooks/useReactions', () => ({
  useReactions: () => ({
    reactions: [],
    reactionCounts: {},
    sendReaction: jest.fn(),
    loading: false,
  }),
}));

jest.mock('@/hooks/useViewerCount', () => ({
  useViewerCount: () => ({ count: 5 }),
}));

jest.mock('@/lib/firestore', () => ({
  getEventRef: jest.fn(() => 'mock-event-ref'),
  getProgramsRef: jest.fn(() => 'mock-programs-ref'),
  updateDocument: (...args: unknown[]) => mockUpdateDocument(...args),
  deleteDocument: (...args: unknown[]) => mockDeleteDocument(...args),
  addDocument: (...args: unknown[]) => mockAddDocument(...args),
}));

jest.mock('@/lib/storage', () => ({
  uploadProgramImage: jest.fn(() => Promise.resolve('https://img.url/hero.jpg')),
  deleteProgramImage: jest.fn(() => Promise.resolve()),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((_ref: unknown, id: string) => `mock-doc-ref-${id}`),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
}));

jest.mock('@/lib/firebase', () => ({
  db: 'mock-db',
  auth: { currentUser: { uid: 'test-uid' } },
  storage: 'mock-storage',
  default: 'mock-app',
}));

// --- Helper data ---

function makePrograms(overrides?: Partial<Record<string, unknown>>[]) {
  const defaults = [
    { id: 'prog-1', title: 'Welcome', performers: 'MC', emoji: '🎤', durationMinutes: 10, order: 1, status: 'completed' },
    { id: 'prog-2', title: 'Dance', performers: 'Group A', emoji: '💃', durationMinutes: 20, order: 2, status: 'live' },
    { id: 'prog-3', title: 'Music', performers: 'Band B', emoji: '🎵', durationMinutes: 15, order: 3, status: 'upcoming' },
    { id: 'prog-4', title: 'Nethra Vidyalaya', performers: 'School', emoji: '🎓', durationMinutes: 15, order: 4, status: 'upcoming', heroImageUrl: 'https://img.url/nv.jpg', description: 'A school for visually impaired children.' },
  ];
  if (overrides) {
    return defaults.map((d, i) => ({ ...d, ...overrides[i] }));
  }
  return defaults;
}

function makeEvent(overrides?: Partial<Record<string, unknown>>) {
  return {
    name: 'Test Event 2026',
    eventStartTime: '5:00 PM',
    currentProgramId: 'prog-2',
    announcementText: '',
    announcementActive: false,
    bigScreenMode: 'reactions',
    ...overrides,
  };
}

// ===================================================================
// NOW PLAYING PAGE TESTS
// ===================================================================
describe('NowPlaying Page – Status Transitions', () => {
  // Must require after mocks are set up
  let NowPlayingPage: React.ComponentType;

  beforeAll(() => {
    NowPlayingPage = require('@/app/[eventId]/admin/dashboard/nowplaying/page').default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrograms = makePrograms();
    mockEvent = makeEvent();
  });

  test('shows LIVE NOW indicator on the currently playing program', () => {
    render(<NowPlayingPage />);
    expect(screen.getByText('LIVE NOW')).toBeInTheDocument();
    expect(screen.getByText('Dance')).toBeInTheDocument();
  });

  test('shows Clear Now Playing button when a program is live', () => {
    render(<NowPlayingPage />);
    expect(screen.getByText('Clear Now Playing')).toBeInTheDocument();
  });

  test('does not show Clear Now Playing button when no program is live', () => {
    mockEvent = makeEvent({ currentProgramId: null });
    render(<NowPlayingPage />);
    expect(screen.queryByText('Clear Now Playing')).not.toBeInTheDocument();
  });

  test('setNowPlaying: marks previous live program as completed, new as live, updates event', async () => {
    const user = userEvent.setup();
    render(<NowPlayingPage />);

    // Click on prog-3 (Music) to make it live
    const musicCard = screen.getByText('Music').closest('button')!;
    await user.click(musicCard);

    // Should mark prog-2 (Dance) as completed
    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-doc-ref-prog-2', { status: 'completed' });
    // Should mark prog-3 (Music) as live
    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-doc-ref-prog-3', { status: 'live' });
    // Should update event's currentProgramId
    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-event-ref', { currentProgramId: 'prog-3' });
  });

  test('setNowPlaying on first program when nothing is live: only sets new program live', async () => {
    mockPrograms = makePrograms([
      { status: 'upcoming' },
      { status: 'upcoming' },
      { status: 'upcoming' },
      { status: 'upcoming' },
    ]);
    mockEvent = makeEvent({ currentProgramId: null });
    const user = userEvent.setup();
    render(<NowPlayingPage />);

    const welcomeCard = screen.getByText('Welcome').closest('button')!;
    await user.click(welcomeCard);

    // No previous live program to complete
    expect(mockUpdateDocument).not.toHaveBeenCalledWith(expect.anything(), { status: 'completed' });
    // Should set prog-1 as live
    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-doc-ref-prog-1', { status: 'live' });
    // Should update event
    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-event-ref', { currentProgramId: 'prog-1' });
  });

  test('clearNowPlaying: marks live program as completed and clears event currentProgramId', async () => {
    const user = userEvent.setup();
    render(<NowPlayingPage />);

    await user.click(screen.getByText('Clear Now Playing'));

    // Should mark the live program (prog-2) as completed
    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-doc-ref-prog-2', { status: 'completed' });
    // Should clear event's currentProgramId
    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-event-ref', { currentProgramId: null });
  });

  test('clearNowPlaying when no program has live status: still clears event currentProgramId', async () => {
    // Edge case: event.currentProgramId is set but no program has status 'live'
    mockPrograms = makePrograms([
      { status: 'completed' },
      { status: 'completed' },
      { status: 'upcoming' },
      { status: 'upcoming' },
    ]);
    mockEvent = makeEvent({ currentProgramId: 'prog-2' });
    const user = userEvent.setup();
    render(<NowPlayingPage />);

    await user.click(screen.getByText('Clear Now Playing'));

    // Should not try to complete any program (none are live)
    expect(mockUpdateDocument).not.toHaveBeenCalledWith(expect.stringContaining('mock-doc-ref'), { status: 'completed' });
    // Should still clear event
    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-event-ref', { currentProgramId: null });
  });

  test('switching from one live program to another: completes old, sets new, updates event', async () => {
    const user = userEvent.setup();
    render(<NowPlayingPage />);

    // prog-2 is currently live, click prog-1 (Welcome) to switch
    const welcomeCard = screen.getByText('Welcome').closest('button')!;
    await user.click(welcomeCard);

    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-doc-ref-prog-2', { status: 'completed' });
    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-doc-ref-prog-1', { status: 'live' });
    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-event-ref', { currentProgramId: 'prog-1' });
    expect(mockUpdateDocument).toHaveBeenCalledTimes(3);
  });

  test('clicking the already-live program: re-sets it (idempotent)', async () => {
    const user = userEvent.setup();
    render(<NowPlayingPage />);

    // Click prog-2 which is already live
    const danceCard = screen.getByText('Dance').closest('button')!;
    await user.click(danceCard);

    // It finds itself as previousLive and completes itself, then sets itself live again
    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-doc-ref-prog-2', { status: 'completed' });
    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-doc-ref-prog-2', { status: 'live' });
    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-event-ref', { currentProgramId: 'prog-2' });
  });

  test('shows empty state when no programs exist', () => {
    mockPrograms = [];
    render(<NowPlayingPage />);
    expect(screen.getByText(/No programs to display/)).toBeInTheDocument();
  });
});

// ===================================================================
// PROGRAMS PAGE TESTS – Reset & Delete status sync
// ===================================================================
describe('Programs Page – Reset & Delete Status Sync', () => {
  let ProgramsPage: React.ComponentType;

  beforeAll(() => {
    ProgramsPage = require('@/app/[eventId]/admin/dashboard/programs/page').default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrograms = makePrograms();
    mockEvent = makeEvent();
  });

  test('reset a live program: sets status to upcoming AND clears currentProgramId', async () => {
    const user = userEvent.setup();
    render(<ProgramsPage />);

    // prog-2 (Dance) is live, find its Reset button
    const resetButtons = screen.getAllByText('Reset');
    // There should be reset buttons for completed (prog-1) and live (prog-2) programs
    expect(resetButtons.length).toBeGreaterThanOrEqual(1);

    // Click the first Reset (prog-1 completed) — should NOT clear currentProgramId
    await user.click(resetButtons[0]);
    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-doc-ref-prog-1', { status: 'upcoming' });
    // prog-1 is not the currentProgramId, so event should NOT be updated
    expect(mockUpdateDocument).not.toHaveBeenCalledWith('mock-event-ref', { currentProgramId: null });

    jest.clearAllMocks();

    // Click the second Reset (prog-2 live) — SHOULD clear currentProgramId
    await user.click(resetButtons[1]);
    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-doc-ref-prog-2', { status: 'upcoming' });
    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-event-ref', { currentProgramId: null });
  });

  test('reset a completed program that is NOT currentProgramId: does not touch event', async () => {
    mockPrograms = makePrograms([
      { status: 'completed' },
      { status: 'live' },
      { status: 'upcoming' },
      { status: 'upcoming' },
    ]);
    mockEvent = makeEvent({ currentProgramId: 'prog-2' });
    const user = userEvent.setup();
    render(<ProgramsPage />);

    const resetButtons = screen.getAllByText('Reset');
    // First reset is for prog-1 (completed but not currentProgramId)
    await user.click(resetButtons[0]);

    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-doc-ref-prog-1', { status: 'upcoming' });
    expect(mockUpdateDocument).toHaveBeenCalledTimes(1); // Only program status, not event
  });

  test('delete a program: calls deleteDocument', async () => {
    const user = userEvent.setup();
    render(<ProgramsPage />);

    // Click Delete on prog-1
    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    // Should show confirmation
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    await user.click(screen.getByText('Confirm'));

    expect(mockDeleteDocument).toHaveBeenCalledWith('mock-doc-ref-prog-1');
  });

  test('shows Reset button only for non-upcoming programs', () => {
    render(<ProgramsPage />);
    // prog-1 (completed) and prog-2 (live) should have Reset buttons
    // prog-3 and prog-4 (upcoming) should not
    const resetButtons = screen.getAllByText('Reset');
    expect(resetButtons).toHaveLength(2);
  });

  test('shows correct status badges for all programs', () => {
    render(<ProgramsPage />);
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('live')).toBeInTheDocument();
    const upcomingBadges = screen.getAllByText('upcoming');
    expect(upcomingBadges).toHaveLength(2);
  });
});

// ===================================================================
// REACT (VIEWER) PAGE – Status display
// ===================================================================
describe('React Page – Viewer Status Display', () => {
  let ReactPage: React.ComponentType;

  beforeAll(() => {
    jest.mock('@/components/viewer/FloatingEmoji', () => {
      return function MockFloatingEmoji() { return null; };
    });
    jest.mock('@/components/viewer/ReactionButton', () => {
      return function MockReactionButton({ emoji, disabled }: { emoji: string; disabled: boolean }) {
        return <button disabled={disabled} data-testid={`reaction-${emoji}`}>{emoji}</button>;
      };
    });
    ReactPage = require('@/app/[eventId]/event/react/page').default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrograms = makePrograms();
    mockEvent = makeEvent();
  });

  test('shows NOW PERFORMING when a program is live', () => {
    render(<ReactPage />);
    expect(screen.getByText('NOW PERFORMING')).toBeInTheDocument();
    expect(screen.getByText(/Dance/)).toBeInTheDocument();
  });

  test('shows waiting state when no program is live (currentProgramId is null)', () => {
    mockEvent = makeEvent({ currentProgramId: null });
    render(<ReactPage />);
    expect(screen.getByText(/Waiting for the next performance/)).toBeInTheDocument();
    expect(screen.queryByText('NOW PERFORMING')).not.toBeInTheDocument();
  });

  test('shows waiting state when currentProgramId points to a non-existent program', () => {
    mockEvent = makeEvent({ currentProgramId: 'deleted-program-id' });
    render(<ReactPage />);
    expect(screen.getByText(/Waiting for the next performance/)).toBeInTheDocument();
  });

  test('reaction buttons are disabled when no program is live', () => {
    mockEvent = makeEvent({ currentProgramId: null });
    render(<ReactPage />);
    const buttons = screen.getAllByRole('button');
    const reactionButtons = buttons.filter(b => b.getAttribute('data-testid')?.startsWith('reaction-'));
    reactionButtons.forEach(btn => {
      expect(btn).toBeDisabled();
    });
  });

  test('reaction buttons are enabled when a program is live', () => {
    render(<ReactPage />);
    const buttons = screen.getAllByRole('button');
    const reactionButtons = buttons.filter(b => b.getAttribute('data-testid')?.startsWith('reaction-'));
    reactionButtons.forEach(btn => {
      expect(btn).not.toBeDisabled();
    });
  });

  test('shows "Learn more" toggle when program has hero content', () => {
    mockEvent = makeEvent({ currentProgramId: 'prog-4' });
    render(<ReactPage />);
    expect(screen.getByText('Learn more ▾')).toBeInTheDocument();
  });

  test('does not show "Learn more" toggle when program has no hero content', () => {
    render(<ReactPage />);
    // prog-2 (Dance) has no heroImageUrl or description
    expect(screen.queryByText('Learn more ▾')).not.toBeInTheDocument();
  });

  test('expanding hero card shows image and description', async () => {
    mockEvent = makeEvent({ currentProgramId: 'prog-4' });
    const user = userEvent.setup();
    render(<ReactPage />);

    // Description should not be visible initially
    expect(screen.queryByText('A school for visually impaired children.')).not.toBeInTheDocument();

    await user.click(screen.getByText('Learn more ▾'));

    expect(screen.getByText('A school for visually impaired children.')).toBeInTheDocument();
    expect(screen.getByAltText('Nethra Vidyalaya')).toBeInTheDocument();
    expect(screen.getByText('Show less ▴')).toBeInTheDocument();
  });

  test('collapsing hero card hides image and description', async () => {
    mockEvent = makeEvent({ currentProgramId: 'prog-4' });
    const user = userEvent.setup();
    render(<ReactPage />);

    await user.click(screen.getByText('Learn more ▾'));
    expect(screen.getByText('A school for visually impaired children.')).toBeInTheDocument();

    await user.click(screen.getByText('Show less ▴'));
    expect(screen.queryByText('A school for visually impaired children.')).not.toBeInTheDocument();
  });

  test('shows viewer count when > 0', () => {
    render(<ReactPage />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('displays performers when present', () => {
    render(<ReactPage />);
    expect(screen.getByText('Group A')).toBeInTheDocument();
  });
});

// ===================================================================
// AGENDA PAGE – Status display for viewers
// ===================================================================
describe('Agenda Page – Viewer Status Display', () => {
  let AgendaPage: React.ComponentType;

  beforeAll(() => {
    AgendaPage = require('@/app/[eventId]/event/agenda/page').default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrograms = makePrograms();
    mockEvent = makeEvent();
  });

  test('shows LIVE badge on the currently live program', () => {
    render(<AgendaPage />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  test('shows Up Next badge on upcoming programs', () => {
    render(<AgendaPage />);
    const upNextBadges = screen.getAllByText('Up Next');
    expect(upNextBadges).toHaveLength(2); // prog-3 and prog-4
  });

  test('shows hero image when program has heroImageUrl', () => {
    render(<AgendaPage />);
    const heroImg = screen.getByAltText('Nethra Vidyalaya');
    expect(heroImg).toBeInTheDocument();
    expect(heroImg).toHaveAttribute('src', 'https://img.url/nv.jpg');
  });

  test('shows description when program has one', () => {
    render(<AgendaPage />);
    expect(screen.getByText('A school for visually impaired children.')).toBeInTheDocument();
  });

  test('does not show hero image for programs without one', () => {
    render(<AgendaPage />);
    // Only Nethra Vidyalaya has an image — so only one img tag
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(1);
  });

  test('shows Schedule Coming Soon when no programs exist', () => {
    mockPrograms = [];
    render(<AgendaPage />);
    expect(screen.getByText('Schedule Coming Soon')).toBeInTheDocument();
  });

  test('renders all programs in order', () => {
    render(<AgendaPage />);
    expect(screen.getByText(/Welcome/)).toBeInTheDocument();
    expect(screen.getByText(/Dance/)).toBeInTheDocument();
    expect(screen.getByText(/Music/)).toBeInTheDocument();
    expect(screen.getByText(/Nethra Vidyalaya/)).toBeInTheDocument();
  });

  test('completed programs have reduced opacity styling', () => {
    render(<AgendaPage />);
    // prog-1 (Welcome) is completed — its container should have opacity-60 class
    const welcomeTitle = screen.getByText(/Welcome/);
    const card = welcomeTitle.closest('.mb-4.flex-1');
    expect(card?.className).toContain('opacity-60');
  });
});

// ===================================================================
// CROSS-CUTTING: event.currentProgramId ↔ program.status consistency
// ===================================================================
describe('Cross-cutting – currentProgramId and status consistency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('NowPlaying setNowPlaying always writes exactly 3 updates when a program is already live', async () => {
    mockPrograms = makePrograms();
    mockEvent = makeEvent();
    const NowPlayingPage = require('@/app/[eventId]/admin/dashboard/nowplaying/page').default;
    const user = userEvent.setup();
    render(<NowPlayingPage />);

    await user.click(screen.getByText('Music').closest('button')!);

    // 1. Complete old live, 2. Set new live, 3. Update event
    expect(mockUpdateDocument).toHaveBeenCalledTimes(3);
  });

  test('NowPlaying setNowPlaying writes exactly 2 updates when no program is currently live', async () => {
    mockPrograms = makePrograms([
      { status: 'upcoming' },
      { status: 'upcoming' },
      { status: 'upcoming' },
      { status: 'upcoming' },
    ]);
    mockEvent = makeEvent({ currentProgramId: null });
    const NowPlayingPage = require('@/app/[eventId]/admin/dashboard/nowplaying/page').default;
    const user = userEvent.setup();
    render(<NowPlayingPage />);

    await user.click(screen.getByText('Welcome').closest('button')!);

    // 1. Set new live, 2. Update event (no old live to complete)
    expect(mockUpdateDocument).toHaveBeenCalledTimes(2);
  });

  test('Programs handleReset writes exactly 2 updates when resetting the currentProgramId', async () => {
    mockPrograms = makePrograms();
    mockEvent = makeEvent({ currentProgramId: 'prog-2' });
    const ProgramsPage = require('@/app/[eventId]/admin/dashboard/programs/page').default;
    const user = userEvent.setup();
    render(<ProgramsPage />);

    // Reset the live program (prog-2)
    const resetButtons = screen.getAllByText('Reset');
    const liveResetButton = resetButtons[1]; // prog-2's reset
    await user.click(liveResetButton);

    // 1. Set status to upcoming, 2. Clear currentProgramId
    expect(mockUpdateDocument).toHaveBeenCalledTimes(2);
    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-doc-ref-prog-2', { status: 'upcoming' });
    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-event-ref', { currentProgramId: null });
  });

  test('Programs handleReset writes exactly 1 update when resetting a non-current program', async () => {
    mockPrograms = makePrograms();
    mockEvent = makeEvent({ currentProgramId: 'prog-2' });
    const ProgramsPage = require('@/app/[eventId]/admin/dashboard/programs/page').default;
    const user = userEvent.setup();
    render(<ProgramsPage />);

    // Reset prog-1 (completed, but not currentProgramId)
    const resetButtons = screen.getAllByText('Reset');
    await user.click(resetButtons[0]);

    expect(mockUpdateDocument).toHaveBeenCalledTimes(1);
    expect(mockUpdateDocument).toHaveBeenCalledWith('mock-doc-ref-prog-1', { status: 'upcoming' });
  });

  test('viewer React page shows waiting state when event has no currentProgramId', () => {
    mockEvent = makeEvent({ currentProgramId: null });
    mockPrograms = makePrograms();

    jest.mock('@/components/viewer/FloatingEmoji', () => {
      return function MockFloatingEmoji() { return null; };
    });
    jest.mock('@/components/viewer/ReactionButton', () => {
      return function MockReactionButton({ emoji, disabled }: { emoji: string; disabled: boolean }) {
        return <button disabled={disabled} data-testid={`reaction-${emoji}`}>{emoji}</button>;
      };
    });

    const ReactPage = require('@/app/[eventId]/event/react/page').default;
    render(<ReactPage />);
    expect(screen.getByText(/Waiting for the next performance/)).toBeInTheDocument();
  });
});
