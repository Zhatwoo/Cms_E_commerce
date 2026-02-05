import React, { useState } from "react";
import { useEditor } from "@craftjs/core";
import { PanelRight } from "lucide-react";

export const RightPanel = () => {
  const [activeTab, setActiveTab] = useState("alignment");

  const { selected } = useEditor((state) => {
    // Determine which node is currently selected
    const [currentNodeId] = state.events.selected;
    let selected;

    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.displayName,
        settings: state.nodes[currentNodeId].related && state.nodes[currentNodeId].related.settings,
      };
    }

    return { selected };
  });

  return (
    <div
      className="w-80 bg-brand-dark/75 backdrop-blur-lg rounded-3xl p-6 h-full shadow-2xl overflow-y-auto border border-white/10"
      style={{ boxShadow: 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.2)' }}
    >
      <div className="flex items-center justify-between mb-6">
        <PanelRight className="text-brand-light w-5 h-5" />
        <h3 className="text-white font-bold text-lg">Configs</h3>
        <span className="text-brand-light">▶</span>
      </div>

      {selected ? (
        <div>
          <div className="mb-6">
            <div className="bg-brand-medium/20 p-2 rounded-lg text-center border border-brand-medium/30">
              <span className="text-brand-lighter font-medium text-sm">{selected.name}</span>
            </div>
          </div>

          <div className="flex justify-between text-sm items-center py-1.5 px-4 border-y border-brand-medium mb-6">
            <button
              onClick={() => setActiveTab("alignment")}
              className={`flex-1 ${activeTab === "alignment" ? "text-white bg-brand-medium/50 rounded-lg py-1" : "text-brand-light hover:text-brand-lighter py-1"}`}
            >
              Alignment
            </button>
            <button
              onClick={() => setActiveTab("animation")}
              className={`flex-1 ${activeTab === "animation" ? "text-white bg-brand-medium/50 rounded-lg py-1" : "text-brand-light hover:text-brand-lighter py-1"}`}
            >
              Animation
            </button>
          </div>

          {/* Render content based on active tab */}
          <div className="space-y-6">
            {activeTab === "alignment" ? (
              selected.settings && React.createElement(selected.settings)
            ) : (
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
