// config/firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('../cms-e-commerce-75653-firebase-adminsdk-fbsvc-5b7bf050e8.json');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if already initialized
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'cms-e-commerce-75653'
      });
      
      console.log('✅ Firebase Admin SDK initialized');
      console.log('📍 Project ID:', serviceAccount.project_id);
      console.log('📧 Client Email:', serviceAccount.client_email);
    }
    
    return admin;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.error('📋 Full error:', error);
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