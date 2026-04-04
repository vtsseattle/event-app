import { render, screen, fireEvent } from '@testing-library/react';
import ShoutoutCard from '@/components/viewer/ShoutoutCard';
import type { Shoutout } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  Timestamp: {
    now: () => ({ seconds: Date.now() / 1000, nanoseconds: 0 }),
  },
}));

const makeShoutout = (overrides?: Partial<Shoutout>): Shoutout => ({
  id: 's1',
  text: 'Amazing performance!',
  viewerId: 'v1',
  displayName: 'Alice',
  upvotes: 5,
  upvotedBy: ['v2', 'v3'],
  status: 'visible',
  createdAt: { seconds: Date.now() / 1000 - 120, nanoseconds: 0 } as Timestamp,
  ...overrides,
});

describe('ShoutoutCard', () => {
  test('renders shoutout text and display name', () => {
    render(<ShoutoutCard shoutout={makeShoutout()} onUpvote={jest.fn()} isUpvoted={false} />);
    expect(screen.getByText('Amazing performance!')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  test('shows upvote count', () => {
    render(<ShoutoutCard shoutout={makeShoutout({ upvotes: 12 })} onUpvote={jest.fn()} isUpvoted={false} />);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  test('shows filled heart when upvoted', () => {
    render(<ShoutoutCard shoutout={makeShoutout()} onUpvote={jest.fn()} isUpvoted={true} />);
    expect(screen.getByText('❤️')).toBeInTheDocument();
  });

  test('shows empty heart when not upvoted', () => {
    render(<ShoutoutCard shoutout={makeShoutout()} onUpvote={jest.fn()} isUpvoted={false} />);
    expect(screen.getByText('🤍')).toBeInTheDocument();
  });

  test('calls onUpvote with shoutout id when clicked', () => {
    const onUpvote = jest.fn();
    render(<ShoutoutCard shoutout={makeShoutout({ id: 's42' })} onUpvote={onUpvote} isUpvoted={false} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onUpvote).toHaveBeenCalledWith('s42');
  });

  test('shows "just now" for recent shoutouts', () => {
    const recent = makeShoutout({
      createdAt: { seconds: Date.now() / 1000 - 10, nanoseconds: 0 } as Timestamp,
    });
    render(<ShoutoutCard shoutout={recent} onUpvote={jest.fn()} isUpvoted={false} />);
    expect(screen.getByText('just now')).toBeInTheDocument();
  });

  test('shows minutes ago for older shoutouts', () => {
    const older = makeShoutout({
      createdAt: { seconds: Date.now() / 1000 - 300, nanoseconds: 0 } as Timestamp,
    });
    render(<ShoutoutCard shoutout={older} onUpvote={jest.fn()} isUpvoted={false} />);
    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });

  test('shows hours ago for much older shoutouts', () => {
    const veryOld = makeShoutout({
      createdAt: { seconds: Date.now() / 1000 - 7200, nanoseconds: 0 } as Timestamp,
    });
    render(<ShoutoutCard shoutout={veryOld} onUpvote={jest.fn()} isUpvoted={false} />);
    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });

  test('handles null createdAt gracefully', () => {
    const noTimestamp = makeShoutout({ createdAt: null as unknown as Timestamp });
    render(<ShoutoutCard shoutout={noTimestamp} onUpvote={jest.fn()} isUpvoted={false} />);
    expect(screen.getByText('just now')).toBeInTheDocument();
  });
});
