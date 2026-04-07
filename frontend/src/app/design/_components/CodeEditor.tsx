"use client";

import React, { useState, useRef, useEffect } from "react";
import { useEditor } from "@craftjs/core";
import { useImportedComponents, parseImportedCode } from "../_context/ImportedComponentsContext";
import { FileType, CodeFile } from "../_types/schema";
import { autoSavePage } from "../_lib/pageApi";
import { getComponentDefaults, serializeCraftToClean } from "../_lib/serializer";
import { getStoredUser } from "@/lib/api";
import { SUBSCRIPTION_LIMITS } from "@/lib/subscriptionLimits";
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
    const highlighter = highlightRef.current;
    if (!editor || !highlighter) return;
    if (e.ctrlKey || e.metaKey) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    e.preventDefault();

    const maxTop = Math.max(0, editor.scrollHeight - editor.clientHeight);
    const maxLeft = Math.max(0, editor.scrollWidth - editor.clientWidth);

    let deltaY = e.deltaY;
    let deltaX = e.deltaX;
    if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
      deltaY *= 16;
      deltaX *= 16;
    } else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
      deltaY *= editor.clientHeight;
      deltaX *= editor.clientWidth;
    }

    const clampedDeltaY = Math.max(-240, Math.min(240, deltaY));
    const clampedDeltaX = Math.max(-240, Math.min(240, deltaX));

    if (smoothScrollRafRef.current === null) {
      smoothTargetTopRef.current = editor.scrollTop;
      smoothTargetLeftRef.current = editor.scrollLeft;
      smoothVelocityTopRef.current = 0;
      smoothVelocityLeftRef.current = 0;
    }

    smoothVelocityTopRef.current += clampedDeltaY;
    smoothVelocityLeftRef.current += clampedDeltaX;
    smoothTargetTopRef.current = Math.min(maxTop, Math.max(0, smoothTargetTopRef.current + clampedDeltaY));
    smoothTargetLeftRef.current = Math.min(maxLeft, Math.max(0, smoothTargetLeftRef.current + clampedDeltaX));

    if (smoothScrollRafRef.current !== null) return;

    const animate = () => {
      smoothVelocityTopRef.current *= 0.78;
      smoothVelocityLeftRef.current *= 0.78;

      const currentTop = editor.scrollTop;
      const currentLeft = editor.scrollLeft;
      const nextTargetTop = Math.min(maxTop, Math.max(0, smoothTargetTopRef.current + smoothVelocityTopRef.current * 0.08));
      const nextTargetLeft = Math.min(maxLeft, Math.max(0, smoothTargetLeftRef.current + smoothVelocityLeftRef.current * 0.08));

      smoothTargetTopRef.current = nextTargetTop;
      smoothTargetLeftRef.current = nextTargetLeft;

      const nextTop = currentTop + (nextTargetTop - currentTop) * 0.16;
      const nextLeft = currentLeft + (nextTargetLeft - currentLeft) * 0.16;

      editor.scrollTop = nextTop;
      editor.scrollLeft = nextLeft;
      highlighter.scrollTop = nextTop;
      highlighter.scrollLeft = nextLeft;
      if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = nextTop;

      const doneTop = Math.abs(nextTargetTop - nextTop) < 0.45 && Math.abs(smoothVelocityTopRef.current) < 0.25;
      const doneLeft = Math.abs(nextTargetLeft - nextLeft) < 0.45 && Math.abs(smoothVelocityLeftRef.current) < 0.25;

      if (doneTop && doneLeft) {
        editor.scrollTop = nextTargetTop;
        editor.scrollLeft = nextTargetLeft;
        highlighter.scrollTop = nextTargetTop;
        highlighter.scrollLeft = nextTargetLeft;
        if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = nextTargetTop;
        smoothVelocityTopRef.current = 0;
        smoothVelocityLeftRef.current = 0;
        smoothScrollRafRef.current = null;
        return;
      }

      smoothScrollRafRef.current = requestAnimationFrame(animate);
    };

    smoothScrollRafRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const el = codeAreaRef.current;
    if (!el) return;

    const update = () => setCodeAreaWidth(el.getBoundingClientRect().width);
    update();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted]);

  useEffect(() => {
    return () => {
      if (smoothScrollRafRef.current !== null) {
        cancelAnimationFrame(smoothScrollRafRef.current);
        smoothScrollRafRef.current = null;
      }
    };
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
    const isFocused = document.activeElement === editorRef.current || document.activeElement === importEditorRef.current;
    if (isFocused && activeFileId === "instance-props") return;

    if (selectedNode && (activeFileId === "instance-props" || !selectedId)) {
      const escapeForSingleQuotedAttr = (value: string) => {
        return value
          .replace(/&/g, "&amp;")
          .replace(/'/g, "&#39;");
      };

      const isDeepEqual = (a: unknown, b: unknown) => {
        if (a === b) return true;
        if (!a || !b) return false;
        if (typeof a !== "object" || typeof b !== "object") return false;
        try {
          return JSON.stringify(a) === JSON.stringify(b);
        } catch {
          return false;
        }
      };

      const buildNecessaryDataProps = (componentType: string, rawProps: Record<string, any>) => {
        const defaults = getComponentDefaults(componentType);
        const excluded = new Set([
          // Keep these explicit/editable in the JSX attrs/content instead.
          "customClassName",
          "text",
          "src",
          "alt",
          "label",
          "variant",
          "link",
        ]);

        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(rawProps)) {
          if (excluded.has(k)) continue;
          if (v === undefined || v === null) continue;
          if (typeof v === "function" || typeof v === "symbol") continue;
          if (k in defaults && (defaults as any)[k] === v) continue;
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
        if (!type || type === "undefined") {
          type = nodeId === 'ROOT' ? 'Page' : 'Component';
        }
        const indent = "  ".repeat(depth + 2);

        let content = "";
        let attributes = `data-node-id="${nodeId}"`;

        try {
          const necessary = buildNecessaryDataProps(type, p);
          if (Object.keys(necessary).length > 0) {
            const json = JSON.stringify(necessary);
            attributes += ` data-props='${escapeForSingleQuotedAttr(json)}'`;
          }
        } catch (_) {
          // Ignore non-serializable props (should be rare in Craft).
        }

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
        const newBody = `export default function Page() {
  return (
    <div className="w-full h-full bg-white">
      ${jsx}
    </div>
  );
}`;
        const defaultImports = `// React · Next.js · Tailwind · TypeScript — use Import Codes button to add presets
import React from 'react';

`;
        let content: string;
        if (tailwindContent && /^\s*(\/\/.*|\s*import\s+.+)/m.test(tailwindContent)) {
          const beforeExport = tailwindContent.replace(/\s*export\s+default\s+function\s+Page\s*\([^)]*\)\s*\{[\s\S]*$/m, "").trimEnd();
          content = beforeExport ? `${beforeExport}\n\n${newBody}` : defaultImports + newBody;
        } else {
          content = defaultImports + newBody;
        }
        setTailwindContent(content);
        lastAppliedContentRef.current = content;
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

  const parseInstanceContent = (content: string): { importBlock: string; componentBlock: string } => {
    const exportMatch = content.match(/\s*export\s+default\s+function\s+Page\s*\([^)]*\)\s*\{/);
    if (!exportMatch) {
      return {
        importBlock: content.trim() || "import React from 'react';",
        componentBlock: `export default function Page() {\n  return (\n    <div className="w-full h-full bg-white">\n    </div>\n  );\n}`,
      };
    }
    const idx = content.indexOf(exportMatch[0]);
    return {
      importBlock: content.slice(0, idx).trimEnd(),
      componentBlock: content.slice(idx).trimStart(),
    };
  };

  const displayedContent =
    activeFileId === "instance-props"
      ? parseInstanceContent(tailwindContent || "").componentBlock
      : (activeFile?.content || "");

  const lineCount = Math.max(1, displayedContent.split("\n").length);
  const lineDigits = String(lineCount).length;
  const showGutter = codeAreaWidth >= 360;
  const gutterWidth = showGutter
    ? `clamp(2.75rem, calc(${lineDigits}ch + 2.5rem), 4.75rem)`
    : "0px";
  const contentPaddingLeft = showGutter
    ? `clamp(4.5rem, calc(${lineDigits}ch + 4rem), 6rem)`
    : "1.5rem";

  const lineNumberText = (() => {
    const width = lineDigits;
    const lines: string[] = [];
    for (let i = 1; i <= lineCount; i++) {
      lines.push(String(i).padStart(width, " "));
    }
    return lines.join("\n");
  })();

  const handleImportChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (activeFileId !== "instance-props") return;
    const { componentBlock } = parseInstanceContent(tailwindContent);
    const full = (e.target.value.trim() ? e.target.value.trimEnd() + "\n\n" : "") + componentBlock;
    setTailwindContent(full);
    setInstanceError(componentBlock.includes('data-node-id="') ? null : "Missing data-node-id attributes");
  };

  const handleAddAsComponent = () => {
    const parsed = parseImportedCode(importCodePaste);
    if (!parsed) {
      setImportAddFeedback("error");
      setTimeout(() => setImportAddFeedback("idle"), 2000);
      return;
    }
    addItem({ name: parsed.name, css: parsed.css, html: parsed.html });
    setImportCodePaste("");
    setImportAddFeedback("success");
    setTimeout(() => setImportAddFeedback("idle"), 2000);
  };

  const handleInsertImportPreset = (code: string) => {
    if (activeFileId !== "instance-props") return;
    const { importBlock, componentBlock } = parseInstanceContent(tailwindContent);
    const current = (importBlock || "").trim();
    const sep = current && !current.endsWith("\n") ? "\n" : "";
    const merged = current ? current + sep + code.trim() : code.trim();
    setTailwindContent((merged ? merged + "\n\n" : "") + componentBlock);
    setTimeout(() => importEditorRef.current?.focus(), 50);
  };

  const handleComponentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newComponent = e.target.value;
    if (activeFileId === "instance-props") {
      const { importBlock } = parseInstanceContent(tailwindContent);
      const full = (importBlock ? importBlock + "\n\n" : "") + newComponent;
      setTailwindContent(full);
      if (!newComponent.includes('data-node-id="')) {
        setInstanceError("Missing data-node-id attributes");
      } else {
        setInstanceError(null);
      }
      const updated = files.map((f) =>
        f.id === activeFileId ? { ...f, content: newComponent } : f
      );
      setFiles(updated);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (activeFileId === "instance-props") return;
    const newContent = e.target.value;
    const updated = files.map((f) =>
      f.id === activeFileId ? { ...f, content: newContent } : f
    );
    setFiles(updated);
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

  /** Extract only the JSX part (return (...) ) — prefers Page component when multiple returns exist. */
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
    const lines = source.split("\n");
    let start = -1, depth = 0, end = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/return\s*\(/.test(line)) {
        start = i;
        depth = (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
        if (depth <= 0) { end = i; break; }
        continue;
      }
      if (start >= 0 && depth > 0) {
        depth += (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
        if (depth <= 0) { end = i; break; }
      }
    }
    if (start >= 0 && end >= 0) {
      const slice = lines.slice(start, end + 1).join("\n");
      const m = slice.match(/return\s*\(\s*([\s\S]*)\s*\)\s*;?/);
      return m ? m[1].trim() : slice;
    }
    return source;
  };

  /** Auto-detect and repair common invalid formats (extra braces, malformed style). */
  const normalizeAndRepairJSX = (jsx: string): string => {
    let s = jsx;
    s = s.replace(/style=\{\{\{\{/g, "style={{");
    s = s.replace(/style=\{\{\{/g, "style={{");
    s = s.replace(/\}\}+(\s*\/?>)/g, "}}$1");
    s = s.replace(/(\w+):\s*'(\d+(?:px|em|rem|%|vh|vw)?)'/g, "$1: '$2'");
    return s;
  };

  const handleApplyInstanceProps = () => {
    if (!selectedId || activeFileId !== "instance-props") return;
    try {
      let jsxOnly = extractJSXFromSource(tailwindContent);
      jsxOnly = normalizeAndRepairJSX(jsxOnly);
      const parser = new DOMParser();
      let doc = parser.parseFromString(jsxOnly, "text/html");
      let elements = doc.querySelectorAll("[data-node-id]");

      if (elements.length === 0) {
        const repaired = jsxOnly
          .replace(/\}\}+/g, "}}")
          .replace(/\{\{\{+/g, "{{")
          .replace(/,\s*}/g, "}");
        doc = parser.parseFromString(repaired, "text/html");
        elements = doc.querySelectorAll("[data-node-id]");
      }
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

        const className = el.getAttribute("className") ?? el.getAttribute("class");
        const src = el.getAttribute("src");
        const alt = el.getAttribute("alt");
        const label = el.getAttribute("label");
        const variant = el.getAttribute("variant");
        const link = el.getAttribute("link");
        const dataPropsRaw = el.getAttribute("data-props");
        let dataProps: Record<string, unknown> | null = null;
        if (dataPropsRaw) {
          try {
            dataProps = JSON.parse(dataPropsRaw) as Record<string, unknown>;
          } catch (_) {
            dataProps = null;
          }
        }

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

          if (dataProps) {
            for (const [k, v] of Object.entries(dataProps)) {
              props[k] = v;
            }
          }

          if (className !== null) props.customClassName = className;
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
              let cleanStyle = styleAttr.replace(/^\{\{+/, "").replace(/\}\}+$/, "").trim();
              cleanStyle = cleanStyle.replace(/;\s*/g, ",");
              if (cleanStyle) {
                const pairs = cleanStyle.split(/,(?![^(]*\))/);
                pairs.forEach(pair => {
                  const colonIdx = pair.indexOf(":");
                  if (colonIdx <= 0) return;
                  const k = pair.slice(0, colonIdx).trim();
                  let v: any = pair.slice(colonIdx + 1).trim();
                  v = v.replace(/^["']|["']$/g, "");
                  if (!isNaN(Number(v))) v = Number(v);
                  else if (v === "true") v = true;
                  else if (v === "false") v = false;
                  props[k] = v;
                });
              }
            } catch (err) { }
          }
        });
      });
      lastAppliedContentRef.current = tailwindContent; // Mark as applied
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);

      // Persist to database and sessionStorage after Craft state has committed
      const runSave = () => {
        try {
          const raw = query.serialize();
          const parsed = JSON.parse(raw);
          if (!parsed?.ROOT) return;
          const cleanCode = serializeCraftToClean(raw, files);
          const snapshot = JSON.stringify(cleanCode);
          const STORAGE_KEY_PREFIX = "craftjs_preview_json";
          if (projectId && typeof window !== "undefined" && window.sessionStorage) {
            try {
              window.sessionStorage.setItem(`${STORAGE_KEY_PREFIX}_${projectId}`, snapshot);
            } catch (_) { }
          }
          autoSavePage(snapshot, projectId).then((result) => {
            if (!result.success) console.warn("Code sync: DB save failed", result.error);
          });
        } catch (e) {
          console.warn("Code sync: serialize/save failed", e);
        }
      };
      setTimeout(runSave, 0);
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
    <div data-theme="dark" className={`flex flex-col h-full bg-[#0F1116] border border-transparent rounded-2xl overflow-hidden shadow-xl ${className}`} style={{ colorScheme: 'dark' }}>
      <div className="flex-1 flex flex-col bg-[#0F1116] relative">
        <div className="min-h-[64px] border-b border-transparent flex items-center justify-between gap-3 px-4 py-2.5 bg-black/20 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
            <div className="p-1.5 bg-white/5 rounded-lg border border-transparent shrink-0">
              <Package size={14} className="text-blue-400" />
            </div>
            <div className="flex flex-col min-w-0 gap-0.5">
              <div className="text-[10px] text-blue-400/90 font-semibold uppercase tracking-wider leading-none">Editing Source</div>
              <div className="text-xs text-white/90 font-semibold min-w-0 truncate whitespace-nowrap">
                {activeFile ? `${activeFile.name}.${activeFile.type}` : "Untitled.tsx"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-black/35 p-1 rounded-xl border border-transparent">
              {activeFileId === "instance-props" && canImport && (
                <button
                  onClick={() => {
                    setShowImportPaste((v) => !v);
                    if (!showImportPaste) setTimeout(() => importEditorRef.current?.focus(), 50);
                  }}
                  className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${showImportPaste ? "bg-amber-500/20 text-amber-400" : "hover:bg-white/10 text-white/40 hover:text-white"}`}
                  title="Import codes"
                >
                  <Code2 size={14} />
                  Import Codes
                </button>
              )}
              <button onClick={handleCopyToClipboard} className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/40 hover:text-white group relative">
                {copySuccess ? <ClipboardCheck size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
              <button onClick={handleDownload} className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/40 hover:text-white">
                <Download size={16} />
              </button>
            </div>

            {activeFileId === "instance-props" && (
              <div className="flex items-center gap-2">
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
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-w-[112px] shadow-lg shadow-blue-500/20 active:scale-95 ${saveSuccess ? "bg-green-500/20 text-green-400 border border-green-500/50" : instanceError ? "bg-red-500/20 text-red-400 border border-red-500/50 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
                >
                  {saveSuccess ? <Check size={14} /> : <Terminal size={14} />}
                  {saveSuccess ? "Applied" : "Sync Now"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div data-code-editor-scroll="true" className="flex-1 min-h-0 relative group overflow-hidden flex flex-col">
          {activeFileId === "instance-props" && showImportPaste && canImport && (
            <div className="shrink-0 border-b border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center justify-between px-4 py-2 border-b border-transparent">
                <span className="text-[10px] text-amber-400/90 font-bold uppercase tracking-wider">React · Next.js · Tailwind · TypeScript · CSS · HTML</span>
                <button
                  onClick={() => setShowImportPaste(false)}
                  className="text-[10px] text-white/50 hover:text-white font-bold uppercase"
                >
                  Close
                </button>
              </div>
              <p className="text-[10px] text-white/50 px-4 py-1.5 bg-black/20 border-b border-transparent">
                Imports are for exported code only — they do not show on the canvas. <strong className="text-amber-400/80">Add as Component</strong> below to turn React+styled-components into a draggable block in the Components panel.
              </p>
              <div className="flex flex-wrap gap-1.5 px-3 pt-2 pb-1 border-b border-transparent">
                {IMPORT_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleInsertImportPreset(preset.code)}
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
                    onClick={handleAddAsComponent}
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
                  onChange={(e) => setImportCodePaste(e.target.value)}
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
                onChange={handleImportChange}
                spellCheck={false}
                placeholder="import React from 'react';&#10;import './styles.css';&#10;// Paste JS, CSS, or HTML imports"
                className="w-full resize-none bg-black/20 text-white/90 font-mono text-xs p-4 focus:outline-none placeholder:text-white/20 min-h-[80px] custom-scrollbar border-0 focus:ring-0"
                style={{ fontFamily: "'Fira Code', 'Courier New', monospace", lineHeight: "1.6" }}
                rows={4}
              />
            </div>
          )}
          <div ref={codeAreaRef} className="flex-1 min-h-0 relative">
            {showGutter && (
              <pre
                ref={lineNumbersRef}
                aria-hidden="true"
                data-code-editor-scroll="true"
                className="absolute inset-y-0 left-0 py-6 pl-6 pr-3 font-mono text-sm pointer-events-none select-none overflow-y-auto overflow-x-hidden z-20"
                style={{ width: gutterWidth, fontFamily: "'Fira Code', 'Courier New', monospace", backgroundColor: "#0a0d14", boxSizing: "border-box", lineHeight: "1.6", margin: 0, color: "rgba(255,255,255,0.22)", scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {lineNumberText}
              </pre>
            )}
            <pre
              ref={highlightRef}
              aria-hidden="true"
              data-code-editor-scroll="true"
              className="custom-scrollbar absolute inset-0 w-full h-full py-6 pr-6 font-mono text-sm pointer-events-none whitespace-pre-wrap break-words select-none overflow-y-auto overflow-x-hidden z-10"
              style={{ paddingLeft: contentPaddingLeft, fontFamily: "'Fira Code', 'Courier New', monospace", backgroundColor: "#0a0d14", boxSizing: "border-box", lineHeight: "1.6", margin: 0, border: "1px solid transparent" }}
              dangerouslySetInnerHTML={{ __html: highlightCode(displayedContent) }}
            />
            <textarea
              ref={editorRef}
              value={displayedContent}
              onChange={activeFileId === "instance-props" ? handleComponentChange : handleContentChange}
              onScroll={syncScroll}
              onWheel={handleEditorWheel}
              data-code-editor-scroll="true"
              spellCheck={false}
              className="custom-scrollbar absolute inset-0 w-full h-full bg-transparent text-transparent caret-white py-6 pr-6 font-mono text-sm resize-none focus:outline-none z-30 whitespace-pre-wrap break-words overflow-y-auto overflow-x-hidden"
              style={{ paddingLeft: contentPaddingLeft, fontFamily: "'Fira Code', 'Courier New', monospace", boxSizing: "border-box", lineHeight: "1.6", margin: 0, border: "1px solid transparent", scrollBehavior: "smooth" }}
            />
          </div>

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

    </div>
  );
};

export default CodeEditor;
