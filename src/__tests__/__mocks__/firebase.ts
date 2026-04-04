// Shared Firebase mock for all tests
import { Timestamp } from 'firebase/firestore';

// --- Firestore mocks ---
export const mockOnSnapshot = jest.fn();
export const mockAddDoc = jest.fn();
export const mockUpdateDoc = jest.fn();
export const mockDeleteDoc = jest.fn();
export const mockSetDoc = jest.fn();
export const mockRunTransaction = jest.fn();
export const mockGetDoc = jest.fn();

const mockCollection = jest.fn(() => 'mock-collection-ref');
const mockDoc = jest.fn(() => 'mock-doc-ref');
const mockQuery = jest.fn((...args: unknown[]) => args);
const mockWhere = jest.fn((...args: unknown[]) => ({ type: 'where', args }));
const mockOrderBy = jest.fn((...args: unknown[]) => ({ type: 'orderBy', args }));
const mockServerTimestamp = jest.fn(() => Timestamp.now());
const mockArrayUnion = jest.fn((...args: unknown[]) => ({ type: 'arrayUnion', args }));
const mockArrayRemove = jest.fn((...args: unknown[]) => ({ type: 'arrayRemove', args }));

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  runTransaction: (...args: unknown[]) => mockRunTransaction(...args),
  serverTimestamp: () => mockServerTimestamp(),
  arrayUnion: (...args: unknown[]) => mockArrayUnion(...args),
  arrayRemove: (...args: unknown[]) => mockArrayRemove(...args),
  Timestamp: {
    now: () => ({ seconds: Date.now() / 1000, nanoseconds: 0 }),
    fromDate: (d: Date) => ({ seconds: d.getTime() / 1000, nanoseconds: 0 }),
  },
  getFirestore: jest.fn(() => 'mock-db'),
}));

// --- Auth mocks ---
export const mockSignInAnonymously = jest.fn();
export const mockOnAuthStateChanged = jest.fn();
export const mockSignOut = jest.fn();

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: 'test-uid-123' },
    signOut: mockSignOut,
  })),
  signInAnonymously: mockSignInAnonymously,
  onAuthStateChanged: mockOnAuthStateChanged,
}));

// --- Firebase App mocks ---
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => 'mock-app'),
  getApps: jest.fn(() => ['mock-app']),
  getApp: jest.fn(() => 'mock-app'),
}));

// --- Module-level mocks for @/lib/firebase ---
jest.mock('@/lib/firebase', () => ({
  db: 'mock-db',
  auth: {
    currentUser: { uid: 'test-uid-123' },
    signOut: jest.fn(),
  },
  default: 'mock-app',
}));

// Reset all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

export {
  mockCollection,
  mockDoc,
  mockQuery,
  mockWhere,
  mockOrderBy,
  mockServerTimestamp,
  mockArrayUnion,
  mockArrayRemove,
};
