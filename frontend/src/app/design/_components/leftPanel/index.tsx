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
} from "lucide-react";
import { FilesPanel } from "./filesPanel";
import { ComponentsPanel } from "./componentsPanel";
import { AssetsPanel } from "./assetsPanel";

const STORAGE_KEY = "craftjs_preview_json";

interface LeftPanelProps {
  onToggle?: () => void;
}

export const LeftPanel = ({ onToggle }: LeftPanelProps) => {
  const [activePanel, setActivePanel] = useState("files");
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
      className={`w-80 bg-brand-dark/75 backdrop-blur-lg rounded-3xl p-6 flex flex-col gap-4 h-full overflow-y-auto border border-white/10 transition-shadow duration-300 ${
        activePanel === "components" ? "no-scrollbar" : ""
      }`}
      style={{ boxShadow: "inset 0 2px 4px 0 rgba(255, 255, 255, 0.2)" }}
    >
      {/* Left Panel Header */}
      <div className="flex items-start justify-between mb-2 gap-2">
        {/* Project dropdown trigger */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 py-1 -ml-2 transition-colors cursor-pointer"
          >
            <h3 className="text-brand-lighter font-bold text-lg">Inspire</h3>
            <ChevronDown
              className={`w-4 h-4 text-brand-light transition-transform duration-200 ${menuOpen ? "rotate-180" : ""
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

      {/* Project Title */}
      <label className="text-brand-white text-lg tracking-wider font-semibold">
        Project Title
      </label>

      {/* Navigation Tabs */}
      <div className="flex justify-between text-sm items-center py-1.5 px-4 border-y border-brand-medium">
        <button
          onClick={() => setActivePanel("files")}
          className={
            activePanel === "files"
              ? "text-brand-lighter bg-brand-medium/50 rounded-lg px-2.5 py-1"
              : "text-brand-light hover:text-brand-lighter px-2.5 py-1"
          }
        >
          Files
        </button>
        <button
          onClick={() => setActivePanel("components")}
          className={
            activePanel === "components"
              ? "text-brand-lighter bg-brand-medium/50 rounded-lg px-2.5 py-1"
              : "text-brand-light hover:text-brand-lighter px-2.5 py-1"
          }
        >
          Component
        </button>
        <button
          onClick={() => setActivePanel("assets")}
          className={
            activePanel === "assets"
              ? "text-brand-lighter bg-brand-medium/50 rounded-lg px-2.5 py-1"
              : "text-brand-light hover:text-brand-lighter px-2.5 py-1"
          }
        >
          Assets
        </button>
      </div>

      {activePanel === "files" && <FilesPanel />}

      {activePanel === "assets" && <AssetsPanel />}

      {activePanel === "components" && <ComponentsPanel />}
    </div>
  );
};
