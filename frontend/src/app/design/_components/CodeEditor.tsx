"use client";

import React, { useState, useRef, useEffect } from "react";
import { useEditor } from "@craftjs/core";
import { useImportedComponents, parseImportedCode } from "../_context/ImportedComponentsContext";
import { FileType, CodeFile } from "../_types/schema";
import { autoSavePage } from "../_lib/pageApi";
import { getComponentDefaults, serializeCraftToClean } from "../_lib/serializer";
import { getStoredUser } from "@/lib/api";
import {
  Code2,
  Copy,
  Download,
  Terminal,
  Package,
  Check,
  ClipboardCheck,
  AlertCircle
} from "lucide-react";

interface CodeEditorProps {
  mode: "design" | "component" | "page";
  projectId: string;
  className?: string;
  files?: CodeFile[];
  onFilesChange?: (files: CodeFile[]) => void;
}

const IMPORT_PRESETS: { label: string; code: string }[] = [
  { label: "React", code: "import React from 'react';\n" },
  { label: "Next.js", code: "import Image from 'next/image';\nimport Link from 'next/link';\n" },
  { label: "Tailwind", code: "// Tailwind classes work via className\n// import 'tailwindcss/tailwind.css';\n" },
  { label: "Lucide Icons", code: "import { ChevronDown, Menu, X } from 'lucide-react';\n" },
  { label: "shadcn/ui", code: "import { Button } from '@/components/ui/button';\nimport { Input } from '@/components/ui/input';\n" },
  { label: "TypeScript", code: "import type { FC } from 'react';\n" },
  { label: "CSS", code: "import './styles.css';\n// or: import styles from './Component.module.css';\n" },
  { label: "HTML", code: "// Paste HTML below — use className in component, or dangerouslySetInnerHTML\n// <div class=\"container\">...</div> → <div className=\"container\">...</div>\n" },
];

const TEMPLATES = {
  component: {
    tsx: `import React from 'react';

interface ComponentProps {
  className?: string;
}

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
    ts: `export interface ThemeConfig {
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
`,
  },
  asset: {
    tsx: `import React from 'react';

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
    css: `/* Custom scrollbar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
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
    const id = Array.isArray(sel) ? sel[0] : (sel instanceof Set ? Array.from(sel)[0] : null);
    return {
      selectedId: id,
      selectedNode: id ? state.nodes[id] : null,
      nodes: state.nodes
    };
  });

  const [localFiles, setLocalFiles] = useState<CodeFile[]>(propFiles || []);
  const files = propFiles || localFiles;
  const setFiles = onFilesChange || setLocalFiles;

  const user = getStoredUser();
  const plan = (user?.subscriptionPlan || 'free').toLowerCase();
  const canImport = plan === 'pro' || plan === 'custom';

  const [activeFileId, setActiveFileId] = useState("instance-props");
  const [tailwindContent, setTailwindContent] = useState("");
  const [instanceError, setInstanceError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showImportPaste, setShowImportPaste] = useState(false);
  const [importCodePaste, setImportCodePaste] = useState("");
  const [importAddFeedback, setImportAddFeedback] = useState<"idle" | "success" | "error">("idle");
  const { addItem } = useImportedComponents();
  const [mounted, setMounted] = useState(false);
  const codeAreaRef = useRef<HTMLDivElement>(null);
  const [codeAreaWidth, setCodeAreaWidth] = useState(0);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const importEditorRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLPreElement>(null);
  const lastAppliedContentRef = useRef<string>("");
  const smoothScrollRafRef = useRef<number | null>(null);
  const smoothTargetTopRef = useRef(0);
  const smoothTargetLeftRef = useRef(0);
  const smoothVelocityTopRef = useRef(0);
  const smoothVelocityLeftRef = useRef(0);

  const syncScroll = () => {
    if (editorRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = editorRef.current.scrollTop;
      highlightRef.current.scrollLeft = editorRef.current.scrollLeft;
    }
    if (editorRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = editorRef.current.scrollTop;
    }
  };

  const handleEditorWheel = (e: React.WheelEvent<HTMLTextAreaElement>) => {
    const editor = editorRef.current;
    if (!editor) return;
    if (e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    editor.scrollTop += e.deltaY;
    editor.scrollLeft += e.deltaX;
    syncScroll();
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const el = codeAreaRef.current;
    if (!el) return;
    const update = () => setCodeAreaWidth(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted]);

  useEffect(() => {
    if (propFiles && propFiles.length > 0) return;
    if (files.length === 0) {
      const templates = TEMPLATES as any;
      const defaultFileContent = templates[mode]?.tsx || templates.component.tsx;
      setFiles([{ id: "MyComponent.tsx", name: "MyComponent", type: "tsx", content: defaultFileContent }]);
    }
  }, [mode, propFiles]);

  useEffect(() => {
    const isFocused = document.activeElement === editorRef.current || document.activeElement === importEditorRef.current;
    if (isFocused && activeFileId === "instance-props") return;

    if (selectedNode && (activeFileId === "instance-props" || !selectedId)) {
      const escapeAttr = (v: string) => v.replace(/&/g, "&amp;").replace(/'/g, "&#39;");
      const isDeepEqual = (a: any, b: any) => {
        if (a === b) return true;
        try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
      };

      const buildDataProps = (type: string, props: Record<string, any>) => {
        const defaults = getComponentDefaults(type);
        const excluded = new Set(["customClassName", "text", "src", "alt", "label", "variant", "link"]);
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(props)) {
          if (excluded.has(k) || v === undefined || v === null || typeof v === "function") continue;
          if (k in defaults && isDeepEqual((defaults as any)[k], v)) continue;
          out[k] = v;
        }
        return out;
      };

      const generateJSX = (nodeId: string, depth = 0): string => {
        const node = (nodes as any)[nodeId];
        if (!node) return "";
        const p = (node.data.props ?? {}) as Record<string, any>;
        let type = (node.data.type as any).resolvedName || node.data.displayName;
        if (!type || type === "undefined") type = nodeId === 'ROOT' ? 'Page' : 'Component';
        const indent = "  ".repeat(depth + 2);

        let attrs = `data-node-id="${nodeId}"`;
        const dataProps = buildDataProps(type, p);
        if (Object.keys(dataProps).length > 0) attrs += ` data-props='${escapeAttr(JSON.stringify(dataProps))}'`;
        if (p.customClassName) attrs += ` className="${p.customClassName}"`;
        
        if (type === "Button") {
          if (p.label) attrs += ` label="${p.label}"`;
          if (p.variant) attrs += ` variant="${p.variant}"`;
          if (p.link) attrs += ` link="${p.link}"`;
        } else if (type === "Image") {
          if (p.src) attrs += ` src="${p.src}"`;
          if (p.alt) attrs += ` alt="${p.alt}"`;
        }

        let content = "";
        if (type === "Text") {
          content = p.text || "";
        } else if (node.data.nodes && node.data.nodes.length > 0) {
          content = "\n" + node.data.nodes.map((childId: string) => generateJSX(childId, depth + 1)).join("") + indent;
        }

        const isSelfClosing = (type === "Image" || type === "Input") || (type !== "Text" && content === "");
        if (isSelfClosing) return `${indent}<${type} ${attrs} />\n`;
        return `${indent}<${type} ${attrs}>${content}</${type}>\n`;
      };

      if (selectedId) {
        const jsx = generateJSX(selectedId).trim();
        const content = `import React from 'react';\n\nexport default function Page() {\n  return (\n    <div className="w-full h-full bg-white">\n      ${jsx}\n    </div>\n  );\n}`;
        setTailwindContent(content);
        lastAppliedContentRef.current = content;
      }
    }
  }, [selectedId, activeFileId, nodes]);

  const activeFile = activeFileId === "instance-props" 
    ? { id: "instance-props", name: selectedNode?.data.displayName || "Component", type: "tsx" as FileType, content: tailwindContent }
    : files.find((f) => f.id === activeFileId);

  const parseInstanceContent = (content: string) => {
    const exportMatch = content.match(/\s*export\s+default\s+function\s+Page\s*\([^)]*\)\s*\{/);
    if (!exportMatch) return { importBlock: content.trim(), componentBlock: "" };
    const idx = content.indexOf(exportMatch[0]);
    return { importBlock: content.slice(0, idx).trimEnd(), componentBlock: content.slice(idx).trimStart() };
  };

  const displayedContent = activeFileId === "instance-props" ? parseInstanceContent(tailwindContent || "").componentBlock : (activeFile?.content || "");
  const lineCount = Math.max(1, displayedContent.split("\n").length);
  const showGutter = codeAreaWidth >= 360;
  const gutterWidth = showGutter ? `clamp(2.75rem, calc(${String(lineCount).length}ch + 2.5rem), 4.75rem)` : "0px";
  const contentPaddingLeft = showGutter ? `clamp(4.5rem, calc(${String(lineCount).length}ch + 4rem), 6rem)` : "1.5rem";

  const highlightCode = (code: string) => {
    if (!code) return "";
    const escaped = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return escaped.replace(/(["'])(?:(?=(\\?))\2.)*?\1|\/\/.*$|\b(export|const|let|var|function|return|if|else|import|from|default|interface|type|await|async)\b|(&lt;[A-Z][a-zA-Z0-9]*|&lt;\/[A-Z][a-zA-Z0-9]*)|(&lt;[a-z][a-zA-Z0-9]*|&lt;\/[a-z][a-zA-Z0-9]*)|(\b[a-z][a-zA-Z0-9]*(?==))|({|})/gm, (match, p1, p2, p3, p4, p5, p6, p7) => {
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

  const extractJSXFromSource = (source: string): string => {
    const pageIdx = source.indexOf("export default function Page");
    if (pageIdx >= 0) {
      const afterPage = source.slice(pageIdx);
      const openBrace = afterPage.indexOf("{");
      if (openBrace >= 0) {
        const body = afterPage.slice(openBrace + 1);
        const returnIdx = body.indexOf("return (");
        if (returnIdx >= 0) {
          const afterReturn = body.slice(returnIdx + 8);
          let depth = 1, pos = 0;
          for (let i = 0; i < afterReturn.length; i++) {
            if (afterReturn[i] === "(") depth++;
            else if (afterReturn[i] === ")") { depth--; if (depth === 0) { pos = i; break; } }
          }
          if (depth === 0) return afterReturn.slice(0, pos).trim();
        }
      }
    }
    return source;
  };

  const handleApplyInstanceProps = () => {
    if (!selectedId || activeFileId !== "instance-props") return;
    try {
      let jsxOnly = extractJSXFromSource(tailwindContent);
      const parser = new DOMParser();
      const doc = parser.parseFromString(jsxOnly, "text/html");
      const elements = doc.querySelectorAll("[data-node-id]");

      if (elements.length === 0) throw new Error("No components with data-node-id found");

      elements.forEach((el) => {
        const nodeId = el.getAttribute("data-node-id");
        if (!nodeId) return;

        actions.setProp(nodeId, (props: any) => {
          const className = el.getAttribute("className") ?? el.getAttribute("class");
          if (className !== null) props.customClassName = className;
          
          const rawProps = el.getAttribute("data-props");
          if (rawProps) {
            try {
              const parsed = JSON.parse(rawProps);
              Object.assign(props, parsed);
            } catch (_) {}
          }

          // Handle simple inner text for specific components
          const text = el.textContent?.trim();
          if (text) {
             const node = query.node(nodeId).get();
             const type = (node?.data.type as any).resolvedName || node?.data.displayName;
             if (type === "Text") props.text = text;
             else if (type === "Button") props.label = text;
          }
        });
      });

      lastAppliedContentRef.current = tailwindContent;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      
      // Auto-save
      const raw = query.serialize();
      autoSavePage(raw, projectId);
    } catch (err) {
      setInstanceError("Failed to apply: " + (err as Error).message);
    }
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
    element.click();
  };

  if (!mounted) return null;

  return (
    <div data-theme="dark" className={`flex flex-col h-full bg-[#0F1116] border border-transparent rounded-2xl overflow-hidden shadow-xl ${className}`} style={{ colorScheme: 'dark' }}>
      <div className="flex-1 flex flex-col bg-[#0F1116] relative">
        <div className={`min-h-[64px] border-b border-white/5 flex items-center justify-between border-transparent bg-black/20 backdrop-blur-md sticky top-0 z-20 ${codeAreaWidth > 300 ? "px-4 gap-3" : "px-1.5 gap-1"}`}>
          <div className="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0">
            {codeAreaWidth > 280 && (
              <div className="p-1.5 bg-white/5 rounded-lg border border-white/5 shrink-0 flex items-center justify-center">
                <Package size={14} className="text-blue-400" />
              </div>
            )}
            <div className={`flex flex-col min-w-0 gap-0.5 ${codeAreaWidth < 280 ? "hidden" : "flex"}`}>
              {codeAreaWidth > 450 && <div className="text-[10px] text-blue-400/90 font-semibold uppercase tracking-wider leading-none">Editing Source</div>}
              <div className={`text-xs text-white/90 font-semibold truncate whitespace-nowrap ${codeAreaWidth < 350 ? "max-w-[80px]" : "min-w-0"}`}>
                {activeFile ? `${activeFile.name}.${activeFile.type}` : "Untitled.tsx"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center bg-black/35 p-0.5 rounded-xl border border-white/5">
              <button onClick={handleCopyToClipboard} className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/40 hover:text-white" title="Copy code">
                {copySuccess ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
              <button onClick={handleDownload} className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/40 hover:text-white" title="Download file">
                <Download size={16} />
              </button>
            </div>

            {/* Imports toggle placed next to copy/download */}
            <button
              onClick={() => setShowImportPaste(s => !s)}
              title={"Import Code"}
              className={`p-2 hover:bg-white/10 rounded-lg transition-all text-white/40 hover:text-white ${showImportPaste ? 'bg-amber-500/10 text-amber-300' : ''}`}
            >
              <Code2 size={16} />
            </button>

            {activeFileId === "instance-props" && (
              <button
                onClick={handleApplyInstanceProps}
                disabled={!!instanceError || isSaving}
                className={`rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 ${codeAreaWidth > 380 ? "min-w-[112px] px-3 py-2" : "min-w-[34px] w-8.5 h-8.5 p-0"} ${saveSuccess ? "bg-green-500/20 text-green-400 border border-green-500/50" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
              >
                {saveSuccess ? <Check size={14} /> : <Terminal size={14} />}
                {codeAreaWidth > 380 && (saveSuccess ? "Applied" : "Sync Now")}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 relative group overflow-hidden flex flex-col">
          {activeFileId === "instance-props" && showImportPaste && canImport && (
            <div className="shrink-0 border-b border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center justify-between px-4 py-2 border-b border-transparent">
                <span className="text-[10px] text-amber-400/90 font-bold uppercase tracking-wider">React · Next.js · Tailwind · TypeScript · CSS · HTML</span>
              </div>
              <p className="text-[10px] text-white/50 px-4 py-1.5 bg-black/20 border-b border-transparent">
                Imports are for exported code only — they do not show on the canvas. <strong className="text-amber-400/80">Add as Component</strong> below to turn React+styled-components into a draggable block in the Components panel.
              </p>
              <div className="flex flex-wrap gap-1.5 px-3 pt-2 pb-1 border-b border-transparent">
                {IMPORT_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                       const { importBlock, componentBlock } = parseInstanceContent(tailwindContent);
                       const current = (importBlock || "").trim();
                       const sep = current && !current.endsWith("\n") ? "\n" : "";
                       const merged = current ? current + sep + preset.code.trim() : preset.code.trim();
                       setTailwindContent((merged ? merged + "\n\n" : "") + componentBlock);
                       setTimeout(() => importEditorRef.current?.focus(), 50);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/5 hover:bg-amber-500/20 text-white/70 hover:text-amber-300 border border-transparent hover:border-amber-500/30 transition-colors"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
              <div className="px-4 py-3 border-b border-amber-500/20 bg-emerald-500/5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Add as Component</span>
                  <button
                    type="button"
                    onClick={() => {
                        const parsed = parseImportedCode(importCodePaste);
                        if (parsed) {
                            addItem({ name: parsed.name, css: parsed.css, html: parsed.html });
                            setImportCodePaste("");
                            setImportAddFeedback("success");
                            setTimeout(() => setImportAddFeedback("idle"), 2000);
                        } else {
                            setImportAddFeedback("error");
                            setTimeout(() => setImportAddFeedback("idle"), 2000);
                        }
                    }}
                    disabled={!importCodePaste.trim()}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${importAddFeedback === "success"
                      ? "bg-emerald-500/30 text-emerald-400 border border-emerald-500/50"
                      : importAddFeedback === "error"
                        ? "bg-red-500/20 text-red-400 border border-red-500/50"
                        : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      }`}
                  >
                    {importAddFeedback === "success" ? <Check size={12} /> : null}
                    {importAddFeedback === "success" ? "Added" : importAddFeedback === "error" ? "Invalid" : "Add as Component"}
                  </button>
                </div>
                <textarea
                  value={importCodePaste}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setImportCodePaste(e.target.value)}
                  spellCheck={false}
                  placeholder="Paste React + styled-components code (e.g. Loader)..."
                  className="w-full resize-none bg-black/30 text-white/90 font-mono text-[11px] p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500/50 placeholder:text-white/20 min-h-[60px] border border-transparent"
                  style={{ fontFamily: "'Fira Code', monospace" }}
                  rows={3}
                />
              </div>
              <textarea
                ref={importEditorRef}
                value={parseInstanceContent(tailwindContent || "").importBlock}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    const { componentBlock } = parseInstanceContent(tailwindContent);
                    const full = (e.target.value.trim() ? e.target.value.trimEnd() + "\n\n" : "") + componentBlock;
                    setTailwindContent(full);
                }}
                spellCheck={false}
                placeholder="import React from 'react';&#10;// Paste JS, CSS, or HTML imports"
                className="w-full resize-none bg-black/20 text-white/90 font-mono text-xs p-4 focus:outline-none placeholder:text-white/20 min-h-[80px] custom-scrollbar border-0 focus:ring-0"
                style={{ fontFamily: "'Fira Code', monospace", lineHeight: "1.6" }}
                rows={4}
              />
            </div>
          )}
          <div ref={codeAreaRef} className="flex-1 min-h-0 relative">
            {showGutter && (
              <pre ref={lineNumbersRef} className="absolute inset-y-0 left-0 py-6 pl-6 pr-3 font-mono text-sm pointer-events-none select-none overflow-y-auto overflow-x-hidden z-20" style={{ width: gutterWidth, fontFamily: "'Fira Code', monospace", backgroundColor: "#0a0d14", lineHeight: "1.6", margin: 0, color: "rgba(255,255,255,0.22)", scrollbarWidth: "none" }}>
                {Array.from({ length: lineCount }, (_, i) => String(i + 1).padStart(String(lineCount).length, " ")).join("\n")}
              </pre>
            )}
            <pre ref={highlightRef} className="custom-scrollbar absolute inset-0 w-full h-full py-6 pr-6 font-mono text-sm pointer-events-none whitespace-pre-wrap break-words select-none overflow-y-auto overflow-x-hidden z-10" style={{ paddingLeft: contentPaddingLeft, fontFamily: "'Fira Code', monospace", backgroundColor: "#0a0d14", lineHeight: "1.6", margin: 0 }} dangerouslySetInnerHTML={{ __html: highlightCode(displayedContent) }} />
            <textarea
              ref={editorRef}
              value={displayedContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                if (activeFileId === "instance-props") {
                  setTailwindContent(e.target.value);
                } else {
                  setFiles(files.map(f => f.id === activeFileId ? { ...f, content: e.target.value } : f));
                }
              }}
              onScroll={syncScroll}
              onWheel={handleEditorWheel}
              spellCheck={false}
              className="custom-scrollbar absolute inset-0 w-full h-full bg-transparent text-transparent caret-white py-6 pr-6 font-mono text-sm resize-none focus:outline-none z-30 whitespace-pre-wrap break-words overflow-y-auto overflow-x-hidden"
              style={{ paddingLeft: contentPaddingLeft, fontFamily: "'Fira Code', monospace", lineHeight: "1.6", margin: 0 }}
            />
          </div>
          {instanceError && (
            <div className="absolute bottom-4 right-4 max-w-sm bg-red-500/10 border border-red-500/20 backdrop-blur-md p-3 rounded-xl flex items-start gap-3">
              <AlertCircle size={14} className="text-red-400 mt-0.5" />
              <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Error: {instanceError}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
