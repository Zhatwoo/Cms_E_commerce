// config/firebase.js
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK from env vars (no JSON file required)
const initializeFirebase = () => {
  try {
    if (admin.apps.length === 0) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      let privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').trim();
      if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY in .env');
      }
      // Ensure PEM newlines: literal \n in .env must become real newlines for jwt/signing
      privateKey = privateKey.replace(/\\n/g, '\n');
      if (!privateKey.includes('-----END PRIVATE KEY-----')) {
        throw new Error('FIREBASE_PRIVATE_KEY looks truncated or invalid (missing -----END PRIVATE KEY-----). Keep the key on one line in .env with \\n for newlines.');
      }
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        }),
        projectId
      });
      console.log('✅ Firebase Admin SDK initialized');
      console.log('📍 Project ID:', projectId);
    }
    return admin;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    process.exit(1);
  }
};

// Get Firestore database instance
const getFirestore = () => {
  return admin.firestore();
};

// Get Realtime Database instance
const getDatabase = () => {
  return admin.database();
};

// Get Auth instance
const getAuth = () => {
  return admin.auth();
};

module.exports = {
  initializeFirebase,
  getFirestore,
  getDatabase,
  getAuth,
  admin
};