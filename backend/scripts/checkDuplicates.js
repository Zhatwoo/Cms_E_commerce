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

async function checkDuplicates() {
    console.log('🔍 Checking for duplicate UIDs across role sub-collections...');

    const roles = ['client', 'admin', 'support', 'super_admin'];
    const uidMap = new Map();

    for (const role of roles) {
        const snap = await db.collection('user').doc('roles').collection(role).get();
        snap.forEach(doc => {
            const uid = doc.id;
            if (!uidMap.has(uid)) {
                uidMap.set(uid, []);
            }
            uidMap.get(uid).push(role);
        });
    }

    let duplicatesFound = 0;
    for (const [uid, foundRoles] of uidMap.entries()) {
        if (foundRoles.length > 1) {
            console.log(`⚠️  Duplicate UID found: ${uid}`);
            console.log(`    Located in: ${foundRoles.join(', ')}`);
            duplicatesFound++;
        }
    }

    if (duplicatesFound === 0) {
        console.log('✅ No duplicate UIDs found.');
    } else {
        console.log(`\n❌ Total duplicate UIDs found: ${duplicatesFound}`);
    }
}

checkDuplicates().catch(err => console.error(err));
