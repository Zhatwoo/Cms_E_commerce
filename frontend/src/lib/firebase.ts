/**
 * Firebase client – config kinukuha sa backend .env via GET /api/config/firebase
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const API_URL = (typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL : null) || 'http://localhost:5000';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let initPromise: Promise<Auth> | null = null;

/** Build config from frontend env (fallback when backend unreachable) */
function getFirebaseConfigFromEnv() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
  if (!apiKey) return null;
  return {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
  };
}

/** Kumuha ng Firebase Auth; config mula sa backend, o fallback sa frontend .env.local */
export async function getAuthAsync(): Promise<Auth> {
  if (auth) return auth;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    let config: Record<string, string> | null = null;
    try {
      const base = API_URL.replace(/\/$/, '');
      const res = await fetch(`${base}/api/config/firebase`);
      const data = await res.json();
      if (data?.apiKey) config = data;
    } catch {
      // Backend unreachable (not running or CORS/network)
    }
    if (!config?.apiKey) config = getFirebaseConfigFromEnv();
    if (!config?.apiKey) throw new Error('Firebase config not available. Start the backend or add NEXT_PUBLIC_FIREBASE_* to frontend .env.local');
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    return auth;
  })();
  return initPromise;
}

/** Sync getter – may value lang kung na-call na getAuthAsync() (e.g. after login init) */
export function getAuthSync(): Auth | null {
  return auth;
}

export { app };
