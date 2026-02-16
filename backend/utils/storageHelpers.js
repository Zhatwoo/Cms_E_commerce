const { getStorageBucket } = require('../config/firebase');

/** Fixed prefix: always "Clients/" to match frontend. Never "clients/". */
const STORAGE_PREFIX = 'Clients/';

/** Same slug as frontend firebaseStorage.ts: safe for Storage path segments. */
function slugPathSegment(value) {
  if (!value || typeof value !== 'string') return 'unknown';
  const slug = String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'unknown';
}

/**
 * Delete only the website (project) folder in Storage. Client folder is never deleted.
 * Path: {clientSlug}/{websiteSlug}/ — only files under this website path are removed (no clients/ prefix).
 * Uses same slug logic as frontend so the path matches.
 * Resolves when done; does not throw (logs errors). Safe to call if bucket not configured.
 * @param {string} clientName - User display name or username (as used when creating project)
 * @param {string} websiteName - Project title (website to delete; client is preserved)
 * @returns {Promise<void>}
 */
async function deleteProjectStorageFolder(clientName, websiteName) {
  const bucket = getStorageBucket();
  if (!bucket) {
    console.warn('[storageHelpers] Firebase Storage bucket not configured (set FIREBASE_STORAGE_BUCKET in backend .env); project folder not deleted from Storage.');
    return;
  }

  const client = slugPathSegment(clientName);
  const website = slugPathSegment(websiteName);
  const prefix = `${STORAGE_PREFIX}${client}/${website}/`;

  try {
    const [websiteFiles] = await bucket.getFiles({ prefix, autoPaginate: true });
    if (websiteFiles && websiteFiles.length > 0) {
      await Promise.all(websiteFiles.map((file) => file.delete().catch((err) => {
        console.warn('[storageHelpers] delete file failed:', file.name, err.message);
      })));
    }
  } catch (err) {
    console.warn('[storageHelpers] deleteProjectStorageFolder failed:', prefix, err.message);
  }
}

module.exports = { slugPathSegment, deleteProjectStorageFolder };
