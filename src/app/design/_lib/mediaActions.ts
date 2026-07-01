
import { uploadMediaApi, deleteMediaApi } from "@/lib/api";

export const MEDIA_LIBRARY_KEY_PREFIX = "craftjs_media_library";

export type MediaLibraryItem = {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: number;
};

/**
 * Event name fired when the media library is updated externally.
 * Used by LeftPanel to refresh its media list.
 */
export const MEDIA_LIBRARY_UPDATED_EVENT = "craftjs_media_library_updated";

/**
 * Adds a file to the media library by uploading it and updating the local storage cache.
 * Throws an error if the upload fails.
 */
export async function addFileToMediaLibrary(projectId: string, file: File): Promise<MediaLibraryItem> {
  let folder: "images" | "videos" | "files" = "images";
  if (file.type.startsWith("video/")) folder = "videos";
  else if (file.type.startsWith("audio/")) folder = "files";
  else if (file.type.startsWith("application/pdf") || file.type.startsWith("text/")) folder = "files";

  // 1. Upload the file
  const { url } = await uploadMediaApi(projectId, file, { folder });

  const newItem: MediaLibraryItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    url,
    mimeType: file.type,
    size: file.size,
    createdAt: Date.now(),
  };

  // 2. Update local storage cache
  if (typeof window !== "undefined") {
    const mediaStorageKey = `${MEDIA_LIBRARY_KEY_PREFIX}_${projectId}`;
    try {
      const fromSession = window.sessionStorage.getItem(mediaStorageKey);
      const fromLocal = window.localStorage.getItem(mediaStorageKey);
      const raw = fromSession || fromLocal;
      
      let items: MediaLibraryItem[] = [];
      if (raw) {
        items = JSON.parse(raw);
        if (!Array.isArray(items)) items = [];
      }

      const next = [newItem, ...items].slice(0, 200);
      const serialized = JSON.stringify(next);
      
      window.localStorage.setItem(mediaStorageKey, serialized);
      window.sessionStorage.setItem(mediaStorageKey, serialized);

      // 3. Notify other components (like LeftPanel) to refresh
      window.dispatchEvent(new CustomEvent(MEDIA_LIBRARY_UPDATED_EVENT));
    } catch (e) {
      console.error("Failed to update media library cache:", e);
    }
  }

  return newItem;
}

/**
 * Removes files from the media library by deleting them from the project storage
 * and updating the local storage cache.
 */
export async function removeFilesFromMediaLibrary(projectId: string, itemIds: string[]): Promise<void> {
  if (typeof window === "undefined" || itemIds.length === 0) return;

  const mediaStorageKey = `${MEDIA_LIBRARY_KEY_PREFIX}_${projectId}`;
  
  try {
    const fromSession = window.sessionStorage.getItem(mediaStorageKey);
    const fromLocal = window.localStorage.getItem(mediaStorageKey);
    const raw = fromSession || fromLocal;
    
    if (!raw) return;
    
    const items: MediaLibraryItem[] = JSON.parse(raw);
    if (!Array.isArray(items)) return;

    // 1. Identify URLs to delete from project storage
    const itemsToDelete = items.filter(item => itemIds.includes(item.id));
    const urlsToDelete = itemsToDelete.map(item => item.url);

    if (urlsToDelete.length > 0) {
      await deleteMediaApi(projectId, urlsToDelete);
    }

    // 2. Update local storage cache
    const next = items.filter(item => !itemIds.includes(item.id));
    const serialized = JSON.stringify(next);
    
    window.localStorage.setItem(mediaStorageKey, serialized);
    window.sessionStorage.setItem(mediaStorageKey, serialized);

    // 3. Notify other components
    window.dispatchEvent(new CustomEvent(MEDIA_LIBRARY_UPDATED_EVENT));
  } catch (e) {
    console.error("Failed to remove files from media library:", e);
    throw e;
  }
}
