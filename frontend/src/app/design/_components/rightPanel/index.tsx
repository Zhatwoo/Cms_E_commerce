import React, { useState } from "react";
import { useEditor } from "@craftjs/core";
import { useRouter } from "next/navigation";
import { PanelRight, Play } from "lucide-react";

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

const STORAGE_KEY = "craftjs_preview_json";

export const RightPanel = () => {
  const [activeTab, setActiveTab] = useState<TabId>("design");
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

  const handlePreview = () => {
    const json = query.serialize();
    sessionStorage.setItem(STORAGE_KEY, json);
    // window.open("/design/preview", "_blank");
    router.push("/design/preview");
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
          className="p-1 rounded-lg hover:bg-brand-medium/40 transition-colors cursor-pointer"
          title="Preview JSON output"
        >
          <Play strokeWidth={2} className="text-brand-light w-5 h-5 hover:text-brand-lighter transition-colors" />
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
                <div className="flex flex-col items-center justify-center py-8 text-brand-light opacity-50">
                  <p className="text-sm">No design settings available</p>
                </div>
              ))}

            {activeTab === "settings" && (
              <div className="flex flex-col items-center justify-center py-8 text-brand-light opacity-50">
                <p className="text-sm">Component settings coming soon</p>
              </div>
            )}

            {activeTab === "animation" && (
              <div className="flex flex-col items-center justify-center py-8 text-brand-light opacity-50">
                <p className="text-sm">Animation settings coming soon</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-brand-light opacity-50">
          <p className="text-sm">Select an element to edit</p>
        </div>
      )}
    </div>
  );
};
