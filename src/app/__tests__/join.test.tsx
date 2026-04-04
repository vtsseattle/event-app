import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('@/contexts/EventContext', () => ({
  useEventId: () => 'test-event',
}));

jest.mock('@/hooks/useEvent', () => ({
  useEvent: () => ({
    event: { name: 'Test Event', tagline: 'A test event' },
    loading: false,
  }),
}));

// Mock auth context
const mockSignIn = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({
    user: null,
    loading: false,
    signIn: mockSignIn,
    signOut: jest.fn(),
  }),
}));

import JoinPage from '@/app/[eventId]/join/page';

describe('Join Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Storage.prototype.setItem = jest.fn();
  });

  test('renders join form with name input and button', () => {
    render(<JoinPage />);
    expect(screen.getByLabelText('Your Name')).toBeInTheDocument();
    expect(screen.getByText('Join Event 🎉')).toBeInTheDocument();
  });

  test('shows event branding', () => {
    render(<JoinPage />);
    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('A test event')).toBeInTheDocument();
  });

  test('validates minimum name length', async () => {
    render(<JoinPage />);

    const input = screen.getByLabelText('Your Name');
    const button = screen.getByText('Join Event 🎉');

    await userEvent.type(input, 'A');
    fireEvent.click(button);

    expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  test('calls signIn with valid name', async () => {
    mockSignIn.mockResolvedValue({ uid: 'new-uid' });
    render(<JoinPage />);

    const input = screen.getByLabelText('Your Name');
    await userEvent.type(input, 'John Doe');
    fireEvent.click(screen.getByText('Join Event 🎉'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('John Doe');
    });
  });

  test('saves display name to localStorage on success', async () => {
    mockSignIn.mockResolvedValue({ uid: 'new-uid' });
    render(<JoinPage />);

    const input = screen.getByLabelText('Your Name');
    await userEvent.type(input, 'Alice');
    fireEvent.click(screen.getByText('Join Event 🎉'));

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('test-event_displayName', 'Alice');
    });
  });

  test('shows error on sign-in failure', async () => {
    mockSignIn.mockRejectedValue(new Error('Auth failed'));
    render(<JoinPage />);

    const input = screen.getByLabelText('Your Name');
    await userEvent.type(input, 'Bob');
    fireEvent.click(screen.getByText('Join Event 🎉'));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });
  });

  test('clears error when typing after error', async () => {
    render(<JoinPage />);

    // Trigger validation error
    const input = screen.getByLabelText('Your Name');
    await userEvent.type(input, 'A');
    fireEvent.click(screen.getByText('Join Event 🎉'));
    expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();

    // Type more — error should clear
    await userEvent.type(input, 'l');
    expect(screen.queryByText('Name must be at least 2 characters')).not.toBeInTheDocument();
  });
});
