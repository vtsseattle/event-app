import { signInAnonymously as firebaseSignInAnonymously, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function signInAnonymously(): Promise<User> {
  const credential = await firebaseSignInAnonymously(auth);
  return credential.user;
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}
