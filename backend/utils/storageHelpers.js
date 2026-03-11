const { getStorageBucket } = require('../config/firebase');
const crypto = require('crypto');
const path = require('path');

/** Fixed prefix: always "Clients/" to match frontend. Never "clients/". */
const STORAGE_PREFIX = 'Clients/';
/** Product image root folder requested by user. */
const PRODUCT_IMAGE_PREFIX = 'Products_img/';

/**
 * Upload avatar to Storage at:
 * Clients/profile_picture/{usernameSlug}/profile-{uid}
 * Uses a deterministic object name (no extension) so updates replace the same file.
 * @param {Buffer} buffer - File buffer
 * @param {string} clientUid - Firebase Auth UID (user id)
 * @param {string} mimeType - e.g. image/png
 * @param {string} [usernameSlug] - Optional username slug folder; falls back to clientUid
 * @returns {Promise<string>} Public download URL
 */
async function uploadAvatar(buffer, clientUid, mimeType = 'image/png', usernameSlug = null) {
  const bucket = getStorageBucket();
  if (!bucket) {
    throw new Error('Firebase Storage bucket not configured. Set FIREBASE_STORAGE_BUCKET in backend .env');
  }
  const segment = slugPathSegment(usernameSlug || clientUid);
  const path = `${STORAGE_PREFIX}profile_picture/${segment}/profile-${clientUid}`;
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

const MIME_EXTENSION_MAP = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogv',
  'application/pdf': 'pdf',
};

function getFileExtension(originalName, mimeType) {
  const fromName = path.extname(String(originalName || '')).replace('.', '').toLowerCase();
  if (/^[a-z0-9]{2,8}$/.test(fromName)) return fromName;
  const fromMime = MIME_EXTENSION_MAP[String(mimeType || '').toLowerCase()];
  return fromMime || 'bin';
}

function safeStorageFileBase(originalName) {
  const base = path
    .basename(String(originalName || ''), path.extname(String(originalName || '')))
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || 'file';
}

/**
 * Upload product image to Storage at:
 * Products_img/{uid}/products/{subdomain|general}/{timestamp}-{safeName}.{ext}
 * Returns direct download URL with token.
 */
async function uploadProductImage({ buffer, userId, mimeType = 'application/octet-stream', originalName = 'image', subdomain = '' }) {
  const bucket = getStorageBucket();
  if (!bucket) {
    throw new Error('Firebase Storage bucket not configured. Set FIREBASE_STORAGE_BUCKET in backend .env');
  }

  const folder = subdomain ? slugPathSegment(subdomain) : 'general';
  const ext = getFileExtension(originalName, mimeType);
  const baseName = safeStorageFileBase(originalName);
  const fileName = `${Date.now()}-${baseName}.${ext}`;
  const filePath = `${PRODUCT_IMAGE_PREFIX}${userId}/products/${folder}/${fileName}`;
  const token = crypto.randomUUID();

  const file = bucket.file(filePath);
  await file.save(buffer, {
    metadata: {
      contentType: mimeType,
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  });

  const bucketName = bucket.name;
  const encodedPath = encodeURIComponent(filePath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`;
}

/**
 * Upload web builder media to Storage at:
 * Clients/{clientSlug}/{websiteSlug}/{images|videos|files}/{timestamp}-{safeName}.{ext}
 * Returns direct download URL with token.
 * @param {Object} opts
 * @param {Buffer} opts.buffer - File buffer
 * @param {string} opts.mimeType - e.g. image/png, video/mp4
 * @param {string} opts.originalName - Original filename
 * @param {string} opts.clientName - Client/owner display name
 * @param {string} opts.websiteName - Project title
 * @param {string} [opts.folder] - 'images' | 'videos' | 'files'. Default: from mimeType
 * @returns {Promise<string>} Public download URL
 */
async function uploadClientMedia({ buffer, mimeType = 'application/octet-stream', originalName = 'file', clientName, websiteName, folder }) {
  const bucket = getStorageBucket();
  if (!bucket) {
    throw new Error('Firebase Storage bucket not configured. Set FIREBASE_STORAGE_BUCKET in backend .env');
  }

  let resolvedFolder = folder;
  if (!resolvedFolder) {
    const m = String(mimeType || '').toLowerCase();
    if (m.startsWith('image/')) resolvedFolder = 'images';
    else if (m.startsWith('video/')) resolvedFolder = 'videos';
    else resolvedFolder = 'files';
  }

  const ext = getFileExtension(originalName, mimeType);
  const baseName = safeStorageFileBase(originalName);
  const fileName = `${Date.now()}-${baseName}.${ext}`;
  const client = slugPathSegment(clientName || 'client');
  const website = slugPathSegment(websiteName || 'project');
  const filePath = `${STORAGE_PREFIX}${client}/${website}/${resolvedFolder}/${fileName}`;
  const token = crypto.randomUUID();

  const file = bucket.file(filePath);
  await file.save(buffer, {
    metadata: {
      contentType: mimeType,
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  });

  const bucketName = bucket.name;
  const encodedPath = encodeURIComponent(filePath);
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

function extractStoragePathFromUrl(url, bucketName) {
  if (!url || typeof url !== 'string') return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (parsed.protocol === 'gs:') {
      const gsBucket = parsed.hostname;
      if (bucketName && gsBucket !== bucketName) return null;
      const gsPath = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
      return gsPath || null;
    }

    if (host === 'firebasestorage.googleapis.com') {
      const match = parsed.pathname.match(/\/v0\/b\/([^/]+)\/o\/(.+)$/);
      if (!match) return null;
      const urlBucket = decodeURIComponent(match[1] || '');
      if (bucketName && urlBucket !== bucketName) return null;
      return decodeURIComponent(match[2] || '');
    }

    if (host === 'storage.googleapis.com') {
      const pathParts = parsed.pathname.replace(/^\/+/, '').split('/');
      if (pathParts.length < 2) return null;
      const urlBucket = decodeURIComponent(pathParts.shift() || '');
      if (bucketName && urlBucket !== bucketName) return null;
      return decodeURIComponent(pathParts.join('/'));
    }
  } catch {
    return null;
  }

  return null;
}

function escapeForRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isOwnedAvatarStoragePath(objectPath, uid) {
  if (!objectPath || !uid) return false;
  const safeUid = escapeForRegex(uid);
  // Legacy format: Clients/{slug-uid}/avatar.ext
  const legacyPattern = new RegExp(`^${STORAGE_PREFIX}[^/]*-${safeUid}/avatar\\.[^/]+$`);
  // New format: Clients/profile_picture/{username}/profile-{uid}
  const currentPattern = new RegExp(`^${STORAGE_PREFIX}profile_picture/[^/]+/profile-${safeUid}(?:\\.[^/]+)?$`);
  return legacyPattern.test(objectPath) || currentPattern.test(objectPath);
}

/**
 * Deletes previous avatar object only if the URL resolves to an avatar path owned by this uid.
 * Returns summary and never throws.
 */
async function deleteAvatarByUrlForUser(url, uid, { skipObjectPath = '' } = {}) {
  const bucket = getStorageBucket();
  if (!bucket || !url || !uid) return { deleted: 0, skipped: 1 };

  const objectPath = extractStoragePathFromUrl(url, bucket.name);
  if (!objectPath || !isOwnedAvatarStoragePath(objectPath, uid)) {
    return { deleted: 0, skipped: 1 };
  }
  if (skipObjectPath && objectPath === skipObjectPath) {
    return { deleted: 0, skipped: 1 };
  }

  try {
    await bucket.file(objectPath).delete();
    return { deleted: 1, skipped: 0 };
  } catch (err) {
    const code = err && typeof err === 'object' ? err.code : undefined;
    if (code !== 404) {
      console.warn('[storageHelpers] deleteAvatarByUrlForUser failed:', objectPath, err.message);
    }
    return { deleted: 0, skipped: 1 };
  }
}

function getStoragePathFromUrl(url) {
  const bucket = getStorageBucket();
  const bucketName = bucket ? bucket.name : undefined;
  return extractStoragePathFromUrl(url, bucketName);
}

/**
 * Delete storage objects by their public URL(s). Ignores non-bucket/non-storage URLs.
 * Returns deletion summary and never throws.
 */
async function deleteStorageFilesByUrls(urls, { allowedPrefixes = [] } = {}) {
  const bucket = getStorageBucket();
  if (!bucket) {
    return { deleted: 0, skipped: Array.isArray(urls) ? urls.length : 0 };
  }

  const list = Array.isArray(urls) ? urls : [];
  const uniqueUrls = [...new Set(list.filter((u) => typeof u === 'string' && u.trim().length > 0))];
  let deleted = 0;
  let skipped = 0;

  for (const url of uniqueUrls) {
    const objectPath = extractStoragePathFromUrl(url, bucket.name);
    if (!objectPath) {
      skipped += 1;
      continue;
    }

    if (Array.isArray(allowedPrefixes) && allowedPrefixes.length > 0) {
      const allowed = allowedPrefixes.some((prefix) => objectPath.startsWith(prefix));
      if (!allowed) {
        skipped += 1;
        continue;
      }
    }

    try {
      await bucket.file(objectPath).delete();
      deleted += 1;
    } catch (err) {
      const code = err && typeof err === 'object' ? err.code : undefined;
      if (code === 404) {
        skipped += 1;
      } else {
        console.warn('[storageHelpers] deleteStorageFilesByUrls failed:', objectPath, err.message);
        skipped += 1;
      }
    }
  }

  return { deleted, skipped };
}
/**
 * Calculate total storage usage (in bytes) for a specific project.
 * Sums:
 * 1) Media files in Firebase Storage (checking multiple possible path patterns)
 * 2) Product images in Firebase Storage
 * 3) Project and Page data in Firestore (estimated size)
 */
async function getProjectStorageUsage({ clientName, websiteName, userId, subdomain, projectId }) {
  const db = require('../config/firebase').db;
  const bucket = getStorageBucket();
  if (!bucket) return 0;

  let totalBytes = 0;

  // --- 1. Firestore Data Size (Estimation) ---
  if (userId && projectId) {
    try {
      const projRef = db.collection('user').doc('roles').collection('client').doc(userId).collection('projects').doc(projectId);
      const projSnap = await projRef.get();
      if (projSnap.exists) {
        totalBytes += Buffer.byteLength(JSON.stringify(projSnap.data()));

        // Count all pages in the project
        const pagesSnap = await projRef.collection('pages').get();
        pagesSnap.forEach(doc => {
          totalBytes += Buffer.byteLength(JSON.stringify(doc.data()));
        });
      }
    } catch (err) {
      console.warn('[storageHelpers] Firestore size calculation failed:', err.message);
    }
  }

  // --- 2. Firebase Storage Media ---
  const client = slugPathSegment(clientName);
  const website = slugPathSegment(websiteName);
  const id = projectId ? String(projectId).toLowerCase() : null;
  const sub = subdomain ? slugPathSegment(subdomain) : null;

  // Possible client-level folder names
  const clientFolders = [client];
  if (userId) clientFolders.push(`${client}-${userId}`);

  // Possible project-level folder names
  const projectFolders = [website];
  if (id) projectFolders.push(id);
  if (sub) projectFolders.push(sub);
  // Fallback: first word of a multi-word slug (common if project was renamed)
  if (website.includes('-')) projectFolders.push(website.split('-')[0]);

  const seenPaths = new Set();

  for (const cFolder of clientFolders) {
    for (const pFolder of projectFolders) {
      const prefix = `${STORAGE_PREFIX}${cFolder}/${pFolder}/`;
      if (seenPaths.has(prefix)) continue;
      seenPaths.add(prefix);

      try {
        const [files] = await bucket.getFiles({ prefix, autoPaginate: true });
        files.forEach((file) => {
          const size = parseInt(file.metadata.size || 0, 10);
          if (!isNaN(size)) totalBytes += size;
        });
      } catch (err) {
        // Silently skip if path doesn't exist or weird error
      }
    }
  }

  // --- 3. Product images (Specific to e-commerce) ---
  if (userId) {
    const folder = sub || 'general';
    const productPath = `${PRODUCT_IMAGE_PREFIX}${userId}/products/${folder}/`;
    try {
      const [files] = await bucket.getFiles({ prefix: productPath, autoPaginate: true });
      files.forEach((file) => {
        const size = parseInt(file.metadata.size || 0, 10);
        if (!isNaN(size)) totalBytes += size;
      });
    } catch (err) {
      // Ignore
    }
  }

  return totalBytes;
}

module.exports = {
  slugPathSegment,
  deleteProjectStorageFolder,
  uploadAvatar,
  uploadProductImage,
  uploadClientMedia,
  deleteStorageFilesByUrls,
  deleteAvatarByUrlForUser,
  getStoragePathFromUrl,
  getProjectStorageUsage,
};
