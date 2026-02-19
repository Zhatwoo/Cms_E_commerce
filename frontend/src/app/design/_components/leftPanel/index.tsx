import React, { useState, useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Save,
  LayoutDashboard,
  Settings,
  FileDown,
  Trash2,
  X,
  FileStack,
  Layout,
  Image,
  LayoutTemplate,
} from "lucide-react";
import { useDesignProject } from "../../_context/DesignProjectContext";
import { FilesPanel } from "./filesPanel";
import { ComponentsPanel } from "./componentsPanel";
import { AssetsPanel } from "./assetsPanel";
import { TemplatePanel } from "./templatePanel";

const STORAGE_KEY = "craftjs_preview_json";

export type LeftPanelTabId = "files" | "components" | "assets" | "templates";

interface LeftPanelProps {
  onToggle?: () => void;
  activePanel?: LeftPanelTabId;
  setActivePanel?: (tab: LeftPanelTabId) => void;
}

export const LeftPanel = ({ onToggle, activePanel: controlledPanel, setActivePanel: setControlledPanel }: LeftPanelProps) => {
  const [internalPanel, setInternalPanel] = useState<LeftPanelTabId>("files");
  const activePanel = controlledPanel ?? internalPanel;
  const setActivePanel = setControlledPanel ?? setInternalPanel;
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { websiteName } = useDesignProject();

  const { query } = useEditor();

  // Close dropdown on click outside or Escape
  useEffect(() => {
    if (!menuOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  // ── Actions ───────────────────────────────────────────────
  const handleSave = () => {
    try {
      const json = query.serialize();
      sessionStorage.setItem(STORAGE_KEY, json);
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 1500);
    } catch {
      // storage error
    }
    setMenuOpen(false);
  };

  const handleExportJson = () => {
    try {
      const json = query.serialize();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // serialize error
    }
    setMenuOpen(false);
  };

  const handleClearCanvas = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  const handleBackToDashboard = () => {
    // Save before leaving
    try {
      const json = query.serialize();
      sessionStorage.setItem(STORAGE_KEY, json);
    } catch {
      // ignore
    }
    router.push("/m_dashboard");
  };

  return (
    <div
      data-panel="left"
      className="w-80 bg-brand-dark/75 backdrop-blur-lg rounded-3xl p-6 flex flex-col h-full border border-white/10 transition-shadow duration-300 overflow-hidden"
      style={{ boxShadow: "inset 0 2px 4px 0 rgba(255, 255, 255, 0.2)" }}
    >
      {/* Header + Title + Tabs: fixed at top, do not scroll */}
      <div className="flex flex-col gap-4 shrink-0">
      {/* Left Panel Header */}
      <div className="flex items-start justify-between mb-2 gap-2">
        {/* Project dropdown trigger */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 py-1 -ml-2 transition-colors cursor-pointer"
          >
            <h3 className="text-brand-lighter font-bold text-lg truncate max-w-[200px]" title={websiteName ?? "Project Title"}>
              {websiteName ?? "Project Title"}
            </h3>
            <ChevronDown
              className={`w-4 h-4 text-brand-light transition-transform duration-200 shrink-0 ${menuOpen ? "rotate-180" : ""
                }`}
            />
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div className="absolute left-0 top-full mt-2 w-56 bg-brand-darker border border-white/10 rounded-xl shadow-2xl py-1 z-50">
              {/* Save */}
              <button
                onClick={handleSave}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-brand-lighter hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4 text-brand-light" />
                Save project
                <span className="ml-auto text-[10px] text-brand-light/50">Ctrl+S</span>
              </button>

              {/* Export JSON */}
              <button
                onClick={handleExportJson}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-brand-lighter hover:bg-white/5 transition-colors cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-brand-light" />
                Export JSON
              </button>

              {/* Divider */}
              <div className="border-t border-white/5 my-1" />

              {/* Project settings (placeholder) */}
              <button
                disabled
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-brand-light/30 cursor-not-allowed"
              >
                <Settings className="w-4 h-4" />
                Project settings
                <span className="ml-auto text-[10px] bg-brand-medium/30 rounded px-1.5 py-0.5">Soon</span>
              </button>

              {/* Divider */}
              <div className="border-t border-white/5 my-1" />

              {/* Clear canvas */}
              <button
                onClick={handleClearCanvas}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Clear canvas
              </button>

              {/* Back to dashboard */}
              <button
                onClick={handleBackToDashboard}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-brand-lighter hover:bg-white/5 transition-colors cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-brand-light" />
                Back to dashboard
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          {/* Close / Exit button */}
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="p-1 rounded-lg hover:bg-white/5 text-brand-light transition-colors cursor-pointer"
              aria-label="Close left panel"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Save flash indicator */}
          {saveFlash && (
            <span className="text-[10px] text-emerald-400 font-medium animate-pulse">Saved</span>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex text-sm items-stretch justify-center py-1.5 px-1 border-y border-brand-medium gap-1 min-h-0">
        <button
          type="button"
          onClick={() => setActivePanel("files")}
          className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 transition-colors cursor-pointer ${
            activePanel === "files"
              ? "text-brand-lighter bg-brand-medium/50"
              : "text-brand-light"
          }`}
        >
          <FileStack className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-medium truncate w-full text-center">Files</span>
        </button>
        <button
          type="button"
          onClick={() => setActivePanel("components")}
          className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 transition-colors cursor-pointer ${
            activePanel === "components"
              ? "text-brand-lighter bg-brand-medium/50"
              : "text-brand-light"
          }`}
        >
          <Layout className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-medium truncate w-full text-center">Component</span>
        </button>
        <button
          type="button"
          onClick={() => setActivePanel("assets")}
          className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 transition-colors cursor-pointer ${
            activePanel === "assets"
              ? "text-brand-lighter bg-brand-medium/50"
              : "text-brand-light"
          }`}
        >
          <Image className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-medium truncate w-full text-center">Assets</span>
        </button>
        <button
          type="button"
          onClick={() => setActivePanel("templates")}
          className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 transition-colors cursor-pointer ${
            activePanel === "templates"
              ? "text-brand-lighter bg-brand-medium/50"
              : "text-brand-light"
          }`}
        >
          <LayoutTemplate className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-medium truncate w-full text-center">Templates</span>
        </button>
      </div>
      </div>

      {/* Panel content: only this area scrolls */}
      <div className={`flex-1 min-h-0 overflow-y-auto mt-4 ${activePanel === "components" ? "no-scrollbar" : ""}`}>
        {activePanel === "files" && <FilesPanel />}
        {activePanel === "assets" && <AssetsPanel />}
        {activePanel === "components" && <ComponentsPanel />}
        {activePanel === "templates" && <TemplatePanel />}
      </div>
    </div>
  );
};
