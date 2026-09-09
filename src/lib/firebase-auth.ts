import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';

import { auth } from '@/lib/firebase';
import { MemoryScalar } from '@/lib/scalar-store';

/** The signed-in Firebase user, or null when signed out. */
export const authUserStore = new MemoryScalar<User | null>(null);
/** Flips true once the first `onAuthStateChanged` callback has fired. */
export const authReadyStore = new MemoryScalar<boolean>(false);

onAuthStateChanged(auth, (user) => {
  authUserStore.set(user);
  authReadyStore.set(true);
});

export function currentUid(): string | null {
  return authUserStore.getSnapshot()?.uid ?? null;
}

const ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'An account with that email already exists.',
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/weak-password': 'Please use a password with at least 6 characters.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/operation-not-allowed':
    'Email/password sign-in is not enabled for this project yet. Enable it in the Firebase console.',
};

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | undefined)?.code;
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  return 'Something went wrong. Please try again.';
}

export async function signUpWithEmail(email: string, password: string, name: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  if (name.trim()) {
    try {
      await updateProfile(credential.user, { displayName: name.trim() });
    } catch {
      // Non-fatal: the app keeps its own display-name store as the source of truth.
    }
  }
  return credential.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  return credential.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function sendResetEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
}
