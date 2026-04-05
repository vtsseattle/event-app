/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

// ---------------------------------------------------------------------------
// Mock firebase/auth  –  anonymous auth backed by localStorage UID
// ---------------------------------------------------------------------------

const UID_KEY = '__mock_firebase_uid';

// ---------------------------------------------------------------------------
// MockUser
// ---------------------------------------------------------------------------
class MockUser {
  uid: string;
  isAnonymous = true;
  email: string | null = null;
  displayName: string | null = null;
  photoURL: string | null = null;
  emailVerified = false;
  phoneNumber: string | null = null;
  providerId = 'firebase';
  metadata = {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  };

  constructor(uid?: string) {
    this.uid = uid || 'mock-' + Math.random().toString(36).slice(2, 12);
  }

  getIdToken(): Promise<string> {
    return Promise.resolve('mock-token-' + this.uid);
  }

  toJSON() {
    return { uid: this.uid, isAnonymous: this.isAnonymous };
  }
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
type AuthStateListener = (user: MockUser | null) => void;
const listeners: AuthStateListener[] = [];
let currentUser: MockUser | null = null;

function getStoredUid(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(UID_KEY);
}

function storeUid(uid: string) {
  if (typeof window !== 'undefined') localStorage.setItem(UID_KEY, uid);
}

// Restore persisted user on module load (client only)
if (typeof window !== 'undefined') {
  const stored = getStoredUid();
  if (stored) currentUser = new MockUser(stored);
}

// ---------------------------------------------------------------------------
// Mock Auth object
// ---------------------------------------------------------------------------
const mockAuth = {
  get currentUser() {
    return currentUser;
  },
  signOut: async () => {
    currentUser = null;
    if (typeof window !== 'undefined') localStorage.removeItem(UID_KEY);
    for (const cb of listeners) cb(null);
  },
  languageCode: null as string | null,
  tenantId: null as string | null,
};

// ---------------------------------------------------------------------------
// Exports matching firebase/auth surface
// ---------------------------------------------------------------------------
export function getAuth(_app?: any): any {
  return mockAuth;
}

export async function signInAnonymously(_auth?: any): Promise<any> {
  if (!currentUser) {
    const stored = getStoredUid();
    currentUser = new MockUser(stored || undefined);
    storeUid(currentUser.uid);
  }
  for (const cb of listeners) cb(currentUser);
  return { user: currentUser, operationType: 'signIn' };
}

export function onAuthStateChanged(
  _auth: any,
  callback: AuthStateListener,
): () => void {
  listeners.push(callback);
  // Initial fire (async to match Firebase behaviour)
  setTimeout(() => callback(currentUser), 0);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export type User = MockUser;
export type Auth = typeof mockAuth;
export type UserCredential = { user: MockUser; operationType: string };
