import { getEventRef, getProgramsRef, getViewersRef, getReactionsRef, getShoutoutsRef, addDocument, updateDocument, deleteDocument } from '@/lib/firestore';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// Mock firebase modules
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'mock-collection-ref'),
  doc: jest.fn(() => 'mock-doc-ref'),
  addDoc: jest.fn(() => Promise.resolve('mock-doc-ref')),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/lib/firebase', () => ({
  db: 'mock-db',
}));

describe('firestore.ts', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('Collection references', () => {
    test('getEventRef returns doc ref for given eventId', () => {
      getEventRef('my-event');
      expect(doc).toHaveBeenCalledWith('mock-db', 'events', 'my-event');
    });

    test('getProgramsRef returns programs subcollection', () => {
      getProgramsRef('my-event');
      expect(collection).toHaveBeenCalledWith('mock-db', 'events', 'my-event', 'programs');
    });

    test('getViewersRef returns viewers subcollection', () => {
      getViewersRef('my-event');
      expect(collection).toHaveBeenCalledWith('mock-db', 'events', 'my-event', 'viewers');
    });

    test('getReactionsRef returns reactions subcollection', () => {
      getReactionsRef('my-event');
      expect(collection).toHaveBeenCalledWith('mock-db', 'events', 'my-event', 'reactions');
    });

    test('getShoutoutsRef returns shoutouts subcollection', () => {
      getShoutoutsRef('my-event');
      expect(collection).toHaveBeenCalledWith('mock-db', 'events', 'my-event', 'shoutouts');
    });
  });

  describe('CRUD helpers', () => {
    test('addDocument calls addDoc with correct args', async () => {
      const ref = 'test-ref' as any;
      const data = { name: 'test' };
      await addDocument(ref, data);
      expect(addDoc).toHaveBeenCalledWith(ref, data);
    });

    test('updateDocument calls updateDoc with correct args', async () => {
      const ref = 'test-ref' as any;
      const data = { name: 'updated' };
      await updateDocument(ref, data);
      expect(updateDoc).toHaveBeenCalledWith(ref, data);
    });

    test('deleteDocument calls deleteDoc', async () => {
      const ref = 'test-ref' as any;
      await deleteDocument(ref);
      expect(deleteDoc).toHaveBeenCalledWith(ref);
    });
  });
});
