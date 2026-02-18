import React, { useState } from "react";
import { useEditor } from "@craftjs/core";
import { useRouter } from "next/navigation";
import { PanelRight, Play, X } from "lucide-react";
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
}

export const RightPanel = ({ projectId, activeTab: controlledTab, setActiveTab: setControlledTab }: RightPanelProps) => {
  const { showAlert } = useAlert();
  const [internalTab, setInternalTab] = useState<TabId>("design");
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = setControlledTab ?? setInternalTab;
  const [isPreviewing, setIsPreviewing] = useState(false);
  const router = useRouter();

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
    const primary = firstId && state.nodes[firstId]
      ? {
          id: firstId,
          name: state.nodes[firstId].data.displayName,
          settings: state.nodes[firstId].related?.settings,
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

  const handlePanelWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const tag = target.tagName;
    const isField =
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      target.isContentEditable;

    if (isField) {
      e.preventDefault();
      e.stopPropagation();
      if (e.nativeEvent && "stopImmediatePropagation" in e.nativeEvent) {
        (e.nativeEvent as any).stopImmediatePropagation();
      }
    }
  };

  return (
    <div
      data-panel="configs"
      className="w-80 bg-brand-darker/75 backdrop-blur-lg rounded-3xl p-6 h-full shadow-2xl overflow-y-auto border border-white/10 transition-shadow duration-300"
      style={{ boxShadow: "inset 0 2px 4px 0 rgba(255, 255, 255, 0.2)" }}
      onWheel={handlePanelWheel}
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
            <div className="bg-brand-medium/20 p-2 rounded-lg text-center border border-brand-medium/30">
              <span className="text-brand-lighter font-medium text-sm">
                {selectedIds.length === 1 && primary
                  ? primary.name
                  : `${selectedIds.length} components selected`}
              </span>
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
