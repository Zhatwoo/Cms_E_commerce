const { db } = require('./config/firebase');
require('dotenv').config();

async function migrateCollaborations() {
    console.log('--- Starting Migration: Root collaborations -> Nested collaborators ---');
    try {
        const rootCollabsSnap = await db.collection('collaborations').get();
        console.log(`Found ${rootCollabsSnap.size} project entries in root collaborations collection.`);

        for (const rootDoc of rootCollabsSnap.docs) {
            const projectId = rootDoc.id;
            const data = rootDoc.data();
            const ownerId = data.ownerId;
            const collaboratorsMap = data.collaborators || {}; // Assuming Image 3's structure

            if (!ownerId) {
                console.warn(`[Skip] Project ${projectId} has no ownerId in root document.`);
                continue;
            }

            console.log(`Processing project ${projectId} (Owner: ${ownerId})...`);

            for (const [collabKey, collabInfo] of Object.entries(collaboratorsMap)) {
                // Determine email-based doc ID for the nested collection
                const email = (collabInfo.email || '').toLowerCase();
                if (!email) {
                    console.warn(`  [Skip] Collaborator ${collabKey} has no email.`);
                    continue;
                }

                const nestedDocId = email.replace(/[^a-z0-9]/g, '_');
                const targetRef = db.collection('user').doc('roles')
                    .collection('client').doc(ownerId)
                    .collection('projects').doc(projectId)
                    .collection('collaborators').doc(nestedDocId);

                // Map old fields to new fields
                const newCollabData = {
                    email,
                    role: collabInfo.role || collabInfo.permission || 'viewer',
                    status: (collabInfo.status || 'pending').includes('can') ? 'accepted' : 'pending',
                    userId: collabInfo.userId || collabInfo.uid || null,
                    displayName: collabInfo.name || collabInfo.displayName || email.split('@')[0],
                    name: collabInfo.name || collabInfo.displayName || email.split('@')[0],
                    avatar: collabInfo.avatar || null,
                    color: collabInfo.color || '#6c8fff',
                    invitedAt: collabInfo.invitedAt || data.updatedAt || new Date().toISOString(),
                    invitedBy: collabInfo.invitedBy || ownerId,
                    invitedByName: collabInfo.invitedByName || 'Unknown',
                    ownerId,
                    projectId,
                    updatedAt: new Date().toISOString()
                };

                await targetRef.set(newCollabData, { merge: true });
                console.log(`  Moved ${email} -> ${targetRef.path}`);
            }

            // Optional: Mark root document as migrated or delete it
            // await rootDoc.ref.delete();
            // console.log(`Deleted root record for project ${projectId}`);
        }

        console.log('--- Migration Complete ---');
    } catch (err) {
        console.error('Migration failed:', err.message);
    }
}

migrateCollaborations();
