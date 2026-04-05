/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { mockStore, MockTimestamp } from './store';

// ---------------------------------------------------------------------------
// Re-export Timestamp
// ---------------------------------------------------------------------------
export const Timestamp = MockTimestamp;

// ---------------------------------------------------------------------------
// Types (structural stand-ins)
// ---------------------------------------------------------------------------
export type Firestore = { __mock: true };
export type DocumentData = Record<string, any>;
export type DocumentReference = {
  _type: 'doc';
  _path: string;
  id: string;
  parent: CollectionReference;
};
export type CollectionReference = {
  _type: 'collection';
  _path: string;
  id: string;
};
export type Query = {
  _type: 'query';
  _collection: CollectionReference;
  _constraints: any[];
};
export type QueryConstraint = { _constraintType: string; [key: string]: any };

// ---------------------------------------------------------------------------
// DB singleton
// ---------------------------------------------------------------------------
const mockDb: Firestore = { __mock: true };

export function getFirestore(_app?: any): Firestore {
  return mockDb;
}

// ---------------------------------------------------------------------------
// References
// ---------------------------------------------------------------------------
export function collection(dbOrRef: any, ...segments: string[]): CollectionReference {
  let basePath = '';
  if (dbOrRef && dbOrRef._type === 'collection') {
    basePath = dbOrRef._path + '/';
  }
  const path = basePath + segments.join('/');
  return { _type: 'collection', _path: path, id: segments[segments.length - 1] };
}

export function doc(dbOrRef: any, ...segments: string[]): DocumentReference {
  if (dbOrRef && dbOrRef._type === 'collection') {
    // doc(collectionRef, docId)
    const path = dbOrRef._path + '/' + segments[0];
    return { _type: 'doc', _path: path, id: segments[0], parent: dbOrRef };
  }
  // doc(db, 'events', eventId, ...)
  const path = segments.join('/');
  const id = segments[segments.length - 1];
  const parentPath = segments.slice(0, -1).join('/');
  const parentId = segments.length >= 2 ? segments[segments.length - 2] : '';
  return {
    _type: 'doc',
    _path: path,
    id,
    parent: { _type: 'collection', _path: parentPath, id: parentId },
  };
}

// ---------------------------------------------------------------------------
// Snapshots
// ---------------------------------------------------------------------------
function makeDocSnapshot(ref: DocumentReference, data: DocData | undefined) {
  return {
    id: ref.id,
    ref,
    exists: () => data !== undefined,
    data: () => (data ? { ...data } : undefined),
    get: (field: string) => data?.[field],
  };
}

type DocData = Record<string, any>;

function evaluateQuery(collPath: string, constraints: any[]) {
  const allDocs = mockStore.getCollection(collPath);
  let entries = Array.from(allDocs.entries()).map(([id, data]) => ({ id, data }));

  // where filters
  for (const c of constraints) {
    if (c._constraintType === 'where') {
      entries = entries.filter(({ data }) => {
        const val = data[c.field];
        switch (c.op) {
          case '==':
            return val === c.value;
          case '!=':
            return val !== c.value;
          case '<':
            return val < c.value;
          case '<=':
            return val <= c.value;
          case '>':
            return val > c.value;
          case '>=':
            return val >= c.value;
          case 'in':
            return (c.value as any[]).includes(val);
          case 'not-in':
            return !(c.value as any[]).includes(val);
          case 'array-contains':
            return Array.isArray(val) && val.includes(c.value);
          default:
            return true;
        }
      });
    }
  }

  // orderBy
  const orderBys = constraints.filter((c: any) => c._constraintType === 'orderBy');
  if (orderBys.length > 0) {
    entries.sort((a, b) => {
      for (const ob of orderBys) {
        const aVal = a.data[ob.field];
        const bVal = b.data[ob.field];
        let cmp = 0;
        if (aVal == null && bVal == null) cmp = 0;
        else if (aVal == null) cmp = 1;
        else if (bVal == null) cmp = -1;
        else if (aVal instanceof MockTimestamp && bVal instanceof MockTimestamp) {
          cmp = aVal.seconds - bVal.seconds || aVal.nanoseconds - bVal.nanoseconds;
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          cmp = aVal - bVal;
        } else {
          cmp = String(aVal) < String(bVal) ? -1 : String(aVal) > String(bVal) ? 1 : 0;
        }
        if (ob.direction === 'desc') cmp = -cmp;
        if (cmp !== 0) return cmp;
      }
      return 0;
    });
  }

  return entries;
}

function makeQuerySnapshot(collPath: string, constraints: any[]) {
  const entries = evaluateQuery(collPath, constraints);
  const docs = entries.map(({ id, data }) => {
    const docRef: DocumentReference = {
      _type: 'doc',
      _path: collPath + '/' + id,
      id,
      parent: { _type: 'collection', _path: collPath, id: collPath.split('/').pop()! },
    };
    return makeDocSnapshot(docRef, data);
  });
  return { docs, size: docs.length, empty: docs.length === 0 };
}

// ---------------------------------------------------------------------------
// onSnapshot (real-time listeners)
// ---------------------------------------------------------------------------
export function onSnapshot(ref: any, onNext: any, onError?: any): () => void {
  if (ref._type === 'doc') {
    const fire = () => {
      try {
        const data = mockStore.getDoc(ref._path);
        onNext(makeDocSnapshot(ref, data));
      } catch (e) {
        onError?.(e);
      }
    };
    fire();
    return mockStore.subscribe(ref._path, fire);
  }

  // Collection or Query
  const collPath = ref._type === 'query' ? ref._collection._path : ref._path;
  const constraints = ref._type === 'query' ? ref._constraints : [];

  const fire = () => {
    try {
      onNext(makeQuerySnapshot(collPath, constraints));
    } catch (e) {
      onError?.(e);
    }
  };
  fire();
  return mockStore.subscribe(collPath, fire);
}

// ---------------------------------------------------------------------------
// Query builders
// ---------------------------------------------------------------------------
export function query(collectionRef: CollectionReference, ...constraints: any[]): Query {
  return { _type: 'query', _collection: collectionRef, _constraints: constraints };
}

export function where(field: string, op: string, value: any): QueryConstraint {
  return { _constraintType: 'where', field, op, value };
}

export function orderBy(field: string, direction: string = 'asc'): QueryConstraint {
  return { _constraintType: 'orderBy', field, direction };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------
export async function setDoc(
  ref: DocumentReference,
  data: any,
  options?: { merge?: boolean },
): Promise<void> {
  mockStore.setDoc(ref._path, data, options);
}

export async function addDoc(
  ref: CollectionReference,
  data: any,
): Promise<DocumentReference> {
  const id = mockStore.addDoc(ref._path, data);
  return { _type: 'doc', _path: ref._path + '/' + id, id, parent: ref };
}

export async function updateDoc(ref: DocumentReference, data: any): Promise<void> {
  mockStore.updateDoc(ref._path, data);
}

export async function deleteDoc(ref: DocumentReference): Promise<void> {
  mockStore.deleteDoc(ref._path);
}

export async function getDoc(ref: DocumentReference): Promise<any> {
  const data = mockStore.getDoc(ref._path);
  return makeDocSnapshot(ref, data);
}

export async function getDocs(queryRef: any): Promise<any> {
  const collPath = queryRef._type === 'query' ? queryRef._collection._path : queryRef._path;
  const constraints = queryRef._type === 'query' ? queryRef._constraints : [];
  return makeQuerySnapshot(collPath, constraints);
}

// ---------------------------------------------------------------------------
// Field values
// ---------------------------------------------------------------------------
export function serverTimestamp(): any {
  return { __special: 'serverTimestamp' };
}

export function arrayUnion(...values: any[]): any {
  return { __special: 'arrayUnion', values };
}

export function arrayRemove(...values: any[]): any {
  return { __special: 'arrayRemove', values };
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------
export async function runTransaction(
  _db: any,
  fn: (transaction: any) => Promise<void>,
): Promise<void> {
  const transaction = {
    get: async (ref: DocumentReference) => {
      const data = mockStore.getDoc(ref._path);
      return makeDocSnapshot(ref, data);
    },
    update: (ref: DocumentReference, data: any) => {
      mockStore.updateDoc(ref._path, data);
    },
    set: (ref: DocumentReference, data: any, options?: { merge?: boolean }) => {
      mockStore.setDoc(ref._path, data, options);
    },
    delete: (ref: DocumentReference) => {
      mockStore.deleteDoc(ref._path);
    },
  };
  await fn(transaction);
}
