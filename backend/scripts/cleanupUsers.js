const path = require('path');
const fs = require('fs');

// Load .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim().replace(/^"(.*)"$/, '$1').replace(/\\n/g, '\n');
        }
    });
}

const { auth, db } = require('../config/firebase');

async function cleanupOrphanedUsers() {
    console.log('🔍 Starting Cleanup: Finding Firestore users with no Auth account...');

    const roles = ['client', 'admin', 'support', 'super_admin'];
    let totalDeleted = 0;

    for (const role of roles) {
        console.log(`\nChecking role: ${role}...`);
        const snap = await db.collection('user').doc('roles').collection(role).get();

        for (const doc of snap.docs) {
            const uid = doc.id;
            try {
                await auth.getUser(uid);
                // User exists in auth, skip
            } catch (e) {
                if (e.code === 'auth/user-not-found') {
                    console.log(`🗑️ Deleting orphaned Firestore profile: ${role}/${uid}`);

                    // Use recursive deletion to be thorough
                    await deleteRecursive(doc.ref);
                    totalDeleted++;
                } else {
                    console.error(`❌ Error checking UID ${uid}:`, e.message);
                }
            }
        }
    }

    console.log(`\n✨ Cleanup finished. Total orphaned profiles deleted: ${totalDeleted}`);
}

async function deleteRecursive(docRef) {
    const collections = await docRef.listCollections();
    for (const collection of collections) {
        const documents = await collection.get();
        for (const doc of documents.docs) {
            await deleteRecursive(doc.ref);
        }
    }
    await docRef.delete();
}

cleanupOrphanedUsers().catch(err => console.error('CRITICAL CLEANUP ERROR:', err));
