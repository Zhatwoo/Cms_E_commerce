const { db } = require('../config/firebase');

/**
 * Given an authenticated userId, their email, and a projectId, determine who
 * actually owns the project.  Returns { ownerId, permission } where permission
 * is 'owner' for the project creator, or the collaborator's stored permission.
 * Returns null when the user has no access at all.
 */
async function resolveProjectOwner(userId, projectId, userEmail) {
  // Fast path: user owns the project
  const ownSnap = await db
    .collection('user').doc('roles')
    .collection('client').doc(userId)
    .collection('projects').doc(projectId)
    .get();
  if (ownSnap.exists) {
    return { ownerId: userId, permission: 'owner' };
  }

  const normalizedEmail = (userEmail || '').toLowerCase();

  // Slow path: scan other clients for a project with this ID where the
  // current user appears in the collaborators sub-collection.
  const clientsSnap = await db
    .collection('user').doc('roles')
    .collection('client')
    .get();

  for (const clientDoc of clientsSnap.docs) {
    const ownerId = clientDoc.id;
    if (ownerId === userId) continue;

    const projSnap = await clientDoc.ref
      .collection('projects').doc(projectId).get();
    if (!projSnap.exists) continue;

    const collabCollection = clientDoc.ref
      .collection('projects').doc(projectId)
      .collection('collaborators');

    // Check by userId first
    let collabSnap = await collabCollection
      .where('userId', '==', userId)
      .limit(1)
      .get();

    // Fallback: check by email (userId may not have been set at invite time)
    if (collabSnap.empty && normalizedEmail) {
      collabSnap = await collabCollection
        .where('email', '==', normalizedEmail)
        .limit(1)
        .get();
    }

    if (!collabSnap.empty) {
      return {
        ownerId,
        permission: collabSnap.docs[0].data().permission || 'viewer',
      };
    }
  }

  return null;
}

module.exports = { resolveProjectOwner };
