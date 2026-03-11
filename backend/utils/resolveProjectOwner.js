const { db } = require('../config/firebase');

/**
 * Given an authenticated userId, their email, and a projectId, determine who
 * actually owns the project.  Returns { ownerId, permission } where permission
 * is 'owner' for the project creator, or the collaborator's stored permission.
 * Returns null when the user has no access at all.
 */
async function resolveProjectOwner(userId, pId, userEmail) {
  const projectId = (pId || '').toString().trim();
  console.log(`[ResolveOwner] --- Start Resolution ---`);
  console.log(`[ResolveOwner] User: ${userId}, Project: "${projectId}", Email: ${userEmail}`);

  // Fast path: user is the direct owner
  const ownSnap = await db
    .collection('user').doc('roles')
    .collection('client').doc(userId)
    .collection('projects').doc(projectId)
    .get();

  if (ownSnap.exists) {
    console.log(`[ResolveOwner] MATCH: User ${userId} is the direct OWNER of ${projectId}.`);
    return { ownerId: userId, permission: 'owner' };
  }

  const normalizedEmail = (userEmail || '').toLowerCase();
  console.log(`[ResolveOwner] Not direct owner. Scanning all clients for collaborator access for ${normalizedEmail}...`);

  // Slow path: scan other clients
  const clientsSnap = await db
    .collection('user').doc('roles')
    .collection('client')
    .get();

  console.log(`[ResolveOwner] Found ${clientsSnap.size} total client collections to check.`);

  for (const clientDoc of clientsSnap.docs) {
    const ownerId = clientDoc.id;
    // We already checked this user as owner
    if (ownerId === userId) continue;

    const projSnap = await clientDoc.ref
      .collection('projects').doc(projectId).get();

    if (!projSnap.exists) continue;

    console.log(`[ResolveOwner] Project ${projectId} found under owner ${ownerId}. Checking collaborator doc...`);

    const collabCollection = projSnap.ref.collection('collaborators');

    // Check by userId
    let collabSnap = await collabCollection
      .where('userId', '==', userId)
      .limit(1)
      .get();

    // Fallback: check by email
    if (collabSnap.empty && normalizedEmail) {
      console.log(`[ResolveOwner] No match by userId. Checking by email: ${normalizedEmail}`);
      collabSnap = await collabCollection
        .where('email', '==', normalizedEmail)
        .limit(1)
        .get();
    }

    if (!collabSnap.empty) {
      const collabDoc = collabSnap.docs[0];
      const data = collabDoc.data();
      const role = data.role || data.permission || 'viewer';
      console.log(`[ResolveOwner] MATCH: Found collaborator doc. ID: ${collabDoc.id}, Role: ${role}`);
      return {
        ownerId,
        permission: role,
        collabDocId: collabDoc.id,
        email: data.email
      };
    }

    // Check if the project has general access set to 'anyone'
    const projData = projSnap.data();
    if (projData.general_access === 'anyone') {
      const role = projData.general_access_role || 'viewer';
      console.log(`[ResolveOwner] MATCH: Project has general_access='anyone'. Granting ${role} access.`);
      return {
        ownerId,
        permission: role,
        isPublic: true
      };
    }
  }

  console.log(`[ResolveOwner] RESULT: No access found for ${userId}/${normalizedEmail} on project ${projectId}`);
  return null;
}

module.exports = { resolveProjectOwner };
