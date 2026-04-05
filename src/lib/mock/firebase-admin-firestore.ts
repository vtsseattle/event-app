/* eslint-disable @typescript-eslint/no-explicit-any */

import { mockStore } from './store';

// Mock firebase-admin/firestore — used only by the admin verify API route
export function getFirestore(): any {
  return {
    collection(collPath: string) {
      return {
        doc(docId: string) {
          return {
            async get() {
              const data = mockStore.getDoc(`${collPath}/${docId}`);
              return {
                exists: data !== undefined,
                data: () => (data ? { ...data } : undefined),
                id: docId,
              };
            },
          };
        },
      };
    },
  };
}
