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

const { db } = require('../config/firebase');

async function testFirestore() {
    const testId = 'manual_test_' + Date.now();
    const rootCollection = 'user'; // Reverting to singular as per screenshot

    console.log(`🚀 Testing Firestore write to root collection: ${rootCollection}`);

    try {
        // 1. Test root collection write
        console.log(`Step 1: Writing to ${rootCollection}/${testId}...`);
        const docRef = db.collection(rootCollection).doc(testId);
        await docRef.set({
            email: 'manual_test@example.com',
            full_name: 'Manual Test User',
            created_at: new Date(),
            is_test: true
        });
        console.log(`✅ Successfully wrote to root collection.`);

        // 2. Test nested roles collection write
        const nestedPath = `${rootCollection}/roles/client/${testId}`;
        console.log(`Step 2: Writing to ${nestedPath}...`);
        const roleRef = db.collection(rootCollection).doc('roles').collection('client').doc(testId);
        await roleRef.set({
            uid: testId,
            email: 'manual_test@example.com',
            role: 'client',
            created_at: new Date()
        });
        console.log(`✅ Successfully wrote to nested roles collection.`);

        // 3. Verify visibility
        console.log(`Step 3: Verifying document visibility...`);
        const docSnap = await docRef.get();
        const roleSnap = await roleRef.get();

        if (docSnap.exists && roleSnap.exists) {
            console.log('✅ BOTH documents are visible and correctly placed.');
        } else {
            console.error(`❌ Verification failed. Root: ${docSnap.exists}, Role: ${roleSnap.exists}`);
        }

        // Cleanup
        console.log('🧹 Cleaning up test documents...');
        await docRef.delete();
        await roleRef.delete();
        console.log('✅ Cleanup complete.');

    } catch (error) {
        console.error('❌ Firestore test failed:', error.stack);
    }
}

testFirestore();
