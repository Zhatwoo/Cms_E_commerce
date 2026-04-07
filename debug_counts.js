require('dotenv').config({ path: './backend/.env' });
const { db } = require('./backend/config/firebase');

async function debugFirestore() {
  console.log('--- Firestore Debug ---');
  
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
}

debugFirestore().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
