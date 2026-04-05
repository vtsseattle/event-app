/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

// Mock firebase-admin/app — server-side no-ops

export function initializeApp(_config?: any): any {
  return {};
}

export function getApps(): any[] {
  return [{}];
}

export function cert(_config?: any): any {
  return {};
}
