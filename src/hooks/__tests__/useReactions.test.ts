import { renderHook, act } from '@testing-library/react';
import { useReactions } from '@/hooks/useReactions';
import { onSnapshot, addDoc } from 'firebase/firestore';

jest.mock('@/contexts/EventContext', () => ({
  useEventId: () => 'test-event',
}));

jest.mock('firebase/firestore', () => ({
  onSnapshot: jest.fn(),
  query: jest.fn((...args: unknown[]) => args),
  where: jest.fn(() => 'where-clause'),
  serverTimestamp: jest.fn(() => 'server-ts'),
  addDoc: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/lib/firebase', () => ({
  db: 'mock-db',
  auth: { currentUser: { uid: 'test-uid-123' } },
}));

jest.mock('@/lib/firestore', () => ({
  getReactionsRef: jest.fn(() => 'mock-reactions-ref'),
  addDocument: jest.fn(() => Promise.resolve()),
}));

describe('useReactions', () => {
  const mockOnSnapshot = onSnapshot as jest.Mock;
  const mockUnsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
  });

  test('returns empty reactions when no programId', () => {
    const { result } = renderHook(() => useReactions(null));
    expect(result.current.reactions).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  test('subscribes to reactions for given programId', () => {
    const mockDocs = [
      { id: 'r1', data: () => ({ emoji: '👏', viewerId: 'v1', programId: 'prog-1' }) },
      { id: 'r2', data: () => ({ emoji: '❤️', viewerId: 'v2', programId: 'prog-1' }) },
      { id: 'r3', data: () => ({ emoji: '👏', viewerId: 'v3', programId: 'prog-1' }) },
    ];

    mockOnSnapshot.mockImplementation((_, callback: Function) => {
      callback({ docs: mockDocs });
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useReactions('prog-1'));
    expect(result.current.reactions).toHaveLength(3);
    expect(result.current.loading).toBe(false);
  });

  test('computes reaction counts correctly', () => {
    const mockDocs = [
      { id: 'r1', data: () => ({ emoji: '👏', viewerId: 'v1', programId: 'p1' }) },
      { id: 'r2', data: () => ({ emoji: '❤️', viewerId: 'v2', programId: 'p1' }) },
      { id: 'r3', data: () => ({ emoji: '👏', viewerId: 'v3', programId: 'p1' }) },
      { id: 'r4', data: () => ({ emoji: '🔥', viewerId: 'v4', programId: 'p1' }) },
      { id: 'r5', data: () => ({ emoji: '👏', viewerId: 'v5', programId: 'p1' }) },
    ];

    mockOnSnapshot.mockImplementation((_, callback: Function) => {
      callback({ docs: mockDocs });
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useReactions('p1'));
    expect(result.current.reactionCounts).toEqual({ '👏': 3, '❤️': 1, '🔥': 1 });
  });

  test('rate limits sendReaction to 500ms', async () => {
    const { addDocument } = require('@/lib/firestore');
    mockOnSnapshot.mockImplementation(() => mockUnsubscribe);

    const { result } = renderHook(() => useReactions('prog-1'));

    // First call should go through
    await act(async () => {
      await result.current.sendReaction('👏');
    });
    expect(addDocument).toHaveBeenCalledTimes(1);

    // Immediate second call should be rate-limited
    await act(async () => {
      await result.current.sendReaction('❤️');
    });
    expect(addDocument).toHaveBeenCalledTimes(1);
  });

  test('resubscribes when programId changes', () => {
    const { rerender } = renderHook(
      ({ programId }) => useReactions(programId),
      { initialProps: { programId: 'prog-1' as string | null } }
    );

    expect(mockOnSnapshot).toHaveBeenCalledTimes(1);

    rerender({ programId: 'prog-2' });
    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(mockOnSnapshot).toHaveBeenCalledTimes(2);
  });

  test('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useReactions('prog-1'));
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
