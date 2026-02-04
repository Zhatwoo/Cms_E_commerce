import React from "react";
import { useEditor } from "@craftjs/core";

export const RightPanel = () => {
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
    <div className="w-80 bg-brand-dark/75 backdrop-blur-lg rounded-3xl p-6 h-full shadow-2xl overflow-y-auto border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <span className="text-brand-light">icon</span>
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

          <div className="flex gap-2 mb-6 border-b border-brand-medium pb-2">
            <button className="flex-1 text-center text-white border-b-2 border-white pb-1 text-sm">Alignment</button>
            <button className="flex-1 text-center text-brand-light pb-1 text-sm">Animation</button>
          </div>

          {/* Render the specific settings component for the selected item */}
          <div className="space-y-6">
            {selected.settings && React.createElement(selected.settings)}
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
