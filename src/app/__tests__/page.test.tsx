import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-ts'),
}));

jest.mock('firebase/auth', () => ({
  signInAnonymously: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/lib/firebase', () => ({
  db: 'mock-db',
  auth: { currentUser: null },
}));

import Home from '@/app/page';

describe('Landing Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Event App title', () => {
    render(<Home />);
    expect(screen.getByText('Event App')).toBeInTheDocument();
  });

  test('renders Join Event and Create Event tabs', () => {
    render(<Home />);
    expect(screen.getAllByText('Join Event').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Create Event')).toBeInTheDocument();
  });

  test('shows join form by default with event code input', () => {
    render(<Home />);
    expect(screen.getByPlaceholderText(/Event code/)).toBeInTheDocument();
  });

  test('switches to create form when Create Event tab clicked', async () => {
    render(<Home />);
    await userEvent.click(screen.getByText('Create Event'));
    expect(screen.getByPlaceholderText(/Event name/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Admin password/)).toBeInTheDocument();
  });
});
