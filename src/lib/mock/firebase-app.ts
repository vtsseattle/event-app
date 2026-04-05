/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

// Mock firebase/app — no-op app initialisation
const app = { name: '[DEFAULT]', options: {}, automaticDataCollectionEnabled: false };

export function initializeApp(_config?: any, _name?: string): any {
  return app;
}

export function getApps(): any[] {
  return [app];
}

export function getApp(_name?: string): any {
  return app;
}

export type FirebaseApp = typeof app;
