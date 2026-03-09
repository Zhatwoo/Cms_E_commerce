/**
 * CLEANUP SCRIPT: Purge trash projects older than retention threshold.
 * Run this periodically via cron or scheduled task.
 * Usage: node backend/scripts/cleanupTrashProjects.js
 */

const { db } = require('../config/firebase');
const Project = require('../models/Project');
const User = require('../models/User');
const { deleteProjectStorageFolder } = require('../utils/storageHelpers');
const { getTrashRetentionDays, getTrashRetentionMs } = require('../utils/trashConfig');

async function cleanupTrash() {
  const retentionDays = getTrashRetentionDays();
  const retentionMs = getTrashRetentionMs();
  console.log(`--- Starting Trash Cleanup (threshold: ${retentionDays} day(s)) ---`);

  const nowMs = Date.now();

  try {
    // Find all docs under user/roles/client/{uid}/trash/{projectId}
    const snap = await db.collectionGroup('trash').get();

    if (snap.empty) {
      console.log('No trash projects found.');
      return;
    }

    let purgedCount = 0;

    for (const doc of snap.docs) {
      const trashData = doc.data() || {};
      const pathSegments = doc.ref.path.split('/');

      // Expected: user/roles/client/{userId}/trash/{projectId}
      if (pathSegments.length < 6) continue;
      const userId = pathSegments[3];
      const projectId = pathSegments[5];
      if (!userId || !projectId) continue;

      const deletedAtRaw = trashData.deleted_at;
      const deletedAtMs = deletedAtRaw?.toDate
        ? deletedAtRaw.toDate().getTime()
        : new Date(deletedAtRaw || 0).getTime();
      if (!deletedAtMs || Number.isNaN(deletedAtMs)) continue;

      const ageMs = nowMs - deletedAtMs;
      if (ageMs > retentionMs) {
        const title = String(trashData.title || 'Untitled');
        console.log(`[CLEANUP] Purging expired project: ${title} (${projectId}) for user ${userId}`);

        // Purge project/trash/domain/rtdb by canonical model function.
        await Project.permanentDelete(userId, projectId);

        // Storage cleanup (best effort)
        try {
          const user = await User.get(userId);
          const clientName = (user?.displayName || user?.username || user?.email || 'client').trim() || 'client';
          await deleteProjectStorageFolder(clientName, title);
        } catch (storageErr) {
          console.warn(`[CLEANUP] Storage delete failed for ${projectId}:`, storageErr.message);
        }

        purgedCount++;
      }
    }

    console.log(`--- Cleanup Complete. Purged ${purgedCount} expired trash project(s). ---`);
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
