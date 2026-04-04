// Mock firebase/auth before importing auth.ts
jest.mock('firebase/auth', () => ({
  signInAnonymously: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
}));

import { signInAnonymously as firebaseSignInAnonymously } from 'firebase/auth';
import { signInAnonymously, getCurrentUser } from '@/lib/auth';

const mockSignInAnonymously = firebaseSignInAnonymously as jest.Mock;

describe('auth.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInAnonymously', () => {
    test('calls firebase signInAnonymously and returns user', async () => {
      const mockUser = { uid: 'new-uid' };
      mockSignInAnonymously.mockResolvedValue({ user: mockUser });
      const user = await signInAnonymously();
      expect(user).toEqual(mockUser);
      expect(mockSignInAnonymously).toHaveBeenCalled();
    });

    test('throws when firebase signInAnonymously fails', async () => {
      mockSignInAnonymously.mockRejectedValue(new Error('Auth error'));
      await expect(signInAnonymously()).rejects.toThrow('Auth error');
    });
  });

  describe('getCurrentUser', () => {
    test('returns current user from auth', () => {
      const user = getCurrentUser();
      expect(user).toEqual({ uid: 'test-uid' });
    });
  });
});
