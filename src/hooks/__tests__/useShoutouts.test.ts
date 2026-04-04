import { renderHook, act } from '@testing-library/react';
import { useShoutouts } from '@/hooks/useShoutouts';
import { onSnapshot } from 'firebase/firestore';

jest.mock('@/contexts/EventContext', () => ({
  useEventId: () => 'test-event',
}));

jest.mock('firebase/firestore', () => ({
  onSnapshot: jest.fn(),
  query: jest.fn((...args: unknown[]) => args),
  where: jest.fn(() => 'where-clause'),
  orderBy: jest.fn(() => 'orderby-clause'),
  doc: jest.fn(() => 'mock-doc-ref'),
  serverTimestamp: jest.fn(() => 'server-ts'),
  runTransaction: jest.fn(),
  arrayUnion: jest.fn((...args: unknown[]) => ({ _type: 'arrayUnion', args })),
  arrayRemove: jest.fn((...args: unknown[]) => ({ _type: 'arrayRemove', args })),
}));

jest.mock('@/lib/firebase', () => ({
  db: 'mock-db',
  auth: { currentUser: { uid: 'test-uid-123' } },
}));

const mockAddDocument = jest.fn(() => Promise.resolve());
jest.mock('@/lib/firestore', () => ({
  getShoutoutsRef: jest.fn(() => 'mock-shoutouts-ref'),
  addDocument: (...args: unknown[]) => mockAddDocument(...args),
}));

describe('useShoutouts', () => {
  const mockOnSnapshot = onSnapshot as jest.Mock;
  const mockUnsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => 'TestUser');
  });

  test('starts with loading=true and empty shoutouts', () => {
    const { result } = renderHook(() => useShoutouts());
    expect(result.current.loading).toBe(true);
    expect(result.current.shoutouts).toEqual([]);
  });

  test('queries with status in [visible, flagged] and orders by createdAt desc', () => {
    const { where, orderBy } = require('firebase/firestore');

    renderHook(() => useShoutouts());
    expect(where).toHaveBeenCalledWith('status', 'in', ['visible', 'flagged']);
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
  });

  test('maps snapshot docs to Shoutout array', () => {
    const mockDocs = [
      {
        id: 's1',
        data: () => ({
          text: 'Great show!',
          viewerId: 'v1',
          displayName: 'Alice',
          upvotes: 5,
          upvotedBy: ['v2', 'v3'],
          status: 'visible',
        }),
      },
      {
        id: 's2',
        data: () => ({
          text: 'Love it!',
          viewerId: 'v2',
          displayName: 'Bob',
          upvotes: 2,
          upvotedBy: ['v1'],
          status: 'flagged',
        }),
      },
    ];

    mockOnSnapshot.mockImplementation((_, callback: Function) => {
      callback({ docs: mockDocs });
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useShoutouts());
    expect(result.current.shoutouts).toHaveLength(2);
    expect(result.current.shoutouts[0].text).toBe('Great show!');
    expect(result.current.shoutouts[1].displayName).toBe('Bob');
    expect(result.current.loading).toBe(false);
  });

  test('sendShoutout validates text length (max 200)', async () => {
    mockOnSnapshot.mockImplementation(() => mockUnsubscribe);

    const { result } = renderHook(() => useShoutouts());

    // Empty text should be rejected
    await act(async () => {
      await result.current.sendShoutout('');
    });
    expect(mockAddDocument).not.toHaveBeenCalled();

    // Text over 200 chars should be rejected
    await act(async () => {
      await result.current.sendShoutout('a'.repeat(201));
    });
    expect(mockAddDocument).not.toHaveBeenCalled();
  });

  test('sendShoutout trims whitespace', async () => {
    mockOnSnapshot.mockImplementation(() => mockUnsubscribe);

    const { result } = renderHook(() => useShoutouts());

    // Whitespace-only should be rejected
    await act(async () => {
      await result.current.sendShoutout('   ');
    });
    expect(mockAddDocument).not.toHaveBeenCalled();
  });

  test('sendShoutout creates document with correct fields', async () => {
    mockOnSnapshot.mockImplementation(() => mockUnsubscribe);

    const { result } = renderHook(() => useShoutouts());

    await act(async () => {
      await result.current.sendShoutout('Great performance!');
    });

    expect(mockAddDocument).toHaveBeenCalledWith(
      'mock-shoutouts-ref',
      expect.objectContaining({
        text: 'Great performance!',
        viewerId: 'test-uid-123',
        displayName: 'TestUser',
        upvotes: 0,
        upvotedBy: [],
        status: 'visible',
      })
    );
  });

  test('sendShoutout rate limits to 3 seconds', async () => {
    mockOnSnapshot.mockImplementation(() => mockUnsubscribe);

    const { result } = renderHook(() => useShoutouts());

    await act(async () => {
      await result.current.sendShoutout('First shoutout');
    });
    expect(mockAddDocument).toHaveBeenCalledTimes(1);

    // Immediate second call should be rate-limited
    await act(async () => {
      await result.current.sendShoutout('Second shoutout');
    });
    expect(mockAddDocument).toHaveBeenCalledTimes(1);
  });

  test('toggleUpvote calls runTransaction', async () => {
    const { runTransaction } = require('firebase/firestore');
    mockOnSnapshot.mockImplementation(() => mockUnsubscribe);

    const { result } = renderHook(() => useShoutouts());

    await act(async () => {
      await result.current.toggleUpvote('shoutout-1');
    });
    expect(runTransaction).toHaveBeenCalled();
  });

  test('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useShoutouts());
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
