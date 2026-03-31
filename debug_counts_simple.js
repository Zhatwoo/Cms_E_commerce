// No dotenv needed if env is provided via shell
const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (typeof privateKey === 'string' && privateKey.includes('\\n')) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const db = admin.firestore();

async function debugFirestore() {
  console.log('--- Firestore Debug Start ---');
  
  // 1. Check published_subdomains
  const pubSnap = await db.collection('published_subdomains').get();
  console.log(`published_subdomains count: ${pubSnap.size}`);
  
  // 2. Check total projects via collectionGroup
  try {
    const projSnap = await db.collectionGroup('projects').get();
    console.log(`collectionGroup('projects') count: ${projSnap.size}`);
  } catch (e) {
    console.log(`collectionGroup('projects') FAILED: ${e.message}`);
  }
  
  // 3. Check users
  const roles = ['client', 'admin', 'support', 'super_admin'];
  for (const role of roles) {
    const coll = role === 'super_admin' ? 'admin' : role;
    const snap = await db.collection('user').doc('roles').collection(coll).get();
    console.log(`Role [${role}] path [user/roles/${coll}] count: ${snap.size}`);
  }
  console.log('--- Firestore Debug End ---');
}

debugFirestore().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
