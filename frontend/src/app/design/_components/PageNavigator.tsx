"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  Plus,
  Trash2,
  Edit2,
  FileText,
} from "lucide-react";

export interface PageTab {
  id: string;
  name: string;
}

interface PageNavigatorProps {
  pages: PageTab[];
  currentPageId: string | null;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onDeletePage: (pageId: string) => void;
  onRenamePage: (pageId: string, newName: string) => void;
}

export const PageNavigator: React.FC<PageNavigatorProps> = ({
  pages,
  currentPageId,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onRenamePage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState("");

  const currentPage = pages.find((p) => p.id === currentPageId);

  const handleRenameStart = (page: PageTab) => {
    setRenamingId(page.id);
    setRenamingValue(page.name);
  };

  const handleRenameSave = (pageId: string) => {
    if (renamingValue.trim() && renamingValue !== pages.find((p) => p.id === pageId)?.name) {
      onRenamePage(pageId, renamingValue.trim());
    }
    setRenamingId(null);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-sm font-medium"
      >
        <FileText size={16} />
        <span className="max-w-[150px] truncate">{currentPage?.name || "Select Page"}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-64 bg-[#1a1d26] border border-transparent rounded-lg shadow-xl z-50">
          <div className="max-h-80 overflow-y-auto">
            {pages.length === 0 ? (
              <div className="p-4 text-center text-white/60 text-sm">No pages yet</div>
            ) : (
              pages.map((page) => (
                <div
                  key={page.id}
                  className={`flex items-center gap-2 px-4 py-2.5 border-b border-transparent hover:bg-white/10 transition-colors group ${
                    currentPageId === page.id ? "bg-blue-500/20" : ""
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectPage(page.id);
                      setIsOpen(false);
                    }}
                    className="flex-1 text-left truncate text-white hover:text-blue-400 transition-colors"
                  >
                    {renamingId === page.id ? (
                      <input
                        type="text"
                        value={renamingValue}
                        onChange={(e) => setRenamingValue(e.target.value)}
                        onBlur={() => handleRenameSave(page.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameSave(page.id);
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        autoFocus
                        className="w-full px-2 py-1 bg-white/10 border border-transparent rounded text-white text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      page.name
                    )}
                  </button>
                  {renamingId !== page.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameStart(page);
                        }}
                        className="p-1 hover:bg-white/20 rounded text-white/60 hover:text-white transition-colors"
                        title="Rename"
                      >
                        <Edit2 size={14} />
                      </button>
                      {pages.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete page "${page.name}"?`)) {
                              onDeletePage(page.id);
                            }
                          }}
                          className="p-1 hover:bg-red-500/20 rounded text-white/60 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => {
              onAddPage();
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-t border-transparent text-blue-400 hover:bg-blue-500/10 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Add Page
          </button>
        </div>
      )}
    </div>
  );
};
