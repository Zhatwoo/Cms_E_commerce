/**
 * Firebase Auth client for browser. Used for login: sign in with email/password, get idToken, send to backend.
 * Realtime Database used for user subdomains at /user/roles/client/{uid}/projects/{projectId}/subdomain.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, type Auth } from 'firebase/auth';
import { getDatabase, ref, onValue, type Database, type Unsubscribe } from 'firebase/database';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? '',
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

/** Realtime Database (requires NEXT_PUBLIC_FIREBASE_DATABASE_URL). Returns null if not configured. */
export function getFirebaseDatabase(): Database | null {
  const app = getApp();
  if (!app || !config.databaseURL) return null;
  return getDatabase(app);
}

export type ProjectSubdomainEntry = { subdomain?: string | null };

/**
 * Subscribe to user's project subdomains at Firebase path:
 * /user/roles/client/{uid}/projects/{projectId}/subdomain
 * Returns unsubscribe function. Callback receives a map of projectId -> { subdomain }.
 */
export function subscribeUserProjectSubdomains(
  uid: string,
  callback: (projects: Record<string, ProjectSubdomainEntry>) => void
): Unsubscribe | null {
  const db = getFirebaseDatabase();
  if (!db) return null;
  const path = `user/roles/client/${uid}/projects`;
  const dbRef = ref(db, path);
  const unsub = onValue(dbRef, (snapshot) => {
    const val = snapshot.val();
    callback(val && typeof val === 'object' ? val : {});
  });
  return unsub;
}
