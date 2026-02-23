"use client";

import React, { useState, useRef, useEffect } from "react";
import { Copy, Download, X, Plus, Trash2, Code2, Settings } from "lucide-react";

type EditorMode = "component" | "asset";
type FileType = "tsx" | "ts" | "jsx" | "js" | "css" | "json";

interface CodeFile {
  id: string;
  name: string;
  type: FileType;
  content: string;
}

interface CodeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

// Template generators for different modes
const TEMPLATES = {
  component: {
    tsx: `import React from 'react';

interface ComponentProps {
  className?: string;
}

/**
 * Reusable Next.js Component
 * 
 * Purpose: Create a styled, reusable UI component
 * Usage: Import and use in your design pages
 */
export const MyComponent: React.FC<ComponentProps> = ({ className = "" }) => {
  return (
    <div className={'w-full p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg ' + className}>
      <h2 className="text-2xl font-bold text-white mb-4">My Reusable Component</h2>
      <p className="text-white/80">Build amazing components with Next.js and Tailwind CSS</p>
    </div>
  );
};

export default MyComponent;
`,
    ts: `/**
 * Utility Functions & Types for Components
 * 
 * Purpose: Share business logic, helpers, and TypeScript types
 * Usage: Export and import across components
 */

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
}

export const DEFAULT_THEME: ThemeConfig = {
  primary: "#3b82f6",
  secondary: "#6b7280",
  accent: "#8b5cf6",
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
`,
  },
  asset: {
    tsx: `import React from 'react';

/**
 * SVG Icon Asset
 * 
 * Purpose: Create reusable SVG icons and graphics
 * Usage: Use in design components or export as static asset
 */
interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const MyIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = "currentColor",
  className = "" 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
};

export default MyIcon;
`,
    css: `/* Asset Styles & Tailwind Utilities */

/* Custom animations */
@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Utility classes */
.slide-in-left {
  animation: slideInFromLeft 0.3s ease-out;
}

.fade-in-scale {
  animation: fadeInScale 0.3s ease-out;
}

/* Glass effect */
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Custom scrollbar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}
`,
  },
};

export const CodeEditor: React.FC<CodeEditorProps> = ({ isOpen, onClose, projectId }) => {
  const [mode, setMode] = useState<EditorMode>("component");
  const [files, setFiles] = useState<CodeFile[]>([
    {
      id: "file-1",
      name: "MyComponent",
      type: "tsx",
      content: TEMPLATES.component.tsx,
    },
  ]);
  const [activeFileId, setActiveFileId] = useState("file-1");
  const [mounted, setMounted] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeFile = files.find((f) => f.id === activeFileId);

  // Update active file content
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!activeFile) return;
    const updated = files.map((f) =>
      f.id === activeFileId ? { ...f, content: e.target.value } : f
    );
    setFiles(updated);
  };

  // Add new file
  const handleAddFile = () => {
    const fileType: FileType = mode === "component" ? "tsx" : "css";
    const templates = TEMPLATES as Record<string, Record<string, string>>;
    const templateContent = templates[mode]?.[fileType] || "";
    const newFile: CodeFile = {
      id: `file-${Date.now()}`,
      name: `NewFile${files.length + 1}`,
      type: fileType,
      content: templateContent,
    };
    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
  };

  // Delete file
  const handleDeleteFile = (id: string) => {
    if (files.length === 1) {
      alert("Cannot delete the last file");
      return;
    }
    const filtered = files.filter((f) => f.id !== id);
    setFiles(filtered);
    if (activeFileId === id) {
      setActiveFileId(filtered[0]?.id || "");
    }
  };

  // Rename file
  const handleRenameFile = (id: string, newName: string) => {
    const updated = files.map((f) =>
      f.id === id ? { ...f, name: newName } : f
    );
    setFiles(updated);
  };

  // Change file type
  const handleChangeFileType = (fileId: string, newType: FileType) => {
    const updated = files.map((f) =>
      f.id === fileId ? { ...f, type: newType } : f
    );
    setFiles(updated);
  };

  // Copy to clipboard
  const handleCopyToClipboard = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    alert("Code copied to clipboard!");
  };

  // Download as file
  const handleDownload = () => {
    if (!activeFile) return;
    const element = document.createElement("a");
    const file = new Blob([activeFile.content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${activeFile.name}.${activeFile.type}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Export all files as project
  const handleExportProject = () => {
    const project = {
      projectId,
      mode,
      files: files.map((f) => ({
        name: f.name,
        type: f.type,
        content: f.content,
      })),
      exportedAt: new Date().toISOString(),
    };
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(project, null, 2)], {
      type: "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download = `project-${Date.now()}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-brand-darker border border-white/10 rounded-2xl w-full h-full max-h-[95vh] max-w-[95vw] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-white/10 p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <Code2 size={20} className="text-blue-400" />
            <h2 className="text-xl font-bold text-white">Code Editor</h2>
            <div className="flex gap-2 ml-6">
              <button
                onClick={() => setMode("component")}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  mode === "component"
                    ? "bg-blue-500/30 text-blue-300 border border-blue-500/50"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                📦 Component
              </button>
              <button
                onClick={() => setMode("asset")}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  mode === "asset"
                    ? "bg-purple-500/30 text-purple-300 border border-purple-500/50"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                🎨 Asset
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
          >
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* File Tabs & Explorer */}
          <div className="w-48 border-r border-white/10 bg-brand-darker/50 flex flex-col min-h-0">
            {/* File Tabs */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 min-h-0">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    activeFileId === file.id
                      ? "bg-white/10 border border-white/20"
                      : "hover:bg-white/5"
                  }`}
                  onClick={() => setActiveFileId(file.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white/80 truncate font-medium">
                      {file.name}
                    </div>
                    <div className="text-xs text-white/40">.{file.type}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file.id);
                    }}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all flex-shrink-0"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add File Button */}
            <div className="border-t border-white/10 p-2 flex-shrink-0">
              <button
                onClick={handleAddFile}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors text-sm font-medium"
              >
                <Plus size={16} /> New File
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 flex flex-col min-h-0">
            {activeFile ? (
              <>
                {/* Editor Toolbar */}
                <div className="border-b border-white/10 bg-brand-darker/50 p-3 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      value={activeFile.name}
                      onChange={(e) =>
                        handleRenameFile(activeFileId, e.target.value)
                      }
                      className="bg-white/5 text-white px-3 py-1 rounded-lg text-sm font-medium border border-white/10 focus:border-blue-500 focus:outline-none"
                    />
                    <select
                      value={activeFile.type}
                      onChange={(e) =>
                        handleChangeFileType(activeFileId, e.target.value as FileType)
                      }
                      className="bg-white/5 text-white/80 px-2 py-1 rounded-lg text-sm border border-white/10 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="tsx">TSX</option>
                      <option value="ts">TS</option>
                      <option value="jsx">JSX</option>
                      <option value="js">JS</option>
                      <option value="css">CSS</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyToClipboard}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                      title="Copy to clipboard"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                      title="Download file"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>

                {/* Code Editor */}
                <textarea
                  ref={editorRef}
                  value={activeFile.content}
                  onChange={handleContentChange}
                  className="flex-1 p-4 bg-brand-darker text-white font-mono text-sm resize-none focus:outline-none border-none custom-scrollbar min-h-0"
                  style={{
                    backgroundColor: "#0a0d14",
                    color: "#e0e7ff",
                    fontFamily: "'Fira Code', 'Courier New', monospace",
                  }}
                  spellCheck="false"
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-white/40 min-h-0">
                <p>No file selected</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-brand-darker/50 p-4 flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-white/60">
            {files.length} file{files.length !== 1 ? "s" : ""} • Mode: <span className="text-blue-300 font-medium">{mode.toUpperCase()}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportProject}
              className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors text-sm font-medium border border-purple-500/30"
            >
              📥 Export Project
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
