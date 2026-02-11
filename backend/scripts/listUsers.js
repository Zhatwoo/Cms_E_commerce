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

async function listAllUsers() {
    console.log('👥 Listing all users in nested Firestore paths...');

    const roles = ['client', 'admin', 'support', 'super_admin', 'super admin'];
    let total = 0;

    for (const role of roles) {
        console.log(`\n--- Role: ${role} ---`);
        try {
            const snap = await db.collection('user').doc('roles').collection(role).get();
            if (snap.empty) {
                console.log('  (Empty)');
                continue;
            }
            snap.forEach(doc => {
                const data = doc.data();
                console.log(`  UID: ${doc.id}`);
                console.log(`  Email: ${data.email}`);
                console.log(`  Role (in doc): ${data.role}`);
                console.log(`  Path: user/roles/${role}/${doc.id}`);
                total++;
            });
        } catch (e) {
            console.log(`  Error reading collection: ${e.message}`);
        }
    }

    console.log(`\n✅ Total users found: ${total}`);
}

listAllUsers().catch(err => console.error(err));
