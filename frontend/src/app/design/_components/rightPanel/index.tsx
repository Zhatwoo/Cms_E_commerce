import React, { useState, useRef, useEffect } from "react";
import { useEditor } from "@craftjs/core";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, LockOpen, Play, X } from "lucide-react";
import { serializeCraftToClean } from "../../_lib/serializer";
import { autoSavePage } from "../../_lib/pageApi";
import { useAlert } from "@/app/m_dashboard/components/context/alert-context";
import { AnimationGroup } from "./settings/AnimationGroup";
import { BatchEditGroup } from "./settings/BatchEditGroup";
import { PrototypeGroup } from "./settings/PrototypeGroup";

export type TabId = "design" | "prototype" | "animation";

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: "design", label: "Design" },
  { id: "prototype", label: "Prototype" },
  { id: "animation", label: "Animation" },
];

interface RightPanelProps {
  projectId: string;
  activeTab?: TabId;
  setActiveTab?: (tab: TabId) => void;
  /** When false, RightPanelInner is not mounted to avoid Craft.js setState-during-render. Set by EditorShell after Frame has committed. */
  frameReady?: boolean;
  /** Called when the user clicks the X to close the Configs panel. */
  onClose?: () => void;
}

// Inner panel that subscribes to Craft editor.
// Mounted lazily by RightPanel to avoid "setState during render" warnings
// when Frame is rendering initial data.
const RightPanelInner = ({ projectId, activeTab: controlledTab, setActiveTab: setControlledTab, onClose }: RightPanelProps) => {
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

  return (
    <div
      data-panel="configs"
      className="w-80 bg-brand-darker/75 backdrop-blur-lg rounded-3xl p-6 h-full shadow-2xl overflow-y-auto border border-white/10 transition-shadow duration-300"
      style={{ boxShadow: "inset 0 2px 4px 0 rgba(255, 255, 255, 0.2)" }}
    >
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

          {/* Tab Bar */}
          <div className="flex justify-between text-sm items-center py-1.5 px-2 border-y border-brand-medium mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 transition-colors ${activeTab === tab.id
                  ? "text-brand-lighter bg-brand-medium/50 rounded-lg py-1"
                  : "text-brand-light hover:text-brand-lighter py-1"
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
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-brand-lighter opacity-50">
          <p className="text-sm">Select an element to edit</p>
        </div>
      )}
    </div>
  );
};

export const RightPanel = ({ frameReady = true, ...props }: RightPanelProps) => {
  const [ready, setReady] = useState(false);

  // Delay mounting the editor-subscribed content until after Frame has committed (frameReady)
  // and one extra frame. Avoids "Cannot update RightPanelInner while rendering De".
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const canMountInner = frameReady && ready;

  if (!canMountInner) {
    return (
      <div
        data-panel="configs"
        className="w-80 bg-brand-darker/75 backdrop-blur-lg rounded-3xl p-6 h-full shadow-2xl overflow-y-auto border border-white/10 transition-shadow duration-300 flex items-center justify-center text-xs text-brand-light/60"
        style={{ boxShadow: "inset 0 2px 4px 0 rgba(255, 255, 255, 0.2)" }}
      >
        Loading inspector…
      </div>
    );
  }

  return <RightPanelInner {...props} />;
};
