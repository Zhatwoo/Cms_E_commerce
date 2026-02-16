// Firebase Admin SDK — Auth + Firestore + Realtime Database (optional)
const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
const databaseURL = process.env.FIREBASE_DATABASE_URL || '';

if (!projectId || !clientEmail || !privateKey) {
  throw new Error('Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY in .env');
}

if (typeof privateKey === 'string' && privateKey.includes('\\n')) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
  const appOptions = {
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  };
  if (databaseURL) appOptions.databaseURL = databaseURL;
  admin.initializeApp(appOptions);
}

const auth = admin.auth();
const db = admin.firestore();

function getRealtimeDb() {
  if (!databaseURL) return null;
  try {
    return admin.database();
  } catch {
    return null;
  }
}

module.exports = { admin, auth, db, getRealtimeDb };
