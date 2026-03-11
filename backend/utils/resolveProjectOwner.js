const { db } = require('../config/firebase');

/**
 * Given an authenticated userId, their email, and a projectId, determine who
 * actually owns the project.  Returns { ownerId, permission } where permission
 * is 'owner' for the project creator, or the collaborator's stored permission.
 * Returns null when the user has no access at all.
 */
async function resolveProjectOwner(userId, projectId, userEmail) {
  console.log(`[ResolveOwner] Checking if ${userId} owns ${projectId}`);
  // Fast path: user owns the project
  const ownSnap = await db
    .collection('user').doc('roles')
    .collection('client').doc(userId)
    .collection('projects').doc(projectId)
    .get();
  if (ownSnap.exists) {
    console.log(`[ResolveOwner] User ${userId} is the OWNER.`);
    return { ownerId: userId, permission: 'owner' };
  }

  const normalizedEmail = (userEmail || '').toLowerCase();
  console.log(`[ResolveOwner] Scanning other clients for ${normalizedEmail} access...`);

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

    console.log(`[ResolveOwner] Found project in client ${ownerId}, checking collaborators...`);

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
      const data = collabSnap.docs[0].data();
      console.log(`[ResolveOwner] Found collaborator doc for ${userId}/${normalizedEmail}. Permission: ${data.permission}`);
      return {
        ownerId,
        permission: data.permission || 'viewer',
      };
    }
  }

  console.log(`[ResolveOwner] No access found for ${userId}/${normalizedEmail}`);
  return null;
}

module.exports = { resolveProjectOwner };
