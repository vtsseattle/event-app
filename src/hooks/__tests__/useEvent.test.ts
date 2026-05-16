import { renderHook } from '@testing-library/react';
import { useEvent } from '@/hooks/useEvent';
import { onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

jest.mock('@/contexts/EventContext', () => ({
  useEventId: () => 'test-event',
}));

jest.mock('firebase/firestore', () => ({
  onSnapshot: jest.fn(),
  doc: jest.fn(() => 'mock-doc-ref'),
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
  db: 'mock-db',
  auth: 'mock-auth',
}));

jest.mock('@/lib/firestore', () => ({
  getEventRef: jest.fn(() => 'mock-event-ref'),
}));

describe('useEvent', () => {
  const mockOnSnapshot = onSnapshot as jest.Mock;
  const mockOnAuthStateChanged = onAuthStateChanged as jest.Mock;
  const mockUnsubscribe = jest.fn();
  const mockUnsubscribeAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
    // Default: simulate an authenticated user immediately.
    mockOnAuthStateChanged.mockImplementation((_auth, callback: Function) => {
      callback({ uid: 'test-user' });
      return mockUnsubscribeAuth;
    });
  });

  test('starts with loading=true and event=null when no auth yet', () => {
    mockOnAuthStateChanged.mockImplementation(() => mockUnsubscribeAuth);

    const { result } = renderHook(() => useEvent());
    expect(result.current.loading).toBe(true);
    expect(result.current.event).toBeNull();
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  test('does not subscribe until user is authenticated', () => {
    mockOnAuthStateChanged.mockImplementation((_auth, callback: Function) => {
      callback(null);
      return mockUnsubscribeAuth;
    });

    renderHook(() => useEvent());
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  test('sets event data when snapshot exists', () => {
    mockOnSnapshot.mockImplementation((_, callback: Function) => {
      callback({
        exists: () => true,
        data: () => ({
          name: 'Test Event 2026',
          date: 'March 29, 2026',
          tagline: 'A test event for demos',
          currentProgramId: null,
          announcementText: '',
          announcementActive: false,
          bigScreenMode: 'reactions',
        }),
      });
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useEvent());
    expect(result.current.loading).toBe(false);
    expect(result.current.event).toEqual({
      name: 'Test Event 2026',
      date: 'March 29, 2026',
      tagline: 'A test event for demos',
      currentProgramId: null,
      announcementText: '',
      announcementActive: false,
      bigScreenMode: 'reactions',
    });
  });

  test('sets event=null when snapshot does not exist', () => {
    mockOnSnapshot.mockImplementation((_, callback: Function) => {
      callback({ exists: () => false });
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useEvent());
    expect(result.current.event).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test('handles snapshot errors gracefully', () => {
    mockOnSnapshot.mockImplementation((_, _success: Function, onError: Function) => {
      onError(new Error('Firestore error'));
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useEvent());
    expect(result.current.loading).toBe(false);
  });

  test('unsubscribes from snapshot and auth on unmount', () => {
    const { unmount } = renderHook(() => useEvent());
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(mockUnsubscribeAuth).toHaveBeenCalled();
  });
});
