/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// MockTimestamp – structural drop-in for firebase/firestore Timestamp
// ---------------------------------------------------------------------------
export class MockTimestamp {
  constructor(public seconds: number, public nanoseconds: number) {}

  toDate(): Date {
    return new Date(this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6));
  }

  toMillis(): number {
    return this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6);
  }

  static now(): MockTimestamp {
    const ms = Date.now();
    return new MockTimestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6);
  }

  static fromDate(date: Date): MockTimestamp {
    const ms = date.getTime();
    return new MockTimestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6);
  }
}

// ---------------------------------------------------------------------------
// Serialisation helpers (sessionStorage persistence)
// ---------------------------------------------------------------------------
type DocData = Record<string, any>;

const STORAGE_KEY = '__mock_firebase_store';

function serialize(data: DocData): any {
  const result: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof MockTimestamp) {
      result[key] = { __ts: true, s: value.seconds, n: value.nanoseconds };
    } else if (Array.isArray(value)) {
      result[key] = value.map((v) =>
        v instanceof MockTimestamp ? { __ts: true, s: v.seconds, n: v.nanoseconds } : v,
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

function deserialize(data: any): DocData {
  const result: DocData = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value && typeof value === 'object' && (value as any).__ts) {
      result[key] = new MockTimestamp((value as any).s, (value as any).n);
    } else if (Array.isArray(value)) {
      result[key] = value.map((v: any) =>
        v && typeof v === 'object' && v.__ts ? new MockTimestamp(v.s, v.n) : v,
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function splitDocPath(path: string) {
  const i = path.lastIndexOf('/');
  return { collPath: path.substring(0, i), docId: path.substring(i + 1) };
}

function genId(): string {
  return Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

function isSpecial(value: any, type: string): boolean {
  return value && typeof value === 'object' && value.__special === type;
}

function processSpecialValues(data: DocData, existing?: DocData): DocData {
  const result: DocData = {};
  for (const [key, value] of Object.entries(data)) {
    if (isSpecial(value, 'serverTimestamp')) {
      result[key] = MockTimestamp.now();
    } else if (isSpecial(value, 'arrayUnion')) {
      const arr: any[] = existing?.[key] ?? [];
      result[key] = [...arr, ...(value.values as any[]).filter((v: any) => !arr.includes(v))];
    } else if (isSpecial(value, 'arrayRemove')) {
      const arr: any[] = existing?.[key] ?? [];
      result[key] = arr.filter((item: any) => !(value.values as any[]).includes(item));
    } else {
      result[key] = value;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// MockStore – reactive in-memory Firestore with sessionStorage persistence
// ---------------------------------------------------------------------------
type Listener = () => void;

class MockStore {
  private collections = new Map<string, Map<string, DocData>>();
  private listeners = new Map<string, Set<Listener>>();

  constructor() {
    this.load();
  }

  // --- persistence ---

  private load() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, Record<string, any>>;
      for (const [collPath, docs] of Object.entries(parsed)) {
        const map = new Map<string, DocData>();
        for (const [docId, data] of Object.entries(docs)) {
          map.set(docId, deserialize(data));
        }
        this.collections.set(collPath, map);
      }
    } catch {
      /* ignore */
    }
  }

  private save() {
    if (typeof window === 'undefined') return;
    try {
      const obj: Record<string, Record<string, any>> = {};
      for (const [collPath, docs] of this.collections) {
        const collObj: Record<string, any> = {};
        for (const [docId, data] of docs) {
          collObj[docId] = serialize(data);
        }
        obj[collPath] = collObj;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch {
      /* storage full – ignore */
    }
  }

  // Cross-tab sync: reload data when another tab writes to localStorage
  listenForCrossTabChanges() {
    if (typeof window === 'undefined') return;
    window.addEventListener('storage', (e) => {
      if (e.key !== STORAGE_KEY) return;
      this.collections.clear();
      this.load();
      // Fire all listeners so UI updates
      for (const [, set] of this.listeners) {
        for (const cb of set) setTimeout(cb, 0);
      }
    });
  }

  // --- notifications ---

  private notify(...paths: string[]) {
    for (const p of paths) {
      const set = this.listeners.get(p);
      if (set) for (const cb of set) setTimeout(cb, 0);
    }
  }

  // --- reads ---

  getCollection(path: string): Map<string, DocData> {
    if (!this.collections.has(path)) this.collections.set(path, new Map());
    return this.collections.get(path)!;
  }

  getDoc(docPath: string): DocData | undefined {
    const { collPath, docId } = splitDocPath(docPath);
    return this.getCollection(collPath).get(docId);
  }

  // --- writes ---

  setDoc(docPath: string, data: DocData, options?: { merge?: boolean }) {
    const { collPath, docId } = splitDocPath(docPath);
    const coll = this.getCollection(collPath);
    const existing = coll.get(docId);
    const base = options?.merge ? { ...(existing || {}), ...data } : { ...data };
    coll.set(docId, processSpecialValues(base, existing));
    this.save();
    this.notify(docPath, collPath);
  }

  addDoc(collPath: string, data: DocData): string {
    const id = genId();
    this.getCollection(collPath).set(id, processSpecialValues({ ...data }));
    this.save();
    this.notify(collPath);
    return id;
  }

  updateDoc(docPath: string, data: DocData) {
    const { collPath, docId } = splitDocPath(docPath);
    const coll = this.getCollection(collPath);
    const existing = coll.get(docId);
    if (!existing) throw new Error(`Document not found: ${docPath}`);

    const merged = { ...existing };
    for (const [key, value] of Object.entries(data)) {
      if (isSpecial(value, 'arrayUnion')) {
        const arr: any[] = merged[key] ?? [];
        merged[key] = [...arr, ...(value.values as any[]).filter((v: any) => !arr.includes(v))];
      } else if (isSpecial(value, 'arrayRemove')) {
        const arr: any[] = merged[key] ?? [];
        merged[key] = arr.filter((item: any) => !(value.values as any[]).includes(item));
      } else if (isSpecial(value, 'serverTimestamp')) {
        merged[key] = MockTimestamp.now();
      } else {
        merged[key] = value;
      }
    }

    coll.set(docId, merged);
    this.save();
    this.notify(docPath, collPath);
  }

  deleteDoc(docPath: string) {
    const { collPath, docId } = splitDocPath(docPath);
    this.getCollection(collPath).delete(docId);
    this.save();
    this.notify(docPath, collPath);
  }

  // --- subscriptions ---

  subscribe(path: string, callback: Listener): () => void {
    if (!this.listeners.has(path)) this.listeners.set(path, new Set());
    this.listeners.get(path)!.add(callback);
    return () => {
      this.listeners.get(path)?.delete(callback);
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton (survives HMR since we attach to globalThis)
// ---------------------------------------------------------------------------
const GLOBAL_KEY = '__mockFirebaseStore';

export const mockStore: MockStore = (() => {
  const g = globalThis as any;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = new MockStore();
    g[GLOBAL_KEY].listenForCrossTabChanges();
  }
  return g[GLOBAL_KEY];
})();
