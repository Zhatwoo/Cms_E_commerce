import React, { useState, useRef, useEffect } from "react";
import { useEditor } from "@craftjs/core";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, LockOpen, Code2, X, Terminal, Layout, MousePointer, Activity } from "lucide-react";
import { serializeCraftToClean } from "../../_lib/serializer";
import { autoSavePage } from "../../_lib/pageApi";
import { useAlert } from "@/app/m_dashboard/components/context/alert-context";
import { getStoredUser } from "@/lib/api";
import { useAuth } from "@/app/m_dashboard/components/context/auth-context";
import { getLimits } from "@/lib/subscriptionLimits";
import { AnimationGroup } from "./settings/AnimationGroup";
import { BatchEditGroup } from "./settings/BatchEditGroup";
import { PrototypeGroup } from "./settings/PrototypeGroup";
import { CodeEditor } from "../CodeEditor";

export type TabId = "design" | "prototype" | "animation" | "code";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: "design", label: "Design", icon: <Layout className="w-4 h-4 shrink-0" /> },
  { id: "prototype", label: "Prototype", icon: <MousePointer className="w-4 h-4 shrink-0" /> },
  { id: "animation", label: "Animation", icon: <Activity className="w-4 h-4 shrink-0" /> },
  { id: "code", label: "Code", icon: <Code2 className="w-4 h-4 shrink-0" /> },
];

const STORAGE_KEY_PREFIX = "craftjs_preview_json";
const RIGHT_PANEL_DEFAULT_WIDTH = 300;

interface RightPanelProps {
  projectId: string;
  width?: number;
  activeTab?: TabId;
  setActiveTab?: (tab: TabId) => void;
  /** When false, RightPanelInner is not mounted to avoid Craft.js setState-during-render. Set by EditorShell after Frame has committed. */
  frameReady?: boolean;
  /** Called when the user clicks the X to close the Configs panel. */
  onClose?: () => void;
  files?: any[];
  onFilesChange?: (files: any[]) => void;
  permission?: "editor" | "viewer" | "owner";
}

// Inner panel that subscribes to Craft editor.
// Mounted lazily by RightPanel to avoid "setState during render" warnings
// when Frame is rendering initial data.
const RightPanelInner = ({ projectId, width = RIGHT_PANEL_DEFAULT_WIDTH, activeTab: controlledTab, setActiveTab: setControlledTab, onClose, files, onFilesChange, permission = "editor" }: RightPanelProps) => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [internalTab, setInternalTab] = useState<TabId>("design");
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = setControlledTab ?? setInternalTab;
  const [isPreviewing, setIsPreviewing] = useState(false);
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  const { actions } = useEditor();
  const { selectedIds, primary, query } = useEditor((state) => {
    const sel = state.events.selected;
    const ids: string[] = Array.isArray(sel)
      ? sel.filter((id) => id && id !== "ROOT")
      : sel instanceof Set
        ? Array.from(sel).filter((id) => id && id !== "ROOT")
        : sel && typeof sel === "object"
          ? Object.keys(sel).filter((id) => id && id !== "ROOT")
          : [];
    const firstId = ids[0];
    const firstNode = firstId ? state.nodes[firstId] : null;
    const firstProps = firstNode?.data?.props as Record<string, unknown> | undefined;
    const primary = firstId && firstNode
      ? {
        id: firstId,
        name: firstNode.data.displayName,
        settings: firstNode.related?.settings,
        visibility: (firstProps?.visibility as "visible" | "hidden" | undefined) ?? "visible",
        locked: (firstProps?.locked as boolean | undefined) ?? false,
      }
      : null;
    return { selectedIds: ids, primary };
  });


  // Prevent panel scroll when wheeling over inputs/selects (e.g. width/height) — use capture so we run before the scrollable container
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const handleWheelCapture = (e: WheelEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-code-editor-scroll='true']")) return;

      const blockedField = target.closest("input, select, [contenteditable='true']");
      if (blockedField) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    panel.addEventListener("wheel", handleWheelCapture, { passive: false, capture: true });
    return () => panel.removeEventListener("wheel", handleWheelCapture, { capture: true });
  }, []);

  return (
    <div data-panel="right" className="flex h-full relative">
      <div
        ref={panelRef}
        data-panel="configs"
        className="bg-builder-surface h-full border-l border-builder-border transition-[width,transform,opacity] duration-300 ease-out overflow-hidden flex flex-col"
        style={{
          width: `${width}px`,
        }}
      >
        <div className="h-full p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-6 gap-2">
            <h3 className="text-builder-text font-bold text-lg">Configurations</h3>
            <div className="flex items-center gap-1">
              {permission !== "viewer" && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-lg transition-colors hover:bg-builder-surface-3 text-builder-text-muted hover:text-builder-text"
                  title="Close panel"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          <div className="editor-panel-scroll flex-1 min-h-0 overflow-y-auto">
            {/* Main conditional rendering */}
            {selectedIds.length > 0 ? (
              <div className={activeTab === "code" ? "h-full min-h-0 flex flex-col" : undefined}>
                <div className="mb-6">
                  <div className="flex items-center gap-2 bg-builder-surface-2 p-2 rounded-lg border border-builder-border">
                    <span className="flex-1 text-builder-text font-medium text-sm text-center">
                      {selectedIds.length === 1 && primary
                        ? primary.name
                        : `${selectedIds.length} components selected`}
                    </span>
                    {primary && permission !== "viewer" && (
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            const next = primary.visibility === "hidden" ? "visible" : "hidden";
                            selectedIds.forEach((id) => {
                              try {
                                actions.setProp(id, (p: Record<string, unknown>) => { p.visibility = next; });
                              } catch { /* skip */ }
                            });
                          }}
                          className={`p-1.5 rounded transition-colors ${primary.visibility === "hidden" ? "text-builder-text-muted" : "text-builder-text-muted hover:text-builder-text"}`}
                          title={primary.visibility === "hidden" ? "Show" : "Hide"}
                        >
                          {primary.visibility === "hidden" ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !primary.locked;
                            selectedIds.forEach((id) => {
                              try {
                                actions.setProp(id, (p: Record<string, unknown>) => { p.locked = next; });
                              } catch { /* skip */ }
                            });
                          }}
                          className={`p-1.5 rounded transition-colors ${primary.locked ? "text-builder-text-muted" : "text-builder-text-muted hover:text-builder-text"}`}
                          title={primary.locked ? "Unlock" : "Lock"}
                        >
                          {primary.locked ? <Lock size={14} /> : <LockOpen size={14} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tab Bar - Formal & Premium Segmented Control */}
                <div className="w-full mb-6 px-1">
                  <div className="flex w-full p-1 rounded-xl gap-1" style={{ background: "var(--builder-surface-2)" }}>
                    {(() => {
                      const limits = getLimits(user?.subscriptionPlan);
                      return TABS.map((tab) => {
                        const isRestricted = tab.id === 'code' && !limits.codeEditor;
                        const isActive = activeTab === tab.id;

                        return (
                          <button
                            key={tab.id}
                            onClick={() => {
                              if (isRestricted) {
                                showAlert("Code Editor is a Pro feature. Upgrade to unlock!");
                                return;
                              }
                              setActiveTab(tab.id);
                            }}
                            className={`relative flex-1 p-1.5 rounded-lg transition-all duration-200 flex flex-col items-center justify-center gap-1 min-w-0 ${isActive
                              ? "bg-[var(--builder-surface-3)] text-[var(--builder-accent)] shadow-sm"
                              : isRestricted || (permission === "viewer" && tab.id === "code")
                                ? "text-[var(--builder-text-faint)] cursor-not-allowed"
                                : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] hover:bg-[var(--builder-surface-3)]/50"
                              }`}
                          >
                            <div className="flex flex-col items-center gap-0.5 min-w-0 justify-center">
                              {isRestricted ? (
                                <Lock size={12} className="text-amber-500/60 shrink-0" />
                              ) : (
                              <div className={`shrink-0 transition-all duration-200 ${isActive ? "scale-110" : ""}`}>
                                  {React.cloneElement(tab.icon as React.ReactElement<any>, { size: 16, strokeWidth: isActive ? 2.5 : 2 })}
                                </div>
                              )}
                              {width >= 320 && (
                                <span className={`text-[9px] uppercase truncate tracking-tighter text-center w-full px-0.5 mt-0.5 ${isActive ? "font-bold" : "font-medium"}`}>
                                  {tab.label}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Tab Content */}
                <div className={activeTab === "code" ? "flex-1 min-h-0" : "space-y-6"}>
                  {activeTab === "design" &&
                    (selectedIds.length > 1 ? (
                      <BatchEditGroup selectedIds={selectedIds} />
                    ) : primary?.settings ? (
                      React.createElement(primary.settings)
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-[var(--builder-text-muted)]">
                        <p className="text-sm">No design settings available</p>
                      </div>
                    ))}

                  {activeTab === "prototype" && (
                    <PrototypeGroup selectedIds={selectedIds} />
                  )}

                  {activeTab === "animation" && (
                    <AnimationGroup selectedIds={selectedIds} />
                  )}

                  {activeTab === "code" && (
                    <div className="h-full min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {permission === "viewer" ? (
                        <div className="flex flex-col items-center justify-center h-full text-builder-text-muted/40 text-center px-4">
                          <Lock className="w-8 h-8 mb-2 opacity-20" />
                          <p className="text-sm">Code editor is disabled in view-only mode</p>
                        </div>
                      ) : (
                        <CodeEditor
                          mode="design"
                          projectId={projectId}
                          files={files || []}
                          onFilesChange={onFilesChange}
                          className="h-full border-none shadow-none rounded-none"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-[var(--builder-text-muted)]">
                <p className="text-sm">Select a component to edit</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export const RightPanel: React.FC<RightPanelProps> = (props) => {
  const [ready, setReady] = useState(false);

  // Delay mounting the editor-subscribed content until after Frame has committed (frameReady)
  // and one extra frame. Avoids "Cannot update RightPanelInner while rendering De".
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const canMountInner = props.frameReady && ready;

  if (!canMountInner) {
    return (
      <div
        data-panel="configs"
        className="bg-builder-surface p-4 h-full overflow-y-auto border-l border-builder-border transition-[width,opacity] duration-300 ease-out flex items-center justify-center text-xs text-builder-text-muted"
        style={{ width: `${props.width ?? RIGHT_PANEL_DEFAULT_WIDTH}px` }}
      >
        Loading inspector…
      </div>
    );
  }

  return <RightPanelInner {...props} />;
};
