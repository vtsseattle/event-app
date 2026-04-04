import { renderHook } from '@testing-library/react';
import { useViewerCount } from '@/hooks/useViewerCount';
import { onSnapshot } from 'firebase/firestore';

jest.mock('@/contexts/EventContext', () => ({
  useEventId: () => 'test-event',
}));

jest.mock('firebase/firestore', () => ({
  onSnapshot: jest.fn(),
  query: jest.fn((...args: unknown[]) => args),
  where: jest.fn(() => 'where-clause'),
}));

jest.mock('@/lib/firebase', () => ({
  db: 'mock-db',
}));

jest.mock('@/lib/firestore', () => ({
  getViewersRef: jest.fn(() => 'mock-viewers-ref'),
}));

describe('useViewerCount', () => {
  const mockOnSnapshot = onSnapshot as jest.Mock;
  const mockUnsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
  });

  test('starts with count=0 and loading=true', () => {
    const { result } = renderHook(() => useViewerCount());
    expect(result.current.count).toBe(0);
    expect(result.current.loading).toBe(true);
  });

  test('queries only online viewers', () => {
    const { where } = require('firebase/firestore');
    renderHook(() => useViewerCount());
    expect(where).toHaveBeenCalledWith('isOnline', '==', true);
  });

  test('returns snapshot size as count', () => {
    mockOnSnapshot.mockImplementation((_, callback: Function) => {
      callback({ size: 42 });
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useViewerCount());
    expect(result.current.count).toBe(42);
    expect(result.current.loading).toBe(false);
  });

  test('handles errors gracefully', () => {
    mockOnSnapshot.mockImplementation((_, _s: Function, onError: Function) => {
      onError(new Error('fail'));
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useViewerCount());
    expect(result.current.loading).toBe(false);
  });

  test('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useViewerCount());
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
