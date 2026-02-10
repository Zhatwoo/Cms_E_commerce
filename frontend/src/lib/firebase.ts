/**
 * Firebase Auth client for browser. Used for login: sign in with email/password, get idToken, send to backend.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, type Auth } from 'firebase/auth';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
};

function getApp(): FirebaseApp | null {
  if (getApps().length) return getApps()[0] as FirebaseApp;
  if (!config.apiKey) return null;
  return initializeApp(config);
}

export function getFirebaseAuth(): Auth | null {
  const app = getApp();
  return app ? getAuth(app) : null;
}

/** Sign in with email/password and return the Firebase idToken for the backend. */
export async function signInAndGetIdToken(email: string, password: string): Promise<string> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_API_KEY to .env.local');
  const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const token = await userCred.user.getIdToken();
  if (!token) throw new Error('Could not get login token');
  return token;
}

export function isFirebaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '').trim();
}
