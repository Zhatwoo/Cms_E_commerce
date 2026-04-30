/**
 * Projects (web-builder drafts) API: CRUD, trash/restore, storage,
 * media upload/delete, publish/unpublish/schedule, and custom domains.
 */

import {
  apiFetch,
  handleResponse,
  getApiUrl,
  getActiveProjectId,
} from "./_core";

export type Project = {
  id: string;
  title: string;
  templateName?: string | null;
  templateContent?: string | Record<string, unknown> | null;
  status: string;
  industry?: string | null;
  templateId?: string | null;
  subdomain?: string | null;
  thumbnail?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  daysLeft?: number;
  isShared?: boolean;
  ownerName?: string;
  ownerId?: string;
  collaboratorPermission?: "editor" | "viewer";
};

export async function listProjects(): Promise<{ success: boolean; projects: Project[] }> {
  const t0 = Date.now();
  console.log("[READ] listProjects fetch start");
  const res = await apiFetch<{ success: boolean; projects: Project[] }>("/api/projects");
  console.log("[READ] listProjects fetch done", { projects: res?.projects?.length, ms: Date.now() - t0 });
  return res;
}

export async function listTemplateLibrary(limit = 60): Promise<{ success: boolean; templates: Project[] }> {
  const query = new URLSearchParams();
  if (Number.isFinite(limit)) query.set("limit", String(limit));
  const qs = query.toString();
  return apiFetch<{ success: boolean; templates: Project[] }>(
    qs ? `/api/projects/templates/library?${qs}` : "/api/projects/templates/library"
  );
}

export async function createProject(params: {
  title?: string;
  industry?: string | null;
  templateId?: string | null;
  subdomain?: string | null;
}): Promise<{ success: boolean; project: Project; message?: string }> {
  return apiFetch<{ success: boolean; project: Project; message?: string }>("/api/projects", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getProject(id: string): Promise<{ success: boolean; project: Project; message?: string }> {
  return apiFetch<{ success: boolean; project: Project; message?: string }>(`/api/projects/${id}`);
}

export async function getProjectBySubdomain(subdomain: string): Promise<{ success: boolean; project?: Project }> {
  const sub = encodeURIComponent(subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, "") || "");
  try {
    const data = await apiFetch<{ success: boolean; project?: Project }>(`/api/projects/by-subdomain?subdomain=${sub}`);
    return data;
  } catch {
    return { success: false };
  }
}

export async function updateProject(
  id: string,
  params: {
    title?: string;
    status?: string;
    templateName?: string | null;
    templateContent?: string | Record<string, unknown> | null;
    industry?: string | null;
    subdomain?: string | null;
    thumbnail?: string | null;
  }
): Promise<{ success: boolean; project: Project; message?: string }> {
  return apiFetch<{ success: boolean; project: Project; message?: string }>(`/api/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(params),
  });
}

/** Move project to trash instead of deleting permanently. */
export async function deleteProject(id: string): Promise<{ success: boolean; message?: string; daysLeft?: number; retentionDays?: number }> {
  return apiFetch<{ success: boolean; message?: string; daysLeft?: number; retentionDays?: number }>(`/api/projects/${id}`, { method: "DELETE" });
}

/** List all projects currently in the trash for the user. */
export async function listTrashedProjects(): Promise<{ success: boolean; projects: Project[]; retentionDays?: number }> {
  return apiFetch<{ success: boolean; projects: Project[]; retentionDays?: number }>("/api/projects/trash");
}

/** Restore a project from the trash back to the active list. */
export async function restoreProject(id: string): Promise<{ success: boolean; project: Project; message?: string }> {
  return apiFetch<{ success: boolean; project: Project; message?: string }>(`/api/projects/${id}/restore`, {
    method: "POST",
  });
}

/** Get project storage usage (bytes and human readable). */
export async function getProjectStorage(id: string): Promise<{ success: boolean; storageBytes: number; storageReadable: string }> {
  return apiFetch<{ success: boolean; storageBytes: number; storageReadable: string }>(`/api/projects/${id}/storage`, {
    headers: {
      // The project is already explicit in the route param.
      // Skip implicit active project header injection for this request.
      "x-skip-active-project-scope": "1",
    },
  });
}

/** Permanently purge a project from the database. This action cannot be undone. */
export async function permanentDeleteProject(id: string): Promise<{ success: boolean; message?: string }> {
  return apiFetch<{ success: boolean; message?: string }>(`/api/projects/${id}/permanent`, {
    method: "DELETE",
  });
}

/* ── Media ──────────────────────────────────────────────────────── */

/** Upload media file for web builder. Returns the public URL. */
export async function uploadMediaApi(
  projectId: string,
  file: File,
  options?: { onProgress?: (percent: number) => void; folder?: "images" | "videos" | "files" }
): Promise<{ url: string }> {
  const url =
    typeof window !== "undefined"
      ? `/api/projects/${projectId}/media`
      : `${getApiUrl().replace(/\/$/, "")}/api/projects/${projectId}/media`;

  const activeProjectId = getActiveProjectId();

  if (options?.onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("media", file);
      if (options.folder) formData.append("folder", options.folder);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && options.onProgress) {
          options.onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        let data: { success?: boolean; url?: string; message?: string } = {};
        const responseText = typeof xhr.responseText === "string" ? xhr.responseText.trim() : "";
        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            data = {};
          }
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          if (data.success && data.url) resolve({ url: data.url });
          else reject(new Error(data.message || "Upload failed"));
        } else {
          reject(new Error(data.message || "Upload failed"));
        }
      };

      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.open("POST", url);
      xhr.withCredentials = true;
      if (activeProjectId) xhr.setRequestHeader("x-project-id", activeProjectId);
      xhr.send(formData);
    });
  }

  const formData = new FormData();
  formData.append("media", file);
  if (options?.folder) formData.append("folder", options.folder);

  const headers: Record<string, string> = {};
  if (activeProjectId) headers["x-project-id"] = activeProjectId;

  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });

  const data = await handleResponse<{ success: boolean; url?: string; message?: string }>(res);
  if (!data.url) throw new Error(data.message || "Upload failed");
  return { url: data.url };
}

/** Delete media files by their public URLs. */
export async function deleteMediaApi(
  projectId: string,
  urls: string[]
): Promise<{ success: boolean; message?: string; summary?: { deleted: number; skipped: number } }> {
  return apiFetch<{ success: boolean; message?: string; summary?: { deleted: number; skipped: number } }>(
    `/api/projects/${projectId}/media`,
    {
      method: "DELETE",
      body: JSON.stringify({ urls }),
    }
  );
}

/* ── Publish / unpublish / schedule ─────────────────────────────── */

/** Update subdomain for an existing published project. */
export async function updateDomainSubdomain(
  projectId: string,
  subdomain: string
): Promise<{ success: boolean; message?: string; data?: { subdomain?: string } }> {
  return apiFetch<{ success: boolean; message?: string; data?: { subdomain?: string } }>("/api/domains/update-subdomain", {
    method: "POST",
    body: JSON.stringify({ projectId, subdomain }),
  });
}

/** Unpublish (take down) a published project. Site will no longer be accessible until published again. */
export async function unpublishProject(projectId: string): Promise<{ success: boolean; message?: string; data?: { subdomain?: string } }> {
  return apiFetch<{ success: boolean; message?: string; data?: { subdomain?: string } }>("/api/domains/unpublish", {
    method: "POST",
    body: JSON.stringify({ projectId }),
  });
}

/** Publish current project from Preview: creates/updates domain and public lookup so /sites/:subdomain works. */
export async function publishProject(
  projectId: string,
  subdomain?: string | null,
  content?: string | Record<string, unknown> | null
): Promise<{ success: boolean; message?: string; data?: { id: string; subdomain?: string } }> {
  return apiFetch<{ success: boolean; message?: string; data?: { id: string; subdomain?: string } }>("/api/domains/publish", {
    method: "POST",
    body: JSON.stringify({ projectId, subdomain: subdomain || undefined, content: content ?? undefined }),
  });
}

/** Schedule publish: current draft will go live at the given date/time (site must be published at least once). */
export async function schedulePublish(
  projectId: string,
  scheduledAt: string,
  subdomain?: string | null,
  content?: string | Record<string, unknown> | null
): Promise<{ success: boolean; message?: string; data?: { subdomain?: string; scheduledAt?: string } }> {
  return apiFetch("/api/domains/schedule-publish", {
    method: "POST",
    body: JSON.stringify({ projectId, subdomain: subdomain || undefined, scheduledAt, content: content ?? undefined }),
  });
}

/** Get scheduled publish for a project (if any). */
export async function getSchedule(projectId: string): Promise<{ success: boolean; data?: { scheduledAt: string; subdomain: string | null } | null }> {
  return apiFetch<{ success: boolean; data?: { scheduledAt: string; subdomain: string | null } | null }>(
    `/api/domains/schedule?projectId=${encodeURIComponent(projectId)}`
  );
}

/** Get publish history for a project (stack of { at, type }), newest first. */
export type PublishHistoryEntry = { at: string; type: string };

export async function getPublishHistory(projectId: string): Promise<{ success: boolean; data?: { history: PublishHistoryEntry[] } }> {
  return apiFetch<{ success: boolean; data?: { history: PublishHistoryEntry[] } }>(
    `/api/domains/publish-history?projectId=${encodeURIComponent(projectId)}`
  );
}

/* ── Custom Domains ─────────────────────────────────────────────── */

export type CustomDomainEntry = {
  id: string;
  domain: string;
  subdomain?: string;
  projectId?: string;
  projectTitle?: string;
  status?: string;
  domainStatus: "pending" | "verified" | "error";
  verifiedAt?: string | null;
};

export type DnsInstructions = {
  message: string;
  optionA: { type: string; host: string; value: string; description: string };
  optionB: { type: string; host: string; value: string; description: string };
};

/** List all custom domains for the current user. */
export async function listCustomDomains(): Promise<{ success: boolean; data: CustomDomainEntry[] }> {
  return apiFetch<{ success: boolean; data: CustomDomainEntry[] }>("/api/domains/custom");
}

/** Connect a custom domain to a published project. */
export async function addCustomDomain(
  projectId: string,
  domain: string
): Promise<{ success: boolean; message?: string; data?: { domain: string; status: string }; dnsInstructions?: DnsInstructions }> {
  return apiFetch("/api/domains/custom", {
    method: "POST",
    body: JSON.stringify({ projectId, domain }),
  });
}

/** Verify DNS records for a custom domain. */
export async function verifyCustomDomain(
  projectId: string
): Promise<{ success: boolean; message?: string; data?: { domain: string; status: string; details: string } }> {
  return apiFetch("/api/domains/custom/verify", {
    method: "POST",
    body: JSON.stringify({ projectId }),
  });
}

/** Remove a custom domain from a project. */
export async function removeCustomDomain(
  projectId: string
): Promise<{ success: boolean; message?: string }> {
  return apiFetch("/api/domains/custom", {
    method: "DELETE",
    body: JSON.stringify({ projectId }),
  });
}
