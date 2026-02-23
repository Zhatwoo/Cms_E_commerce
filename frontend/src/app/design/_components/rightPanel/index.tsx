import React, { useState, useRef, useEffect } from "react";
import { useEditor } from "@craftjs/core";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, LockOpen, Play, Code2, GripVertical } from "lucide-react";
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
}

const TABS: Tab[] = [
  { id: "design", label: "Design" },
  { id: "prototype", label: "Prototype" },
  { id: "animation", label: "Animation" },
  { id: "code", label: "Code" },
];

interface RightPanelProps {
  projectId: string;
  activeTab?: TabId;
  setActiveTab?: (tab: TabId) => void;
}

export const RightPanel = ({ projectId, activeTab: controlledTab, setActiveTab: setControlledTab }: RightPanelProps) => {
  const { showAlert } = useAlert();
  const [internalTab, setInternalTab] = useState<TabId>("design");
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = setControlledTab ?? setInternalTab;
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(320); // w-80 = 320px
  const [isResizing, setIsResizing] = useState(false);
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

      const cleanCode = serializeCraftToClean(json);
      const cleanCount = Object.keys(cleanCode.nodes).length;
      console.log(`📊 Preview: Clean output has ${cleanCount} nodes.`);

      // Force save to DB before navigating
      await autoSavePage(JSON.stringify(cleanCode), projectId);

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
      const newWidth = window.innerWidth - e.clientX;
      // Min width: 320px, Max width: 80% of screen
      setPanelWidth(Math.max(320, Math.min(newWidth, window.innerWidth * 0.8)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.userSelect = "auto";
        document.body.style.cursor = "auto";
      };
    }
  }, [isResizing]);

  return (
    <div className="flex h-full relative">
      {/* Resize Handle */}
      <div
        ref={resizeRef}
        onMouseDown={() => setIsResizing(true)}
        className="w-1 bg-brand-medium/30 hover:bg-blue-500/50 cursor-col-resize transition-colors group hover:w-1.5"
        title="Drag to resize panel"
      />
      
      <div
        ref={panelRef}
        data-panel="configs"
        className="bg-brand-darker/75 backdrop-blur-lg rounded-3xl p-6 h-full shadow-2xl overflow-y-auto border border-white/10 transition-shadow duration-300"
        style={{
          width: `${panelWidth}px`,
          boxShadow: "inset 0 2px 4px 0 rgba(255, 255, 255, 0.2)",
        }}
      >
      <div className="flex items-center justify-between mb-6 gap-2">
        <h3 className="text-brand-lighter font-bold text-lg">Configs</h3>
        <button
          onClick={handlePreview}
          disabled={isPreviewing}
          className={`p-1 rounded-lg transition-colors cursor-pointer ${isPreviewing ? 'opacity-50 cursor-wait' : 'hover:bg-brand-medium/40'}`}
          title="Preview (Web / Clean / Raw)"
        >
          <Play strokeWidth={2} className={`w-5 h-5 transition-colors ${isPreviewing ? 'text-yellow-400 animate-pulse' : 'text-brand-light hover:text-brand-lighter'}`} />
        </button>
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

          {/* Tab Bar */}
          <div className="flex gap-2 text-sm items-center py-2 px-2 border-y border-brand-medium mb-6 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap font-medium ${
                  activeTab === tab.id
                    ? "text-brand-lighter bg-brand-medium/50 border border-brand-medium"
                    : "text-brand-light hover:text-brand-lighter py-2 hover:bg-brand-medium/20"
                }`}
              >
                {tab.label}
              </button>
            ))}
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
              <div className="space-y-4">
                <div className="bg-brand-medium/20 border border-brand-medium/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Code2 size={18} className="text-blue-400" />
                    <h3 className="font-semibold text-brand-lighter">Code Editor</h3>
                  </div>
                  <p className="text-brand-light text-sm mb-4">
                    Write, manage, and export Next.js components and assets. Choose between Component (reusable UI) or Asset (utilities & icons) mode.
                  </p>
                  <button
                    onClick={() => setIsCodeEditorOpen(true)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium text-sm"
                  >
                    🚀 Open Code Editor
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-brand-lighter opacity-50">
          <p className="text-sm">Select an element to edit</p>
        </div>
      )}

      {/* Code Editor Modal */}
      <CodeEditor
        isOpen={isCodeEditorOpen}
        onClose={() => setIsCodeEditorOpen(false)}
        projectId={projectId}
      />
      </div>
    </div>
  );
};
