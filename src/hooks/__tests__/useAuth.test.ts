import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

const mockUnsubscribe = jest.fn();
const mockSignInAnonymously = jest.fn();
const mockSetDoc = jest.fn();
const mockSignOut = jest.fn();

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signInAnonymously: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => 'mock-viewer-doc'),
  setDoc: jest.fn((...args: unknown[]) => {
    mockSetDoc(...args);
    return Promise.resolve();
  }),
  serverTimestamp: jest.fn(() => 'server-ts'),
  collection: jest.fn(() => 'mock-collection'),
}));

jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-uid-123' },
    signOut: () => {
      mockSignOut();
      return Promise.resolve();
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  signInAnonymously: () => mockSignInAnonymously(),
}));

jest.mock('@/lib/firestore', () => ({
  getViewersRef: jest.fn(() => 'mock-viewers-ref'),
}));

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (onAuthStateChanged as jest.Mock).mockImplementation(() => mockUnsubscribe);
  });

  test('starts with loading=true and user=null', () => {
    const { result } = renderHook(() => useAuth('test-event'));
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  test('updates user when auth state changes', () => {
    const mockUser = { uid: 'abc-123', email: null };
    (onAuthStateChanged as jest.Mock).mockImplementation((_, callback: Function) => {
      callback(mockUser);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useAuth('test-event'));
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  test('sets user to null on sign out', () => {
    (onAuthStateChanged as jest.Mock).mockImplementation((_, callback: Function) => {
      callback(null);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useAuth('test-event'));
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test('signIn creates viewer document with correct data', async () => {
    mockSignInAnonymously.mockResolvedValue({ uid: 'new-uid' });
    (onAuthStateChanged as jest.Mock).mockImplementation(() => mockUnsubscribe);

    const { result } = renderHook(() => useAuth('test-event'));

    await act(async () => {
      await result.current.signIn('John Doe');
    });

    expect(mockSignInAnonymously).toHaveBeenCalled();
    expect(mockSetDoc).toHaveBeenCalledWith(
      'mock-viewer-doc',
      expect.objectContaining({
        displayName: 'John Doe',
        initials: 'JD',
        isOnline: true,
      }),
      { merge: true }
    );
  });

  test('derives initials correctly', async () => {
    mockSignInAnonymously.mockResolvedValue({ uid: 'uid-1' });
    (onAuthStateChanged as jest.Mock).mockImplementation(() => mockUnsubscribe);

    const { result } = renderHook(() => useAuth('test-event'));

    // Two-word name
    await act(async () => {
      await result.current.signIn('John Doe');
    });
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ initials: 'JD' }),
      expect.anything()
    );

    jest.clearAllMocks();
    mockSignInAnonymously.mockResolvedValue({ uid: 'uid-2' });

    // Single name
    await act(async () => {
      await result.current.signIn('Alice');
    });
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ initials: 'A' }),
      expect.anything()
    );
  });

  test('signOut sets viewer offline and signs out', async () => {
    (onAuthStateChanged as jest.Mock).mockImplementation(() => mockUnsubscribe);

    const { result } = renderHook(() => useAuth('test-event'));

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      { isOnline: false },
      { merge: true }
    );
    expect(mockSignOut).toHaveBeenCalled();
  });

  test('unsubscribes from auth on unmount', () => {
    const { unmount } = renderHook(() => useAuth('test-event'));
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
