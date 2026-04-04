import { renderHook } from '@testing-library/react';
import { usePrograms } from '@/hooks/usePrograms';
import { onSnapshot, query, orderBy } from 'firebase/firestore';

jest.mock('@/contexts/EventContext', () => ({
  useEventId: () => 'test-event',
}));

jest.mock('firebase/firestore', () => ({
  onSnapshot: jest.fn(),
  query: jest.fn((...args: unknown[]) => args),
  orderBy: jest.fn(() => 'order-by-order'),
}));

jest.mock('@/lib/firebase', () => ({
  db: 'mock-db',
}));

jest.mock('@/lib/firestore', () => ({
  getProgramsRef: jest.fn(() => 'mock-programs-ref'),
}));

describe('usePrograms', () => {
  const mockOnSnapshot = onSnapshot as jest.Mock;
  const mockUnsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
  });

  test('starts with loading=true and empty programs', () => {
    const { result } = renderHook(() => usePrograms());
    expect(result.current.loading).toBe(true);
    expect(result.current.programs).toEqual([]);
  });

  test('queries programs ordered by "order" field', () => {
    renderHook(() => usePrograms());
    expect(orderBy).toHaveBeenCalledWith('order');
    expect(query).toHaveBeenCalled();
  });

  test('maps snapshot docs to Program array', () => {
    const mockDocs = [
      {
        id: 'prog-1',
        data: () => ({
          title: 'Welcome',
          performers: 'MC',
          emoji: '🎤',
          durationMinutes: 15,
          order: 1,
          status: 'completed',
        }),
      },
      {
        id: 'prog-2',
        data: () => ({
          title: 'Dance Performance',
          performers: 'Group A',
          emoji: '💃',
          durationMinutes: 15,
          order: 2,
          status: 'live',
        }),
      },
    ];

    mockOnSnapshot.mockImplementation((_, callback: Function) => {
      callback({ docs: mockDocs });
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => usePrograms());
    expect(result.current.programs).toHaveLength(2);
    expect(result.current.programs[0].id).toBe('prog-1');
    expect(result.current.programs[0].title).toBe('Welcome');
    expect(result.current.programs[1].status).toBe('live');
    expect(result.current.loading).toBe(false);
  });

  test('handles errors gracefully', () => {
    mockOnSnapshot.mockImplementation((_, _s: Function, onError: Function) => {
      onError(new Error('fail'));
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => usePrograms());
    expect(result.current.loading).toBe(false);
    expect(result.current.programs).toEqual([]);
  });

  test('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => usePrograms());
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
