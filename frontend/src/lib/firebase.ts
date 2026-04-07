/**
 * Firebase Auth client for browser. Used for login: sign in with email/password, get idToken, send to backend.
 * Realtime Database used for user subdomains at /user/roles/client/{uid}/projects/{projectId}/subdomain.
 * Storage used for web builder uploads under {clientName}/{projectName}/images|videos|files/.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type Auth,
} from 'firebase/auth';
import { getDatabase, ref, onValue, type Database, type Unsubscribe } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, type FirebaseStorage } from 'firebase/storage';
import { getApiBase } from "./apiBase";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
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

/** Sign in with Google popup and return the Firebase idToken for the backend session exchange. */
export async function signInWithGoogleAndGetIdToken(): Promise<string> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_API_KEY to .env.local');

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const userCred = await signInWithPopup(auth, provider);
  const token = await userCred.user.getIdToken();
  if (!token) throw new Error('Could not get Google login token');
  return token;
}

export function isFirebaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '').trim();
}

export async function signOutFirebaseAuth(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

/** Realtime Database (requires NEXT_PUBLIC_FIREBASE_DATABASE_URL). Returns null if not configured. */
export function getFirebaseDatabase(): Database | null {
  const app = getApp();
  if (!app || !config.databaseURL) return null;
  return getDatabase(app);
}

/** Firebase Storage (uses storageBucket from config or default project bucket). Returns null if app not configured. */
export function getFirebaseStorage(): FirebaseStorage | null {
  const app = getApp();
  if (!app) return null;
  return getStorage(app, config.storageBucket || undefined);
}

/** True if Storage is configured (app + bucket). Bucket can be set via NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET or default. */
export function isFirebaseStorageConfigured(): boolean {
  const app = getApp();
  return !!app;
}

const API_URL = getApiBase(process.env.NEXT_PUBLIC_API_URL);

/**
 * If you're logged in to the backend (cookie) but not to Firebase Auth, signs in to Firebase using
 * a custom token from the API so Storage uploads work. Call when opening the web builder.
 */
export async function ensureFirebaseAuthForStorage(): Promise<boolean> {
  const auth = getFirebaseAuth();
  if (!auth) return false;
  if (auth.currentUser) return true;

  try {
    const base = API_URL.replace(/\/$/, '');
    const res = await fetch(`${base}/api/auth/firebase-custom-token`, { credentials: 'include' });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data.success || !data.customToken) return false;
    await signInWithCustomToken(auth, data.customToken);
    return true;
  } catch {
    return false;
  }
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
