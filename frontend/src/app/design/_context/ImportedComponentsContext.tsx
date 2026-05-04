"use client";

import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

export type ImportedComponentItem = {
  id: string;
  name: string;
  css: string;
  html: string;
};

type ImportedComponentsContextType = {
  items: ImportedComponentItem[];
  addItem: (item: Omit<ImportedComponentItem, "id">) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
};

const STORAGE_KEY = "design_imported_components";

const loadFromStorage = (): ImportedComponentItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveToStorage = (items: ImportedComponentItem[]) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
};

const ImportedComponentsContext = createContext<ImportedComponentsContextType | null>(null);

export function ImportedComponentsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ImportedComponentItem[]>(loadFromStorage);

  const addItem = useCallback((item: Omit<ImportedComponentItem, "id">) => {
    const id = `imported-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newItem = { ...item, id };
    setItems((prev) => {
      const next = [newItem, ...prev];
      saveToStorage(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveToStorage(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    saveToStorage([]);
  }, []);

  const value = useMemo(
    () => ({ items, addItem, removeItem, clearAll }),
    [items, addItem, removeItem, clearAll]
  );

  return (
    <ImportedComponentsContext.Provider value={value}>
      {children}
    </ImportedComponentsContext.Provider>
  );
}

export function useImportedComponents() {
  const ctx = useContext(ImportedComponentsContext);
  if (!ctx) throw new Error("useImportedComponents must be used within ImportedComponentsProvider");
  return ctx;
}

/**
 * Parse pasted code (React + styled-components) to extract name, CSS, and HTML.
 * Supports: const X = () => { return (<...>); }; export default X;
 */
export function parseImportedCode(code: string): { name: string; css: string; html: string } | null {
  const trimmed = code.trim();
  if (!trimmed) return null;

  let name = "Imported";
  const nameMatch = trimmed.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|\(\))\s*=>/);
  if (nameMatch) name = nameMatch[1];
  else {
    const exportMatch = trimmed.match(/export\s+default\s+(\w+)/);
    if (exportMatch) name = exportMatch[1];
  }

  // Extract all styled.xxx`...` blocks (supports multiple styled components)
  let css = "";
  const styledRegex = /styled\.\w+`([\s\S]*?)`/g;
  let m;
  const cssParts: string[] = [];
  while ((m = styledRegex.exec(trimmed)) !== null) {
    const block = m[1]
      .replace(/\$\{[^}]*\}/g, "")
      .replace(/\\`/g, "`")
      .trim();
    if (block) cssParts.push(block);
  }
  if (cssParts.length > 0) css = cssParts.join("\n\n");

  let html = "";
  // Extract JSX from return ( ... );
  const returnIdx = trimmed.search(/return\s*\(/);
  if (returnIdx >= 0) {
    let depth = 0;
    let start = -1;
    for (let i = returnIdx; i < trimmed.length; i++) {
      const c = trimmed[i];
      if (c === "(") {
        if (depth === 0) start = i + 1;
        depth++;
      } else if (c === ")") {
        depth--;
        if (depth === 0) {
          let jsx = trimmed.slice(start, i).trim();
          // Convert JSX to HTML
          jsx = jsx
            .replace(/\sclassName=/gi, " class=")
            .replace(/<StyledWrapper>/gi, "<div>")
            .replace(/<\/StyledWrapper>/gi, "</div>");
          // Replace any Styled* with div
          jsx = jsx.replace(/<\/?Styled\w+>/gi, (tag) => (tag.startsWith("</") ? "</div>" : "<div>"));
          // Self-closing: <X /> -> <x></x> for HTML parser
          jsx = jsx.replace(/<(\w+)(\s[^>]*)\s*\/>/g, "<$1$2></$1>");
          const parser = new DOMParser();
          const doc = parser.parseFromString(`<div>${jsx}</div>`, "text/html");
          const inner = doc.body.firstElementChild;
          html = inner ? inner.innerHTML : jsx;
          break;
        }
      }
    }
  }

  if (!html && !css) return null;
  if (!html) html = "<div>Content</div>";

  return { name, css, html };
}
