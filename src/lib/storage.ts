import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export async function uploadProgramImage(
  eventId: string,
  programId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const storageRef = ref(storage, `events/${eventId}/programs/${programId}/hero.${ext}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

export async function deleteProgramImage(
  programId: string,
  imageUrl: string,
): Promise<void> {
  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch {
    // Image may already be deleted — safe to ignore
  }
}

export async function uploadPhoto(
  eventId: string,
  viewerId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const storageRef = ref(storage, `events/${eventId}/photos/${viewerId}/${timestamp}.${ext}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

export async function uploadFlyer(
  eventId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const storageRef = ref(storage, `events/${eventId}/flyer.${ext}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}
