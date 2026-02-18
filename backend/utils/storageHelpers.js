const { getStorageBucket } = require('../config/firebase');
const crypto = require('crypto');

/** Fixed prefix: always "Clients/" to match frontend. Never "clients/". */
const STORAGE_PREFIX = 'Clients/';

/**
 * Upload avatar to Storage at Clients/{folderName}/avatar.{ext}.
 * Use folderName = usernameSlug-uid so Firebase Console shows username for easier search.
 * @param {Buffer} buffer - File buffer
 * @param {string} clientUid - Firebase Auth UID (user id)
 * @param {string} mimeType - e.g. image/png
 * @param {string} [folderName] - Optional. If set, use as folder (e.g. "neo-dela-torre-uid"); else clientUid
 * @returns {Promise<string>} Public download URL
 */
async function uploadAvatar(buffer, clientUid, mimeType = 'image/png', folderName = null) {
  const bucket = getStorageBucket();
  if (!bucket) {
    throw new Error('Firebase Storage bucket not configured. Set FIREBASE_STORAGE_BUCKET in backend .env');
  }
  const ext = mimeType === 'image/jpeg' || mimeType === 'image/jpg' ? 'jpg' : 'png';
  const segment = (folderName && String(folderName).trim()) ? String(folderName).trim() : clientUid;
  const path = `${STORAGE_PREFIX}${segment}/avatar.${ext}`;
  const token = crypto.randomUUID();
  const file = bucket.file(path);
  await file.save(buffer, {
    metadata: {
      contentType: mimeType,
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  });
  const bucketName = bucket.name;
  const encodedPath = encodeURIComponent(path);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`;
}

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

module.exports = { slugPathSegment, deleteProjectStorageFolder, uploadAvatar };
