import React, { useEffect, useMemo, useState } from "react";
import { useEditor, Element } from "@craftjs/core";
import { GROUPED_TEMPLATES } from "../../../_templates";
import { DesignTooltip } from "../DesignTooltip";
import { listTemplateLibrary, type Project } from "@/lib/api";
import { templateService } from "@/lib/templateService";
import { listTemplateProjectEntries } from "@/lib/templateProjectRegistry";
import { getDraft, getAllDrafts } from "../../_lib/pageApi";
import { parseContentToCleanDoc } from "../../_lib/contentParser";
import { deserializeCleanToCraft } from "../../_lib/serializer";

const STORAGE_KEY_PREFIX = "craftjs_preview_json";
const PERSISTENT_STORAGE_KEY_PREFIX = "craftjs_preview_persist";
const TEMPLATE_APPLY_BACKUP_PREFIX = "craftjs_template_apply_backup";

type SavedTemplateItem = {
  projectId: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string | null;
  content?: string | Record<string, unknown> | null;
  savedAt?: string;
};

function readStoredTemplateSnapshot(projectId: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    const sessionValue = window.sessionStorage.getItem(`${STORAGE_KEY_PREFIX}_${projectId}`);
    if (sessionValue) return sessionValue;
  } catch {
    // ignore storage read failures
  }

  try {
    return window.localStorage.getItem(`${PERSISTENT_STORAGE_KEY_PREFIX}_${projectId}`);
  } catch {
    return null;
  }
}

function persistTemplateSnapshot(projectId: string, snapshot: string): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(`${STORAGE_KEY_PREFIX}_${projectId}`, snapshot);
  } catch {
    // ignore storage write failures
  }

  try {
    window.localStorage.setItem(`${PERSISTENT_STORAGE_KEY_PREFIX}_${projectId}`, snapshot);
  } catch {
    // ignore storage write failures
  }
}

<<<<<<< HEAD
function getTemplateApplyBackupKey(projectId: string): string {
  return `${TEMPLATE_APPLY_BACKUP_PREFIX}_${projectId}`;
}

function readTemplateApplyBackup(projectId: string): string | null {
  if (typeof window === "undefined" || !projectId) return null;

  const key = getTemplateApplyBackupKey(projectId);
  try {
    const sessionValue = window.sessionStorage.getItem(key);
    if (sessionValue) return sessionValue;
  } catch {
    // ignore storage read failures
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function persistTemplateApplyBackup(projectId: string, snapshot: string): void {
  if (typeof window === "undefined" || !projectId || !snapshot) return;

  const key = getTemplateApplyBackupKey(projectId);
  try {
    window.sessionStorage.setItem(key, snapshot);
  } catch {
    // ignore storage write failures
  }

  try {
    window.localStorage.setItem(key, snapshot);
  } catch {
    // ignore storage write failures
  }
=======
function toCraftSnapshot(content: unknown): Record<string, any> | null {
  if (!content) return null;

  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object" && "ROOT" in parsed) {
        return parsed as Record<string, any>;
      }
      const cleanDoc = parseContentToCleanDoc(parsed);
      if (!cleanDoc) return null;
      return JSON.parse(deserializeCleanToCraft(cleanDoc));
    } catch {
      const cleanDoc = parseContentToCleanDoc(content);
      if (!cleanDoc) return null;
      return JSON.parse(deserializeCleanToCraft(cleanDoc));
    }
  }

  const maybeObject = content as Record<string, unknown>;
  if (maybeObject && typeof maybeObject === "object" && "ROOT" in maybeObject) {
    return maybeObject as Record<string, any>;
  }

  const cleanDoc = parseContentToCleanDoc(content);
  if (!cleanDoc) return null;
  return JSON.parse(deserializeCleanToCraft(cleanDoc));
}

function mergeTemplatePages(contents: unknown[]): string | null {
  const snapshots = contents
    .map(toCraftSnapshot)
    .filter((snapshot): snapshot is Record<string, any> => Boolean(snapshot && snapshot.ROOT));

  if (snapshots.length === 0) return null;

  const merged: Record<string, any> = JSON.parse(JSON.stringify(snapshots[0]));
  const root = merged.ROOT;
  if (!root || typeof root !== "object") return null;
  if (!Array.isArray(root.nodes)) root.nodes = [];

  const visitedSlugs = new Set<string>();
  const registerSlug = (nodeId: string) => {
    const node = merged[nodeId];
    const slug = node?.props?.pageSlug;
    if (typeof slug === "string" && slug.trim()) visitedSlugs.add(slug.trim().toLowerCase());
  };
  root.nodes.forEach((id: string) => registerSlug(id));

  for (let i = 1; i < snapshots.length; i += 1) {
    const snapshot = snapshots[i];
    const sourceRoot = snapshot.ROOT;
    if (!sourceRoot || !Array.isArray(sourceRoot.nodes)) continue;

    for (const sourcePageId of sourceRoot.nodes) {
      const sourcePage = snapshot[sourcePageId];
      if (!sourcePage) continue;
      const sourceSlug = sourcePage?.props?.pageSlug;
      if (typeof sourceSlug === "string" && visitedSlugs.has(sourceSlug.trim().toLowerCase())) continue;

      const idMap = new Map<string, string>();
      const stack = [sourcePageId];
      while (stack.length > 0) {
        const current = stack.pop() as string;
        if (idMap.has(current)) continue;
        const nextId = merged[current] ? `${current}_${i}_${idMap.size}` : current;
        idMap.set(current, nextId);
        const node = snapshot[current];
        if (!node) continue;
        if (Array.isArray(node.nodes)) {
          node.nodes.forEach((childId: string) => stack.push(childId));
        }
        if (node.linkedNodes && typeof node.linkedNodes === "object") {
          Object.values(node.linkedNodes).forEach((childId) => {
            if (typeof childId === "string") stack.push(childId);
          });
        }
      }

      idMap.forEach((targetId, sourceId) => {
        const sourceNode = snapshot[sourceId];
        if (!sourceNode || typeof sourceNode !== "object") return;
        const clone = JSON.parse(JSON.stringify(sourceNode));
        clone.parent = typeof clone.parent === "string" ? (idMap.get(clone.parent) || "ROOT") : "ROOT";
        clone.nodes = Array.isArray(clone.nodes)
          ? clone.nodes.map((id: string) => idMap.get(id) || id)
          : [];
        if (clone.linkedNodes && typeof clone.linkedNodes === "object") {
          Object.keys(clone.linkedNodes).forEach((key) => {
            const linked = clone.linkedNodes[key];
            if (typeof linked === "string") clone.linkedNodes[key] = idMap.get(linked) || linked;
          });
        } else {
          clone.linkedNodes = {};
        }
        merged[targetId] = clone;
      });

      const remappedRootId = idMap.get(sourcePageId);
      if (!remappedRootId) continue;
      merged[remappedRootId].parent = "ROOT";
      if (!root.nodes.includes(remappedRootId)) root.nodes.push(remappedRootId);
      registerSlug(remappedRootId);
    }
  }

  return JSON.stringify(merged);
>>>>>>> 3996677f934eda9d48dbd7ee89af7cc9713d7676
}

export const TemplatePanel = () => {
  const { connectors, actions, query } = useEditor();
  const [open, setOpen] = useState<Record<string, boolean>>({ "saved-templates": true });
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplateItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState<string>("");
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applyNotice, setApplyNotice] = useState<string>("");
  const [hasCanvasBackup, setHasCanvasBackup] = useState(false);

  const toggle = (folder: string) => setOpen((o) => ({ ...o, [folder]: !o[folder] }));

  const currentProjectId = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("projectId") || "";
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSavedTemplates = async () => {
      setSavedLoading(true);
      setSavedError("");
      try {
        const registry = listTemplateProjectEntries();
        const localOnly = new Map<string, SavedTemplateItem>();

        registry.forEach((entry) => {
          if (!entry.projectId || entry.projectId === currentProjectId) return;
          localOnly.set(entry.projectId, {
            projectId: entry.projectId,
            title: entry.name || "Untitled Template",
            description: entry.description || "Saved from builder preview.",
            category: entry.category || "Project Template",
            thumbnail: null,
            content: null,
            savedAt: entry.savedAt,
          });
        });

        const localItems = Array.from(localOnly.values()).sort((a, b) => {
          const aTime = new Date(a.savedAt || 0).getTime();
          const bTime = new Date(b.savedAt || 0).getTime();
          return bTime - aTime;
        });

        if (!cancelled && localItems.length > 0) {
          setSavedTemplates(localItems);
          setSavedLoading(false);
        }

        const projectRes = await listTemplateLibrary(120);
        const allProjects = projectRes.success ? projectRes.templates : [];

        const merge = new Map<string, SavedTemplateItem>(localOnly);

        allProjects
          .filter((project) => project.id !== currentProjectId)
          .forEach((project) => {
            if (project.id === currentProjectId) return;
            const normalizedStatus = String(project.status || "").trim().toLowerCase();
            const isTemplate = normalizedStatus === "template";
            merge.set(project.id, {
              projectId: project.id,
              title: (project.templateName || project.title || "Untitled Project").trim(),
              description: isTemplate ? "Saved from builder preview." : "Recover from this project draft.",
              category: isTemplate ? "Project Template" : "Workspace Project",
              thumbnail: project.thumbnail || null,
              content: project.templateContent || null,
              savedAt: project.updatedAt || project.createdAt,
            });
          });

        registry.forEach((entry) => {
          const project = allProjects.find((item: Project) => item.id === entry.projectId);
          if (!project || project.id === currentProjectId) return;
          merge.set(entry.projectId, {
            projectId: entry.projectId,
            title: entry.name || project.templateName || project.title || "Untitled Template",
            description: entry.description || "Saved from builder preview.",
            category: entry.category || "Project Template",
            thumbnail: project.thumbnail || null,
            content: project.templateContent || null,
            savedAt: entry.savedAt || project.updatedAt || project.createdAt,
          });
        });

        const next = Array.from(merge.values()).sort((a, b) => {
          const aTime = new Date(a.savedAt || 0).getTime();
          const bTime = new Date(b.savedAt || 0).getTime();
          return bTime - aTime;
        });

        if (!cancelled) setSavedTemplates(next);
      } catch {
        if (!cancelled) {
          setSavedError("Unable to load saved templates right now.");
          setSavedTemplates([]);
        }
      } finally {
        if (!cancelled) setSavedLoading(false);
      }
    };

    loadSavedTemplates();
    const onRegistryChanged = () => {
      void loadSavedTemplates();
    };
    window.addEventListener("template-project-registry:changed", onRegistryChanged as EventListener);
    window.addEventListener("storage", onRegistryChanged);

    return () => {
      cancelled = true;
      window.removeEventListener("template-project-registry:changed", onRegistryChanged as EventListener);
      window.removeEventListener("storage", onRegistryChanged);
    };
  }, [currentProjectId]);

  useEffect(() => {
    if (!currentProjectId) {
      setHasCanvasBackup(false);
      return;
    }
    setHasCanvasBackup(Boolean(readTemplateApplyBackup(currentProjectId)));
  }, [currentProjectId]);

  const restorePreviousCanvas = () => {
    if (!currentProjectId) {
      setApplyNotice("Current project is missing. Open this design from a project first.");
      return;
    }

    const backup = readTemplateApplyBackup(currentProjectId);
    if (!backup) {
      setHasCanvasBackup(false);
      setApplyNotice("No canvas backup found.");
      return;
    }

    try {
      actions.deserialize(backup);
      setApplyNotice("Previous canvas restored.");
      setHasCanvasBackup(true);
    } catch {
      setApplyNotice("Failed to restore previous canvas backup.");
    }
  };

  const applySavedTemplate = async (templateProjectId: string) => {
    setApplyNotice("");
    setApplyingId(templateProjectId);
    try {
      const confirmed =
        typeof window === "undefined" ||
        window.confirm(
          "Applying this template will replace your current canvas. We'll keep a backup so you can restore. Continue?"
        );

      if (!confirmed) {
        setApplyNotice("Template apply canceled.");
        return;
      }

      const selectedTemplate = savedTemplates.find((template) => template.projectId === templateProjectId) || null;
      const localSnapshot = readStoredTemplateSnapshot(templateProjectId);
      const allDraftsResult = localSnapshot ? null : await getAllDrafts(templateProjectId);
      const singleDraftResult = localSnapshot ? null : await getDraft(templateProjectId);

      const multiPageContents = (allDraftsResult?.data || [])
        .map((item: any) => item?.content ?? item?.page ?? null)
        .filter((item: unknown) => item !== null);

      let content = localSnapshot
        ?? mergeTemplatePages(multiPageContents)
        ?? singleDraftResult?.data?.content
        ?? singleDraftResult?.data
        ?? selectedTemplate?.content
        ?? null;

      if (!content && selectedTemplate) {
        const localTemplate = templateService.getTemplates().find((template) => {
          if (!template.isBuiltIn && template.sourceProjectId === templateProjectId) return true;
          const title = String(template.title || template.name || "").trim().toLowerCase();
          return !template.isBuiltIn && title === selectedTemplate.title.trim().toLowerCase();
        });

        if (localTemplate) {
          const craftJson = deserializeCleanToCraft(localTemplate.data);
          persistTemplateSnapshot(templateProjectId, craftJson);
          content = craftJson;
        }
      }

<<<<<<< HEAD
      if ((!result || !result.success) && !content) {
        setApplyNotice("Selected project draft is empty. Open that project and save once, then try again.");
=======
      const hasAnyRemoteTemplate = Boolean(
        (allDraftsResult && allDraftsResult.success && multiPageContents.length > 0)
          || (singleDraftResult && singleDraftResult.success)
      );

      if (!hasAnyRemoteTemplate && !content) {
        setApplyNotice("Template draft is empty. Save the template project first.");
>>>>>>> 3996677f934eda9d48dbd7ee89af7cc9713d7676
        return;
      }

      const parsedSnapshot = toCraftSnapshot(content);
      const craftJson = parsedSnapshot ? JSON.stringify(parsedSnapshot) : null;

      if (!craftJson) {
        setApplyNotice("Could not parse template content.");
        return;
      }

      if (currentProjectId) {
        const currentCanvasSnapshot = query.serialize();
        persistTemplateApplyBackup(currentProjectId, currentCanvasSnapshot);
        setHasCanvasBackup(true);
      }

      actions.deserialize(craftJson);
      setApplyNotice("Template applied to canvas. Use Restore Previous Canvas if you need to undo.");
    } catch {
      setApplyNotice("Failed to apply template. Please try again.");
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">

      <div className="border border-brand-medium/30 rounded-lg overflow-hidden">
        <button
          onClick={() => toggle("saved-templates")}
          className="w-full flex items-center justify-between px-3 py-2 bg-brand-white/5 hover:bg-brand-white/10"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-medium">Saved Templates</span>
          <span className="text-brand-medium text-xs">{open["saved-templates"] ? "−" : "+"}</span>
        </button>

        {open["saved-templates"] && (
          <div className="p-3 space-y-3">
            {savedLoading && <p className="text-xs text-brand-medium">Loading saved templates...</p>}
            {!savedLoading && savedError && <p className="text-xs text-red-300">{savedError}</p>}
            {!savedLoading && !savedError && savedTemplates.length === 0 && (
              <p className="text-xs text-brand-medium">No saved template projects yet. Save one from Preview first.</p>
            )}

            {!savedLoading && !savedError && savedTemplates.map((template) => (
              <div key={template.projectId} className="bg-brand-white/5 p-3 rounded border border-brand-medium/30">
                <div className="space-y-2">
                  <div className="h-28 w-full overflow-hidden rounded border border-brand-medium/30 bg-brand-white/10">
                    {template.thumbnail ? (
                      <img src={template.thumbnail} alt={template.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[10px] text-brand-medium">No thumb</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-brand-light truncate">{template.title}</div>
                    <div className="text-[10px] text-brand-medium truncate">{template.category}</div>
                    <div className="text-[10px] text-brand-medium mt-0.5 line-clamp-2">{template.description}</div>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const existingSnapshot = readStoredTemplateSnapshot(template.projectId);
                      if (!existingSnapshot) {
                        const localTemplate = templateService.getTemplates().find((entry) => {
                          if (!entry.isBuiltIn && entry.sourceProjectId === template.projectId) return true;
                          const title = String(entry.title || entry.name || "").trim().toLowerCase();
                          return !entry.isBuiltIn && title === template.title.trim().toLowerCase();
                        });

                        if (localTemplate) {
                          const craftJson = deserializeCleanToCraft(localTemplate.data);
                          persistTemplateSnapshot(template.projectId, craftJson);
                        }
                      }

                      window.open(`/design/preview?projectId=${encodeURIComponent(template.projectId)}`, "_blank");
                    }}
                    className="flex-1 text-[10px] font-semibold px-2 py-1.5 rounded border border-brand-medium/40 text-brand-light hover:bg-brand-white/10"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => void applySavedTemplate(template.projectId)}
                    disabled={applyingId === template.projectId}
                    className="flex-1 text-[10px] font-semibold px-2 py-1.5 rounded text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed bg-[linear-gradient(135deg,#6c8fff,#a78bfa)] shadow-[0_2px_8px_rgba(108,143,255,0.35)]"
                  >
                    {applyingId === template.projectId ? "Applying..." : "Apply"}
                  </button>
                </div>
              </div>
            ))}

            {hasCanvasBackup && (
              <button
                type="button"
                onClick={restorePreviousCanvas}
                className="w-full text-[10px] font-semibold px-2 py-1.5 rounded border border-brand-medium/40 text-brand-light hover:bg-brand-white/10"
              >
                Restore Previous Canvas
              </button>
            )}

            {!!applyNotice && <p className="text-[10px] text-brand-medium">{applyNotice}</p>}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {GROUPED_TEMPLATES.map((group) => (
          <div key={group.folder} className="border border-brand-medium/30 rounded-lg overflow-hidden">
            <DesignTooltip content={open[group.folder] ? "Collapse this category" : "Expand to see templates"} position="right">
              <button
                onClick={() => toggle(group.folder)}
                className="w-full flex items-center justify-between px-3 py-2 bg-brand-white/5 hover:bg-brand-white/10"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-medium">{group.folder}</span>
                <span className="text-brand-medium text-xs">{open[group.folder] ? "−" : "+"}</span>
              </button>
            </DesignTooltip>

            {open[group.folder] && (
              <div className="p-3 space-y-2">
                {group.items.filter((item: any) => !!item.element).map((item: any, idx: number) => (
                  <DesignTooltip key={`tooltip-${item.label || idx}`} content="Drag to apply this template to canvas" position="right">
                    <div
                      key={item.label || idx}
                      ref={(ref) => {
                        if (!ref || !item.element) return;
                        connectors.create(ref, item.element);
                      }}
                      className="bg-brand-white/5 p-3 rounded hover:bg-brand-white/10 transition cursor-move border border-brand-medium/30"
                    >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-brand-light">{item.label ?? item.label}</div>
                        {item.description && (
                          <div className="text-xs text-brand-medium mt-1">{item.description}</div>
                        )}
                      </div>
                      {item.preview && (
                        <div className="h-8 w-8 bg-brand-medium/20 rounded-lg flex items-center justify-center text-xs">
                          {item.preview}
                        </div>
                      )}
                    </div>
                    </div>
                  </DesignTooltip>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};