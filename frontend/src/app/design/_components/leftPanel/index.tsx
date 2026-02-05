import React, { useState } from "react";
import { ChevronDown, PanelLeft, Search } from "lucide-react";
import { FilesPanel } from "./filesPanel";
import { ComponentsPanel } from "./componentsPanel";
import { AssetsPanel } from "./assetsPanel";

export const LeftPanel = () => {
  const [activePanel, setActivePanel] = useState("files");

  return (
    <div className="w-80 bg-brand-dark/75 backdrop-blur-lg rounded-3xl p-6 flex flex-col gap-4 h-full overflow-y-auto border border-white/10"
      style={{ boxShadow: 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.2)' }}>
      {/* Left Panel Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-bold text-lg">Inspire</h3>
          <ChevronDown className="w-4 h-4" />
        </div>
        {/* Toggle left panel Icon */}
        <div className="relative group">
          <PanelLeft className="w-4 h-4 cursor-pointer" />
          {/* Tooltip for Toggle left panel Icon */}
          <span className="absolute right-0 top-full mt-2 px-2 py-1 rounded bg-brand-medium/50 text-white text-xs opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
            Toggle left panel
          </span>
        </div>
      </div>

      {/* Project Title */}
      <label className="text-brand-white text-lg tracking-wider font-semibold">Project Title</label>

      {/* Navigation Tabs */}
      <div className="flex justify-between text-sm items-center py-1.5 px-4 border-y border-brand-medium">
        <button
          onClick={() => setActivePanel("files")}
          className={activePanel === "files" ? "text-white bg-brand-medium/50 rounded-lg px-2.5 py-1" : "text-brand-light hover:text-brand-lighter px-2.5 py-1"}
        >
          Files
        </button>
        <button
          onClick={() => setActivePanel("components")}
          className={activePanel === "components" ? "text-white bg-brand-medium/50 rounded-lg px-2.5 py-1" : "text-brand-light hover:text-brand-lighter px-2.5 py-1"}
        >
          Component
        </button>
        <button
          onClick={() => setActivePanel("assets")}
          className={activePanel === "assets" ? "text-white bg-brand-medium/50 rounded-lg px-2.5 py-1" : "text-brand-light hover:text-brand-lighter px-2.5 py-1"}
        >
          Assets
        </button>
      </div>


      {activePanel === "files" && (
        // {/* Search Files */ }
        //   <div className="flex items-center px-4">
        //     <input
        //       type="text"
        //       placeholder="Search Files"
        //       className="w-full bg-transparent text-sm text-white focus:outline-none pl-2 placeholder:text-brand-light"
        //     />
        //     <span className="text-brand-light"><Search className="w-4 h-4" /></span>
        //   </div>
        <FilesPanel />
      )}

      {activePanel === "assets" && <AssetsPanel />}

      {activePanel === "components" && <ComponentsPanel />}
    </div>
  );
};
