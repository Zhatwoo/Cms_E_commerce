/**
 * CLEANUP SCRIPT: Delete projects in trash for more than 30 days.
 * Run this periodically via cron or scheduled task.
 * Usage: node backend/scripts/cleanupTrashProjects.js
 */

const { db, admin } = require('../config/firebase');
const { deleteProjectStorageFolder } = require('../utils/storageHelpers');

async function cleanupTrash() {
  console.log('--- Starting Trash Cleanup ---');

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

  try {
    // 1. Find projects marked as deleted more than 30 days ago
    // Since we don't have composite index for is_deleted + deleted_at, 
    // we fetch all trashed items and filter in-memory (usually small number).
    const projectsRef = db.collectionGroup('projects');
    const snap = await projectsRef.where('is_deleted', '==', true).get();

    if (snap.empty) {
      console.log('No trashed projects found.');
      return;
    }

    let deletedCount = 0;

    for (const doc of snap.docs) {
      const p = doc.data();
      const deletedAt = p.deleted_at ? p.deleted_at.toDate() : null;

      if (deletedAt && deletedAt < thirtyDaysAgo) {
        console.log(`[CLEANUP] Deleting expired project: ${p.title} (${doc.id})`);

        // A. Delete Firestore doc
        await doc.ref.delete();

        // B. Delete Storage folder (best effort)
        try {
          const userId = doc.ref.parent.parent.id; // projects is a subcollection of users/{id}
          // We need a way to get client name. For cleanup script, we might just use 'client' 
          // or try to fetch user doc. Let's try to fetch user doc for name.
          const userDoc = await db.collection('users').doc(userId).get();
          const userData = userDoc.exists ? userDoc.data() : {};
          const clientName = (userData.displayName || userData.username || userData.email || 'client').trim();

          await deleteProjectStorageFolder(clientName, p.title);
          console.log(`[CLEANUP] Storage deleted for: ${p.title}`);
        } catch (storageErr) {
          console.warn(`[CLEANUP] Failed to delete storage for ${p.title}:`, storageErr.message);
        }

        deletedCount++;
      }
    }

    console.log(`--- Cleanup Complete. Deleted ${deletedCount} projects. ---`);
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  cleanupTrash().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = cleanupTrash;
