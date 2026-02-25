"use client";

import React, { useState, useRef, useEffect } from "react";
import { useEditor } from "@craftjs/core";
import { FileType, CodeFile } from "../_types/schema";
import { autoSavePage } from "../_lib/pageApi";
import {
  Code2,
  Trash2,
  Plus,
  Files,
  Layout,
  Search,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Terminal,
  Package,
  GripHorizontal,
  X,
  Check,
  ClipboardCheck,
  Settings,
  AlertCircle
} from "lucide-react";

interface CodeEditorProps {
  mode: "design" | "component" | "page";
  projectId: string;
  className?: string;
  files?: CodeFile[];
  onFilesChange?: (files: CodeFile[]) => void;
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

export const debounce = <T extends (...args: any[]) => any>(
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

export const CodeEditor = ({ mode, projectId, className = "", files: propFiles, onFilesChange }: CodeEditorProps) => {
  const { actions, selectedId, selectedNode, nodes, query } = useEditor((state) => {
    const sel = state.events.selected;
    const id = Array.isArray(sel)
      ? sel[0]
      : sel instanceof Set
        ? Array.from(sel)[0]
        : null;
    return {
      selectedId: id,
      selectedNode: id ? state.nodes[id] : null,
      nodes: state.nodes
    };
  });

  const [localFiles, setLocalFiles] = useState<CodeFile[]>(propFiles || []);
  const files = propFiles || localFiles;
  const setFiles = onFilesChange || setLocalFiles;

  const [activeFileId, setActiveFileId] = useState("instance-props");
  const [tailwindContent, setTailwindContent] = useState("");
  const [instanceError, setInstanceError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const lastAppliedContentRef = useRef<string>("");

  const syncScroll = () => {
    if (editorRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = editorRef.current.scrollTop;
      highlightRef.current.scrollLeft = editorRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize files from props if available
  useEffect(() => {
    if (propFiles && propFiles.length > 0) {
      if (activeFileId === "instance-props" && propFiles.length > 0) {
        // keep instance-props active if we just loaded
      }
      return;
    }

    if (files.length === 0) {
      const templates = TEMPLATES as any;
      const defaultFileContent = templates[mode]?.tsx || templates.component.tsx;
      const baseFiles: CodeFile[] = [
        {
          id: "MyComponent.tsx",
          name: "MyComponent",
          type: "tsx",
          content: defaultFileContent,
        },
      ];
      setFiles(baseFiles);
    }
  }, [mode, propFiles]);

  // Update instance content when selection changes
  useEffect(() => {
    const isFocused = document.activeElement === editorRef.current;
    if (isFocused && activeFileId === "instance-props") return;

    if (selectedNode && (activeFileId === "instance-props" || !selectedId)) {
      const generateJSX = (nodeId: string, depth = 0): string => {
        const node = (nodes as any)[nodeId];
        if (!node) return "";

        const p = node.data.props;
        let type = (node.data.type as any).resolvedName || node.data.displayName;
        if (!type || type === "undefined") {
          type = nodeId === 'ROOT' ? 'Page' : 'Component';
        }
        const indent = "  ".repeat(depth + 2);

        let content = "";
        let attributes = `data-node-id="${nodeId}"`;

        if (p.customClassName) attributes += ` className="${p.customClassName}"`;

        if (type === "Text") {
          content = p.text || "";
        } else if (type === "Button") {
          if (p.label) attributes += ` label="${p.label}"`;
          if (p.variant) attributes += ` variant="${p.variant}"`;
          if (p.link) attributes += ` link="${p.link}"`;
        } else if (type === "Image") {
          if (p.src) attributes += ` src="${p.src}"`;
          if (p.alt) attributes += ` alt="${p.alt}"`;
        }

        const styleProps: any = {};
        const styleFields = [
          "backgroundColor", "background", "backgroundImage", "color",
          "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
          "margin", "marginTop", "marginRight", "marginBottom", "marginLeft",
          "width", "height", "borderRadius", "opacity", "fontSize", "fontWeight", "textAlign"
        ];

        styleFields.forEach(field => {
          const val = p[field];
          if (val !== undefined && val !== null && val !== "" && val !== 0 && val !== "0px" && val !== "0") {
            styleProps[field] = val;
          }
        });

        if (Object.keys(styleProps).length > 0) {
          const styleStr = JSON.stringify(styleProps)
            .replace(/"([^"]+)":/g, "$1:") // Remove quotes from keys
            .replace(/"/g, "'"); // Use single quotes for values
          attributes += ` style={{${styleStr}}}`;
        }

        if (type === "Image") {
          return `${indent}<${type} ${attributes} />\n`;
        } else if (node.data.nodes && node.data.nodes.length > 0) {
          content = "\n" + node.data.nodes
            .map((childId: string) => generateJSX(childId, depth + 1))
            .join("") + indent;
        }

        return `${indent}<${type} ${attributes}>${content}</${type}>\n`;
      };

      if (selectedId) {
        const jsx = generateJSX(selectedId).trim();
        const content = `export default function Page() {\n  return (\n    <div className="w-full h-full bg-white">\n      ${jsx}\n    </div>\n  );\n}`;
        setTailwindContent(content);
        lastAppliedContentRef.current = content; // Sync ref so we don't immediately save back
      }
      setInstanceError(null);
    }
  }, [selectedId, activeFileId, nodes]);

  const activeFile = activeFileId === "instance-props"
    ? {
      id: "instance-props",
      name: selectedNode?.data.displayName || "Component",
      type: "tsx" as FileType,
      content: tailwindContent
    }
    : files.find((f) => f.id === activeFileId);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;

    if (activeFileId === "instance-props") {
      setTailwindContent(newContent);
      if (!newContent.includes('data-node-id="')) {
        setInstanceError("Missing data-node-id attributes");
      } else {
        setInstanceError(null);
      }
    } else {
      const updated = files.map((f) =>
        f.id === activeFileId ? { ...f, content: newContent } : f
      );
      setFiles(updated);
    }
  };

  // Autosave effect
  useEffect(() => {
    if (activeFileId !== "instance-props" || !selectedId || !tailwindContent) return;

    // Don't re-apply if it matches what we last applied
    if (tailwindContent === lastAppliedContentRef.current) return;

    setIsSaving(true);
    const timer = setTimeout(() => {
      handleApplyInstanceProps();
      setIsSaving(false);
    }, 500);

    return () => {
      clearTimeout(timer);
      setIsSaving(false);
    };
  }, [tailwindContent, selectedId, activeFileId]);

  const highlightCode = (code: string) => {
    if (!code) return "";
    const escaped = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const regex = /(["'])(?:(?=(\\?))\2.)*?\1|\/\/.*$|\b(export|const|let|var|function|return|if|else|import|from|default|interface|type|await|async)\b|(&lt;[A-Z][a-zA-Z0-9]*|&lt;\/[A-Z][a-zA-Z0-9]*)|(&lt;[a-z][a-zA-Z0-9]*|&lt;\/[a-z][a-zA-Z0-9]*)|(\b[a-z][a-zA-Z0-9]*(?==))|({|})/gm;
    return escaped.replace(regex, (match, p1, p2, p3, p4, p5, p6, p7) => {
      if (p1) return `<span class="text-orange-300 font-medium">${match}</span>`;
      if (match.startsWith('//')) return `<span class="text-white/20 italic">${match}</span>`;
      if (p3) return `<span class="text-purple-400 font-bold">${match}</span>`;
      if (p4) return `<span class="text-blue-400 font-bold">${match}</span>`;
      if (p5) return `<span class="text-blue-300">${match}</span>`;
      if (p6) return `<span class="text-blue-200/60">${match}</span>`;
      if (p7) return `<span class="text-white/40">${match}</span>`;
      return match;
    });
  };

  const handleApplyInstanceProps = () => {
    if (!selectedId || activeFileId !== "instance-props") return;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(tailwindContent, "text/html");
      const elements = doc.querySelectorAll("[data-node-id]");

      if (elements.length === 0) throw new Error("No components with data-node-id found");

      const presentIds = new Set<string>();
      elements.forEach(el => {
        const id = el.getAttribute("data-node-id");
        if (id) presentIds.add(id);
      });

      const getSubtreeIds = (nodeId: string): string[] => {
        const node = nodes[nodeId];
        if (!node) return [];
        const childIds = node.data.nodes || [];
        return [nodeId, ...childIds.flatMap(id => getSubtreeIds(id))];
      };

      const originalSubtreeIds = getSubtreeIds(selectedId);
      originalSubtreeIds.forEach(nodeId => {
        if (nodeId !== selectedId && !presentIds.has(nodeId)) {
          actions.delete(nodeId);
        }
      });

      elements.forEach((el) => {
        const nodeId = el.getAttribute("data-node-id");
        if (!nodeId) return;

        const className = el.getAttribute("className") || el.getAttribute("class") || "";
        const src = el.getAttribute("src");
        const alt = el.getAttribute("alt");
        const label = el.getAttribute("label");
        const variant = el.getAttribute("variant");
        const link = el.getAttribute("link");

        let innerText: string | null = null;
        for (let i = 0; i < el.childNodes.length; i++) {
          const child = el.childNodes[i];
          if (child.nodeType === 3) {
            const text = child.textContent?.trim();
            if (text) { innerText = text; break; }
          }
        }

        actions.setProp(nodeId, (props: any) => {
          const latestNode = query.node(nodeId).get();
          if (!latestNode) return;
          let type = (latestNode.data.type as any).resolvedName || latestNode.data.displayName || "";
          props.customClassName = className;
          const isType = (t: string) => type.toLowerCase() === t.toLowerCase();

          if (src !== null && isType("Image")) props.src = src;
          if (alt !== null && isType("Image")) props.alt = alt;
          if (label !== null && isType("Button")) props.label = label;
          if (variant !== null && isType("Button")) props.variant = variant;
          if (link !== null && isType("Button")) props.link = link;

          if (innerText !== null) {
            if (isType("Text")) props.text = innerText;
            else if (isType("Button")) props.label = innerText;
          }

          const styleAttr = el.getAttribute("style");
          if (styleAttr) {
            try {
              const cleanStyle = styleAttr.replace(/^\{\{+/, "").replace(/\}\}+$/, "").trim();
              if (cleanStyle) {
                const pairs = cleanStyle.split(/,(?![^(]*\))/);
                pairs.forEach(pair => {
                  const [key, ...valParts] = pair.split(":");
                  if (key && valParts.length > 0) {
                    const k = key.trim();
                    let v: any = valParts.join(":").trim();
                    if (v.startsWith("'") && v.endsWith("'")) v = v.substring(1, v.length - 1);
                    else if (!isNaN(Number(v))) v = Number(v);
                    else if (v === "true") v = true;
                    else if (v === "false") v = false;
                    props[k] = v;
                  }
                });
              }
            } catch (err) { }
          }
        });
      });
      lastAppliedContentRef.current = tailwindContent; // Mark as applied
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setInstanceError("Failed to apply: Invalid format");
    }
  };

  const handleAddFile = () => {
    const fileType: FileType = "tsx";
    const templates = TEMPLATES as any;
    const templateContent = templates.component.tsx;
    const newFile: CodeFile = {
      id: `file-${Date.now()}`,
      name: `NewFile${files.length + 1}`,
      type: fileType,
      content: templateContent,
    };
    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
  };

  const handleDeleteFile = (id: string) => {
    if (files.length === 1) { alert("Cannot delete the last file"); return; }
    const filtered = files.filter((f) => f.id !== id);
    setFiles(filtered);
    if (activeFileId === id) setActiveFileId(filtered[0]?.id || "");
  };

  const handleCopyToClipboard = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

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

  if (!mounted) return null;

  return (
    <div className={`flex flex-col h-full bg-[#0F1116] border border-white/10 rounded-2xl overflow-hidden shadow-xl ${className}`}>
      <div className="flex-1 flex flex-col bg-[#0F1116] relative">
        <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-black/20 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
              <Package size={14} className="text-blue-400" />
            </div>
            <div className="flex flex-col">
              <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest leading-none mb-1 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">Editing Source</div>
              <div className="text-xs text-white/90 font-bold truncate flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                {activeFile?.name}.<span className="text-blue-400">{activeFile?.type}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/5 mr-2">
              <button onClick={handleCopyToClipboard} className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/40 hover:text-white group relative">
                {copySuccess ? <ClipboardCheck size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
              <button onClick={handleDownload} className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/40 hover:text-white">
                <Download size={16} />
              </button>
            </div>

            {activeFileId === "instance-props" && (
              <div className="flex items-center gap-3">
                {isSaving && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 animate-pulse">
                    <div className="w-1 h-1 rounded-full bg-blue-400" />
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Saving...</span>
                  </div>
                )}
                {!isSaving && saveSuccess && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
                    <Check size={10} className="text-green-400" />
                    <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Synced</span>
                  </div>
                )}
                <button
                  onClick={handleApplyInstanceProps}
                  disabled={!!instanceError || isSaving}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 ${saveSuccess ? "bg-green-500/20 text-green-400 border border-green-500/50" : instanceError ? "bg-red-500/20 text-red-400 border border-red-500/50 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
                >
                  {saveSuccess ? <Check size={14} /> : <Terminal size={14} />}
                  {saveSuccess ? "Applied" : "Sync Now"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 relative group overflow-hidden">
          <pre
            ref={highlightRef}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full p-6 font-mono text-sm pointer-events-none whitespace-pre-wrap break-all select-none no-scrollbar overflow-y-scroll"
            style={{ fontFamily: "'Fira Code', 'Courier New', monospace", backgroundColor: "#0a0d14", boxSizing: "border-box", lineHeight: "1.6", margin: 0, border: "1px solid transparent" }}
            dangerouslySetInnerHTML={{ __html: highlightCode(activeFile?.content || "") }}
          />
          <textarea
            ref={editorRef}
            value={activeFile?.content || ""}
            onChange={handleContentChange}
            onScroll={syncScroll}
            spellCheck={false}
            className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white p-6 font-mono text-sm resize-none focus:outline-none z-10 whitespace-pre-wrap break-all no-scrollbar overflow-y-scroll"
            style={{ fontFamily: "'Fira Code', 'Courier New', monospace", boxSizing: "border-box", lineHeight: "1.6", margin: 0, border: "1px solid transparent" }}
          />

          {instanceError && (
            <div className="absolute bottom-4 right-4 max-w-sm bg-red-500/10 border border-red-500/20 backdrop-blur-md p-3 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4">
              <div className="p-1 bg-red-500/20 rounded-lg">
                <AlertCircle size={14} className="text-red-400" />
              </div>
              <div className="flex-1 text-[10px] text-red-400 font-bold uppercase tracking-wider mb-0.5">Parse Error: {instanceError}</div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar for Files */}
      <div className="w-16 border-l border-white/5 bg-black/40 flex flex-col items-center py-4 gap-4">
        <button
          onClick={() => setActiveFileId("instance-props")}
          className={`p-2 rounded-xl transition-all ${activeFileId === "instance-props" ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-white/40 hover:text-white hover:bg-white/5"}`}
          title="Component Props"
        >
          <Layout size={20} />
        </button>
        <div className="w-8 h-px bg-white/5" />
        {files.map(file => (
          <button
            key={file.id}
            onClick={() => setActiveFileId(file.id)}
            className={`p-2 rounded-xl transition-all group relative ${activeFileId === file.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"}`}
            title={file.name}
          >
            <Files size={20} />
            {activeFileId === file.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-500 rounded-r-full" />}
          </button>
        ))}
        <button
          onClick={handleAddFile}
          className="p-2 rounded-xl text-white/20 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
          title="Add Asset"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
};

export default CodeEditor;
