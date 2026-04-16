import React, { useEffect, useMemo, useState } from "react";
import { useEditor, Element } from "@craftjs/core";
import { GROUPED_TEMPLATES } from "../../../_templates";
import { DesignTooltip } from "../DesignTooltip";
import { listTemplateLibrary, type Project } from "@/lib/api";
import { templateService } from "@/lib/templateService";
import { listTemplateProjectEntries } from "@/lib/templateProjectRegistry";
import { getDraft } from "../../_lib/pageApi";
import { parseContentToCleanDoc } from "../../_lib/contentParser";
import { deserializeCleanToCraft } from "../../_lib/serializer";

const STORAGE_KEY_PREFIX = "craftjs_preview_json";
const PERSISTENT_STORAGE_KEY_PREFIX = "craftjs_preview_persist";

type SavedTemplateItem = {
  projectId: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string | null;
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

export const TemplatePanel = () => {
  const { connectors, actions } = useEditor();
  const [open, setOpen] = useState<Record<string, boolean>>({ "saved-templates": true });
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplateItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState<string>("");
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applyNotice, setApplyNotice] = useState<string>("");

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
          .filter((project) => String(project.status || "").trim().toLowerCase() === "template")
          .forEach((project) => {
            if (project.id === currentProjectId) return;
            merge.set(project.id, {
              projectId: project.id,
              title: (project.templateName || project.title || "Untitled Template").trim(),
              description: "Saved from builder preview.",
              category: "Project Template",
              thumbnail: project.thumbnail || null,
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

  const applySavedTemplate = async (templateProjectId: string) => {
    setApplyNotice("");
    setApplyingId(templateProjectId);
    try {
      const selectedTemplate = savedTemplates.find((template) => template.projectId === templateProjectId) || null;
      const localSnapshot = readStoredTemplateSnapshot(templateProjectId);
      const result = localSnapshot ? null : await getDraft(templateProjectId);
      let content = localSnapshot ?? result?.data?.content ?? result?.data;

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

      if ((!result || !result.success) && !content) {
        setApplyNotice("Template draft is empty. Save the template project first.");
        return;
      }

      let craftJson: string | null = null;
      if (typeof content === "string") {
        try {
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === "object" && "ROOT" in parsed) {
            craftJson = JSON.stringify(parsed);
          } else {
            const cleanDoc = parseContentToCleanDoc(parsed);
            if (cleanDoc) craftJson = deserializeCleanToCraft(cleanDoc);
          }
        } catch {
          const cleanDoc = parseContentToCleanDoc(content);
          if (cleanDoc) craftJson = deserializeCleanToCraft(cleanDoc);
        }
      } else {
        const cleanDoc = parseContentToCleanDoc(content);
        if (cleanDoc) craftJson = deserializeCleanToCraft(cleanDoc);
      }

      if (!craftJson) {
        setApplyNotice("Could not parse template content.");
        return;
      }

      actions.deserialize(craftJson);
      setApplyNotice("Template applied to canvas.");
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
                    className="flex-1 text-[10px] font-semibold px-2 py-1.5 rounded bg-brand-medium/30 text-brand-light hover:bg-brand-medium/40 disabled:opacity-60"
                  >
                    {applyingId === template.projectId ? "Applying..." : "Apply"}
                  </button>
                </div>
              </div>
            ))}

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