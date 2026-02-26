import React, { useState, useRef, useEffect } from "react";
import { useEditor } from "@craftjs/core";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, LockOpen, Play, Code2, GripVertical, X, Terminal, Palette, MousePointer2, Sparkles } from "lucide-react";
import { serializeCraftToClean } from "../../_lib/serializer";
import { autoSavePage } from "../../_lib/pageApi";
import { useAlert } from "@/app/m_dashboard/components/context/alert-context";
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
  { id: "design", label: "Design", icon: <Palette className="w-4 h-4 shrink-0" /> },
  { id: "prototype", label: "Prototype", icon: <MousePointer2 className="w-4 h-4 shrink-0" /> },
  { id: "animation", label: "Animation", icon: <Sparkles className="w-4 h-4 shrink-0" /> },
  { id: "code", label: "Code", icon: <Code2 className="w-4 h-4 shrink-0" /> },
];

const STORAGE_KEY_PREFIX = "craftjs_preview_json";

interface RightPanelProps {
  projectId: string;
  activeTab?: TabId;
  setActiveTab?: (tab: TabId) => void;
  /** When false, RightPanelInner is not mounted to avoid Craft.js setState-during-render. Set by EditorShell after Frame has committed. */
  frameReady?: boolean;
  /** Called when the user clicks the X to close the Configs panel. */
  onClose?: () => void;
  files?: any[];
  onFilesChange?: (files: any[]) => void;
}

// Inner panel that subscribes to Craft editor.
// Mounted lazily by RightPanel to avoid "setState during render" warnings
// when Frame is rendering initial data.
const RightPanelInner = ({ projectId, activeTab: controlledTab, setActiveTab: setControlledTab, onClose, files, onFilesChange }: RightPanelProps) => {
  const { showAlert } = useAlert();
  const [internalTab, setInternalTab] = useState<TabId>("design");
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = setControlledTab ?? setInternalTab;
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [panelWidth, setPanelWidth] = useState(320); // Default width
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(280);
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

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

  const handlePreview = async () => {
    try {
      setIsPreviewing(true);
      console.log('🔄 Preview triggered: Force-saving latest data...');

      const json = query.serialize();
      const rawCount = Object.keys(JSON.parse(json)).length;
      console.log(`📊 Preview: Raw Craft.js has ${rawCount} nodes.`);

      let previewSnapshot: string;
      try {
        const cleanCode = serializeCraftToClean(json);
        const cleanCount = Object.keys(cleanCode.nodes).length;
        const rawCountSafe = Object.keys(JSON.parse(json)).length;
        console.log(`📊 Preview: Clean output has ${cleanCode.pages.length} pages, ${cleanCount} nodes.`);

        if (cleanCode.pages.length === 0 && rawCountSafe > 1) {
          console.warn('⚠️ Preview: clean output has 0 pages while raw has content. Using raw snapshot fallback to prevent data loss.');
          previewSnapshot = json;
        } else {
          previewSnapshot = JSON.stringify(cleanCode);
        }
      } catch (serializeError) {
        console.warn('⚠️ Preview: serializeCraftToClean failed, saving raw Craft JSON for preview fallback:', serializeError);
        previewSnapshot = json;
      }

      try {
        window.sessionStorage.setItem(`${STORAGE_KEY_PREFIX}_${projectId}`, previewSnapshot);
      } catch (storageError) {
        console.warn('⚠️ Preview: failed to cache snapshot in sessionStorage', storageError);
      }

      // Force save to DB before navigating (save clean format when possible)
      const saveResult = await autoSavePage(previewSnapshot, projectId);
      if (!saveResult.success) {
        console.warn('⚠️ Preview: DB save failed, using session snapshot fallback.');
      }

      console.log('✅ Save complete, navigating to preview...');
      router.push(`/design/preview?projectId=${encodeURIComponent(projectId)}`);
    } catch (error) {
      console.error('❌ Preview failed:', error);
      showAlert('Failed to generate preview. Check console.');
    } finally {
      setIsPreviewing(false);
    }
  };

  // Prevent panel scroll when wheeling over inputs/selects (e.g. width/height) — use capture so we run before the scrollable container
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const handleWheelCapture = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      const isField =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable === true;
      if (isField) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    panel.addEventListener("wheel", handleWheelCapture, { passive: false, capture: true });
    return () => panel.removeEventListener("wheel", handleWheelCapture, { capture: true });
  }, []);

  // Handle panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaX = startX - e.clientX; // Positive when dragging left (increase width)
      const newWidth = startWidth + deltaX;
      // Min width: 280px, Max width: 70% of screen for better UX
      const constrainedWidth = Math.max(280, Math.min(newWidth, window.innerWidth * 0.7));
      setPanelWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
      // Add visual feedback to the panel during resize
      if (panelRef.current) {
        panelRef.current.style.transition = 'none';
        panelRef.current.style.opacity = '0.8';
      }
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.userSelect = "auto";
        document.body.style.cursor = "auto";
        // Restore panel styling
        if (panelRef.current) {
          panelRef.current.style.transition = '';
          panelRef.current.style.opacity = '';
        }
      };
    }
  }, [isResizing]);

  return (
    <div data-panel="right" className="flex h-full relative">
      {/* Resize Handle */}
      <div
        ref={resizeRef}
        onMouseDown={(e) => {
          e.preventDefault();
          setStartX(e.clientX);
          setStartWidth(panelWidth);
          setIsResizing(true);
        }}
        className={`${isResizing ? 'w-2 bg-blue-500/70' : 'w-3 bg-brand-medium/20 hover:bg-blue-500/40'
          } cursor-col-resize transition-all duration-200 group relative flex items-center justify-center select-none z-10`}
        title="Drag to resize panel"
      >
        {/* Visual grip indicator */}
        <div className={`flex flex-col gap-0.5 transition-opacity duration-200 ${isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
          <div className="w-0.5 h-1 bg-brand-light/60 rounded-full"></div>
          <div className="w-0.5 h-1 bg-brand-light/60 rounded-full"></div>
          <div className="w-0.5 h-1 bg-brand-light/60 rounded-full"></div>
        </div>
      </div>

      <div
        ref={panelRef}
        data-panel="configs"
        className="bg-brand-darker/75 backdrop-blur-lg rounded-3xl h-full shadow-2xl border border-white/10 transition-all duration-300 overflow-hidden flex flex-col"
        style={{
          width: `${panelWidth}px`,
          boxShadow: "inset 0 2px 4px 0 rgba(255, 255, 255, 0.2)",
        }}
      >
        <div className="h-full overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6 gap-2">
            <h3 className="text-brand-lighter font-bold text-lg">Configs</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePreview}
                disabled={isPreviewing}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${isPreviewing ? 'opacity-50 cursor-wait' : 'hover:bg-brand-medium/40'}`}
                title="Preview (Web / Clean / Raw)"
              >
                <Play strokeWidth={2} className={`w-5 h-5 transition-colors ${isPreviewing ? 'text-yellow-400 animate-pulse' : 'text-brand-light hover:text-brand-lighter'}`} />
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-lg transition-colors hover:bg-brand-medium/40 text-brand-light hover:text-brand-lighter"
                  title="Close panel"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          {selectedIds.length > 0 ? (
            <div>
              <div className="mb-6">
                <div className="flex items-center gap-2 bg-brand-medium/20 p-2 rounded-lg border border-brand-medium/30">
                  <span className="flex-1 text-brand-lighter font-medium text-sm text-center">
                    {selectedIds.length === 1 && primary
                      ? primary.name
                      : `${selectedIds.length} components selected`}
                  </span>
                  {primary && (
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
                        className={`p-1.5 rounded transition-colors ${primary.visibility === "hidden" ? "text-brand-light" : "text-brand-medium hover:text-brand-lighter"}`}
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
                        className={`p-1.5 rounded transition-colors ${primary.locked ? "text-brand-light" : "text-brand-medium hover:text-brand-lighter"}`}
                        title={primary.locked ? "Unlock" : "Lock"}
                      >
                        {primary.locked ? <Lock size={14} /> : <LockOpen size={14} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Tab Bar - Modern Pill Style */}
              <div className="w-full overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing select-none mb-8">
                <div className="inline-flex min-w-full p-1 bg-black/30 backdrop-blur-md rounded-2xl border border-white/5">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative z-10 flex-shrink-0 px-6 py-2.5 rounded-xl transition-all duration-300 text-xs font-bold uppercase tracking-wider whitespace-nowrap ${activeTab === tab.id
                        ? "text-white"
                        : "text-white/40 hover:text-white/60"
                        }`}
                    >
                      {activeTab === tab.id && (
                        <div className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20 animate-in fade-in zoom-in-95 duration-200" style={{ zIndex: -1 }} />
                      )}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {activeTab === "design" &&
                  (selectedIds.length > 1 ? (
                    <BatchEditGroup selectedIds={selectedIds} />
                  ) : primary?.settings ? (
                    React.createElement(primary.settings)
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-brand-lighter opacity-50">
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
                  <div className="h-[600px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <CodeEditor
                      mode="design"
                      projectId={projectId}
                      files={files || []}
                      onFilesChange={onFilesChange}
                      className="border-none shadow-none rounded-none"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-brand-lighter opacity-50">
              <p className="text-sm">Select an element to edit</p>
            </div>
          )}

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
        className="bg-brand-darker/75 backdrop-blur-lg rounded-3xl p-6 h-full shadow-2xl overflow-y-auto border border-white/10 transition-shadow duration-300 flex items-center justify-center text-xs text-brand-light/60"
        style={{ width: "280px", boxShadow: "inset 0 2px 4px 0 rgba(255, 255, 255, 0.2)" }}
      >
        Loading inspector…
      </div>
    );
  }

  return <RightPanelInner {...props} />;
};
