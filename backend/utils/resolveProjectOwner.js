const { db } = require('../config/firebase');
const log = require('./logger')('resolveProjectOwner');

// Simple in-memory cache to reduce Firestore reads for active sessions.
// Key: `${userId}:${projectId}:${userEmail}`, Value: { result, expiry }
const resolutionCache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds (short but effective for active edits)

/**
 * Given an authenticated userId, their email, and a projectId, determine who
 * actually owns the project. Returns { ownerId, permission } where permission
 * is 'owner' for the project creator, or the collaborator's stored permission.
 */
async function resolveProjectOwner(userId, pId, userEmail) {
  const projectId = (pId || '').toString().trim();
  const normalizedEmail = (userEmail || '').toLowerCase().trim();

  if (!projectId) return null;

  // 1. Check Cache
  const cacheKey = `${userId || 'anon'}:${projectId}:${normalizedEmail}`;
  const cached = resolutionCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.result;
  }

  const result = await _performResolution(userId, projectId, normalizedEmail);

  // Update cache
  resolutionCache.set(cacheKey, {
    result,
    expiry: Date.now() + CACHE_TTL
  });

  // Cleanup old cache entries occasionally
  if (resolutionCache.size > 1000) {
    const now = Date.now();
    for (const [key, val] of resolutionCache.entries()) {
      if (val.expiry < now) resolutionCache.delete(key);
    }
  }

  return result;
}

async function _performResolution(userId, projectId, normalizedEmail) {
  try {
    // A) Fast path: user is the direct owner
    if (userId) {
      const ownSnap = await db
        .collection('user').doc('roles')
        .collection('client').doc(userId)
        .collection('projects').doc(projectId)
        .get();

      if (ownSnap.exists) {
        return { ownerId: userId, permission: 'owner' };
      }
    }

    // B) Check collaboration across all users' project/collaborators subcollections
    // This uses a collectionGroup query which is efficient if indexed.
    if (normalizedEmail || userId) {
      // Create separate promises for email and id queries
      const queries = [];
      if (normalizedEmail) {
        queries.push(db.collectionGroup('collaborators').where('email', '==', normalizedEmail).get());
      }
      if (userId) {
        queries.push(db.collectionGroup('collaborators').where('userId', '==', userId).get());
      }

      const snapshots = await Promise.all(queries);
      for (const snap of snapshots) {
        for (const collabDoc of snap.docs) {
          const projectRef = collabDoc.ref.parent?.parent; // collaborators -> projects -> projectDoc
          if (projectRef && projectRef.id === projectId) {
            const ownerId = projectRef.parent?.parent?.id; // projects -> client -> clientDoc
            if (!ownerId) continue;

            const data = collabDoc.data();
            return {
              ownerId,
              permission: data.role || data.permission || 'viewer',
              collabDocId: collabDoc.id,
              email: data.email
            };
          }
        }
      }
    }

    // C) Check for Public Content ("anyone" access)
    // CRITICAL OPTIMIZATION: Do NOT scan all projects. 
    // We can use collectionGroup('projects') but filter by the document ID if the ID is unique.
    // In Firestore, we filter by FieldPath.documentId() (which is '__name__')
    const FieldPath = require('firebase-admin').firestore.FieldPath;

    // We can't use collectionGroup filter by ID easily without knowing the full path,
    // but we can query by a field if we ensure projects have 'id' field, OR
    // just use a more targeted collectionGroup query if possible.

    // Note: If you have MANY projects, querying collectionGroup('projects') without a filter 
    // will be slow and expensive. Let's try to query by ID if Firestore allows it in collectionGroup.
    // In many setups, theProjectId IS unique, so we can search where 'id' == projectId if projects store their ID.

    // Fallback: Check for public access. We use a limited query.
    const publicSnap = await db.collectionGroup('projects')
      .where('general_access', '==', 'anyone')
      .get(); // Still not ideal, but better than getting ALL projects.

    for (const projDoc of publicSnap.docs) {
      if (projDoc.id === projectId) {
        const ownerId = projDoc.ref.parent?.parent?.id;
        const role = projDoc.data().general_access_role || 'viewer';
        return { ownerId, permission: role, isPublic: true };
      }
    }

  } catch (err) {
    log.warn('Resolution error:', err.message);
  }

  return null;
}

module.exports = { resolveProjectOwner };
