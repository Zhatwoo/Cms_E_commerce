import React, { useState } from "react";
import { useEditor } from "@craftjs/core";
import { useRouter } from "next/navigation";
import { PanelRight, Play } from "lucide-react";
import { serializeCraftToClean } from "../../_lib/serializer";
import { autoSavePage } from "../../_lib/pageApi";
import { useAlert } from "@/app/m_dashboard/components/context/alert-context";

type TabId = "design" | "settings" | "animation";

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: "design", label: "Design" },
  { id: "settings", label: "Settings" },
  { id: "animation", label: "Animation" },
];

const PROJECT_ID = "Leb2oTDdXU3Jh2wdW1sI";

export const RightPanel = () => {
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState<TabId>("design");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const router = useRouter();

  const { selected, query } = useEditor((state) => {
    const [currentNodeId] = state.events.selected;
    let selected;

    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.displayName,
        settings:
          state.nodes[currentNodeId].related &&
          state.nodes[currentNodeId].related.settings,
      };
    }

    return { selected };
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
      await autoSavePage(JSON.stringify(cleanCode), PROJECT_ID);

      console.log('✅ Save complete, navigating to preview...');
      router.push("/design/preview");
    } catch (error) {
      console.error('❌ Preview failed:', error);
      showAlert('Failed to generate preview. Check console.');
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <div
      className="w-80 bg-brand-darker/75 backdrop-blur-lg rounded-3xl p-6 h-full shadow-2xl overflow-y-auto border border-white/10"
      style={{ boxShadow: "inset 0 2px 4px 0 rgba(255, 255, 255, 0.2)" }}
    >
      <div className="flex items-center justify-between mb-6">
        <PanelRight strokeWidth={2} className="text-brand-light w-5 h-5" />
        <h3 className="text-brand-lighter font-bold text-lg">Configs</h3>
        <button
          onClick={handlePreview}
          disabled={isPreviewing}
          className={`p-1 rounded-lg transition-colors cursor-pointer ${isPreviewing ? 'opacity-50 cursor-wait' : 'hover:bg-brand-medium/40'}`}
          title="Preview JSON output"
        >
          <Play strokeWidth={2} className={`w-5 h-5 transition-colors ${isPreviewing ? 'text-yellow-400 animate-pulse' : 'text-brand-light hover:text-brand-lighter'}`} />
        </button>
      </div>

      {selected ? (
        <div>
          <div className="mb-6">
            <div className="bg-brand-medium/20 p-2 rounded-lg text-center border border-brand-medium/30">
              <span className="text-brand-lighter font-medium text-sm">
                {selected.name}
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
              (selected.settings ? (
                React.createElement(selected.settings)
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-brand-lighter opacity-50">
                  <p className="text-sm">No design settings available</p>
                </div>
              ))}

            {activeTab === "settings" && (
              <div className="flex flex-col items-center justify-center py-8 text-brand-lighter opacity-50">
                <p className="text-sm">Component settings coming soon</p>
              </div>
            )}

            {activeTab === "animation" && (
              <div className="flex flex-col items-center justify-center py-8 text-brand-lighter opacity-50">
                <p className="text-sm">Animation settings coming soon</p>
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
  );
};
