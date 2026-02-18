/**
 * Firebase Storage helpers for the web builder.
 * All uploads go under Clients/ (your folder in Storage). No "clients/" (lowercase) is ever used.
 */

import { getFirebaseStorage, getFirebaseAuth, ensureFirebaseAuthForStorage } from '@/lib/firebase';
import {
  ref as storageRef,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';

/** Fixed prefix: always "Clients/" so everything goes in your Storage folder. Never "clients/". */
const STORAGE_PREFIX = 'Clients/';

/** Slug for path segments: safe for Storage paths (lowercase, dashes, no special chars). */
function slugPathSegment(value: string): string {
  if (!value || typeof value !== 'string') return 'unknown';
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'unknown';
}

/** Subfolder by MIME type (images | videos | files) */
function getFolderForFile(file: File): 'images' | 'videos' | 'files' {
  if (file.type.startsWith('image/')) return 'images';
  if (file.type.startsWith('video/')) return 'videos';
  return 'files';
}

/** Sanitize filename for storage (keep extension, safe name). */
function safeFileName(name: string): string {
  const base = name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
  return base || 'file';
}

export type UploadOptions = {
  /** Client name for path: {clientName}/... */
  clientName?: string;
  /** Project name for path: {clientName}/{projectName}/... */
  websiteName?: string;
  /** Legacy: use as folder when clientName/websiteName not set. */
  projectId?: string;
  /** Override subfolder (images | videos | files). Default: from file type. */
  folder?: 'images' | 'videos' | 'files';
};

/** Placeholder file so Clients/{clientName}/{websiteName}/ appears in Storage as soon as project is created. */
const PROJECT_PLACEHOLDER_PATH = '.project';

/**
 * Create Clients/{clientName}/{websiteName}/ in Storage right after createProject()
 * so the client name and project folder appear in Firebase Console without uploading an image.
 */
export async function ensureProjectStorageFolder(
  clientName: string,
  websiteName: string
): Promise<void> {
  const storage = getFirebaseStorage();
  if (!storage) return;
  await ensureFirebaseAuthForStorage();

  const client = slugPathSegment(clientName);
  const website = slugPathSegment(websiteName);
  const path = `${STORAGE_PREFIX}${client}/${website}/${PROJECT_PLACEHOLDER_PATH}`;
  const ref = storageRef(storage, path);
  try {
    await uploadBytes(ref, new Blob([], { type: 'application/octet-stream' }), {
      contentType: 'application/octet-stream',
    });
  } catch (e) {
    console.warn('ensureProjectStorageFolder:', path, e);
  }
}

/**
 * Build path: Clients/{clientName}/{projectName}/{folder}/{filename}
 * (always under Clients/, never clients/)
 */
function buildUploadPath(
  options: UploadOptions,
  folder: string,
  filename: string
): string {
  const prefix = STORAGE_PREFIX;
  if (options.clientName != null && options.websiteName != null) {
    const client = slugPathSegment(options.clientName);
    const website = slugPathSegment(options.websiteName);
    return `${prefix}${client}/${website}/${folder}/${filename}`;
  }
  const clientId = options.projectId ?? getFirebaseAuth()?.currentUser?.uid ?? 'anonymous';
  return `${prefix}${clientId}/${folder}/${filename}`;
}

/**
 * Upload a file to Firebase Storage.
 * Path: {clientName}/{projectName}/{images|videos|files}/{filename}
 * Returns the public download URL.
 */
export async function uploadClientFile(
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  const storage = getFirebaseStorage();
  if (!storage) {
    throw new Error(
      'Firebase Storage is not configured. Add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET or check Firebase config.'
    );
  }

  const folder = options.folder ?? getFolderForFile(file);
  const name = `${Date.now()}-${safeFileName(file.name)}`;
  const path = buildUploadPath(options, folder, name);

  const ref = storageRef(storage, path);
  await uploadBytes(ref, file, { contentType: file.type });
  const url = await getDownloadURL(ref);
  return url;
}

/**
 * Upload with real-time progress. Same path as uploadClientFile.
 * onProgress(0–100) is called as bytes are uploaded.
 */
export function uploadClientFileWithProgress(
  file: File,
  options: UploadOptions & { onProgress?: (percent: number) => void } = {}
): Promise<string> {
  const storage = getFirebaseStorage();
  if (!storage) {
    return Promise.reject(
      new Error(
        'Firebase Storage is not configured. Add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET or check Firebase config.'
      )
    );
  }

  const storageChecked = storage;
  return (async () => {
    await ensureFirebaseAuthForStorage();
  })().then(() => doUpload(storageChecked));

  async function doUpload(s: NonNullable<typeof storage>): Promise<string> {
  const folder = options.folder ?? getFolderForFile(file);
  const name = `${Date.now()}-${safeFileName(file.name)}`;
  const path = buildUploadPath(options, folder, name);

  const ref = storageRef(s, path);
  const task = uploadBytesResumable(ref, file, { contentType: file.type });
  const { onProgress } = options;

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(percent);
        }
      },
      reject,
      async () => {
        try {
          const url = await getDownloadURL(ref);
          if (onProgress) onProgress(100);
          resolve(url);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
  }
}
