/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

// ---------------------------------------------------------------------------
// Mock firebase/storage – files stored as blob object URLs in memory
// ---------------------------------------------------------------------------

type StorageRef = { _path: string; fullPath: string; name: string };

const files = new Map<string, string>(); // path → blob URL
const urlToPath = new Map<string, string>(); // reverse: blob URL → path

const mockStorage = { __mock: true };

export type FirebaseStorage = typeof mockStorage;

export function getStorage(_app?: any): any {
  return mockStorage;
}

export function ref(storageOrRef: any, path?: string): StorageRef {
  // If `path` is a download URL we created earlier, map back to the original
  const resolved = path && urlToPath.has(path) ? urlToPath.get(path)! : path || '';
  return {
    _path: resolved,
    fullPath: resolved,
    name: resolved.split('/').pop() || '',
  };
}

export async function uploadBytes(
  storageRef: StorageRef,
  data: Blob | Uint8Array | ArrayBuffer,
  _metadata?: any,
): Promise<any> {
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart]);
  const url = URL.createObjectURL(blob);
  files.set(storageRef._path, url);
  urlToPath.set(url, storageRef._path);
  return { ref: storageRef, metadata: {} };
}

export async function getDownloadURL(storageRef: StorageRef): Promise<string> {
  const url = files.get(storageRef._path);
  if (!url) throw new Error(`No file at path: ${storageRef._path}`);
  return url;
}

export async function deleteObject(storageRef: StorageRef): Promise<void> {
  const url = files.get(storageRef._path);
  if (url) {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    urlToPath.delete(url);
  }
  files.delete(storageRef._path);
}
