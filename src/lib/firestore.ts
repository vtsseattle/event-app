import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  DocumentReference,
  CollectionReference,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// --- Collection references (all require an eventId) ---

export function getEventsRef(): CollectionReference {
  return collection(db, "events");
}

export function getEventRef(eventId: string): DocumentReference {
  return doc(db, "events", eventId);
}

export function getProgramsRef(eventId: string): CollectionReference {
  return collection(db, "events", eventId, "programs");
}

export function getViewersRef(eventId: string): CollectionReference {
  return collection(db, "events", eventId, "viewers");
}

export function getReactionsRef(eventId: string): CollectionReference {
  return collection(db, "events", eventId, "reactions");
}

export function getShoutoutsRef(eventId: string): CollectionReference {
  return collection(db, "events", eventId, "shoutouts");
}

export function getTriviaRef(eventId: string): CollectionReference {
  return collection(db, "events", eventId, "trivia");
}

export function getTriviaAnswersRef(eventId: string): CollectionReference {
  return collection(db, "events", eventId, "triviaAnswers");
}

export function getPhotosRef(eventId: string): CollectionReference {
  return collection(db, "events", eventId, "photos");
}

export function getPledgesRef(eventId: string): CollectionReference {
  return collection(db, "events", eventId, "pledges");
}

export function getFeedbackRef(eventId: string): CollectionReference {
  return collection(db, "events", eventId, "feedback");
}

export function getRsvpsRef(eventId: string): CollectionReference {
  return collection(db, "events", eventId, "rsvps");
}

// --- Event creation ---

export async function createEvent(
  eventId: string,
  data: {
    name: string;
    date: string;
    tagline: string;
    eventStartTime: string;
    adminPasswordHash: string;
  }
): Promise<void> {
  const eventRef = getEventRef(eventId);
  await setDoc(eventRef, {
    ...data,
    currentProgramId: null,
    announcementText: "",
    announcementActive: false,
    bigScreenMode: "idle",
    createdAt: serverTimestamp(),
  });
}

// --- CRUD helpers ---

export async function addDocument(
  collectionRef: CollectionReference,
  data: DocumentData
): Promise<DocumentReference> {
  return addDoc(collectionRef, data);
}

export async function updateDocument(
  docRef: DocumentReference,
  data: Partial<DocumentData>
): Promise<void> {
  return updateDoc(docRef, data);
}

export async function deleteDocument(docRef: DocumentReference): Promise<void> {
  return deleteDoc(docRef);
}
