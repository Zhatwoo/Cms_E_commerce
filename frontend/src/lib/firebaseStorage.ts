/**
 * Legacy Firebase Storage helpers for the web builder.
 * Media uploads now go through the backend API (uploadMediaApi).
 * ensureProjectStorageFolder is a no-op — backend creates paths on first upload.
 */

/**
 * No-op: Storage paths are created by the backend on first media upload.
 * Kept for API compatibility with web-builder, RecentProjects, ProjectSelectorModal.
 */
export async function ensureProjectStorageFolder(
  _clientName: string,
  _websiteName: string
): Promise<void> {
  // Backend handles storage; nothing to do client-side
}
