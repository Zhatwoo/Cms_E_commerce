"use client";

import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useEditor } from "@craftjs/core";
import {
  Copy,
  ClipboardPaste,
  Replace,
  ChevronsUp,
  ChevronsDown,
  Group,
  Ungroup,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  ArrowLeftRight,
  ArrowUpDown,
  Trash2,
} from "lucide-react";
import {
  selectedToIds,
  getClipboard,
  copySelection,
  pasteClipboard,
  pasteToReplaceSelection,
  duplicateNodes,
  groupSelection,
  ungroupSelection,
} from "../_lib/canvasActions";

const isLikelyImageUrl = (value: string): boolean => {
  const text = value.trim();
  if (!text) return false;
  if (text.startsWith("data:image/")) return true;
  try {
    const url = new URL(text);
    const path = url.pathname.toLowerCase();
    return /\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?.*)?$/.test(path) || url.searchParams.has("imgurl");
  } catch {
    return false;
  }
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Failed to read clipboard image"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read clipboard image"));
    reader.readAsDataURL(blob);
  });

const PROTECTED = new Set(["Viewport", "ROOT"]);

type MenuState = { x: number; y: number; nodeId: string | null } | null;
const MENU_VIEWPORT_GAP = 8;

function MenuItem({
  icon: Icon,
  label,
  shortcut,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 w-full px-3 py-1.5 text-left text-sm transition-colors rounded ${
        disabled
          ? "text-brand-light/40 cursor-not-allowed"
          : danger
            ? "text-red-400 hover:bg-red-500/10"
            : "text-brand-lighter hover:bg-white/10"
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-brand-light/60 text-xs">{shortcut}</span>}
    </button>
  );
}

function Divider() {
  return <div className="border-t border-white/10 my-0.5" />;
}

/**
 * Right-click context menu on canvas: components, content, or empty area.
 * Shows Copy, Paste, Bring to front, Send to back, Group, Ungroup, Show/Hide, Lock, Flip, Delete.
 */
export function CanvasContextMenu() {
  const { actions, query } = useEditor();
  const [menu, setMenu] = useState<MenuState>(null);
  const [menuContentReady, setMenuContentReady] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => {
    setMenu(null);
    setMenuContentReady(false);
  }, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Only skip for actual side/top/bottom panels (they have their own context menus or UI).
      // Do NOT skip for canvas overlays (resize-overlay, node-label, page-name-edit, marquee, etc.)
      const inSideOrToolPanel =
        target.closest("[data-panel='left']") ||
        target.closest("[data-panel='right']") ||
        target.closest("[data-panel='configs']") ||
        target.closest("[data-panel='top-controls']") ||
        target.closest("[data-panel='bottom-tools']");
      if (inSideOrToolPanel) return;

      e.preventDefault();
      e.stopPropagation();

      let nodeId: string | null = null;
      const isInputLike = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;
      if (!isInputLike) {
        try {
          const nodeEl = target.closest("[data-node-id]") as HTMLElement | null;
          nodeId = nodeEl?.getAttribute("data-node-id") ?? null;
          const state = query.getState();
          const nodesMap = state.nodes;
          const exists = (id: string) => !!id && id !== "ROOT" && !!nodesMap[id];

          if (nodeId && exists(nodeId)) {
            const currentIds = selectedToIds(state.events.selected);
            if (!currentIds.includes(nodeId)) {
              actions.selectNode(nodeId);
            }
          }
        } catch {
          nodeId = null;
        }
      }

      setMenu({ x: e.clientX, y: e.clientY, nodeId });
      setMenuContentReady(false);
    };

    document.addEventListener("contextmenu", handleContextMenu, true);
    const canvasEl = document.querySelector("[data-canvas-container]");
    const boundHandler = (ev: Event) => handleContextMenu(ev as MouseEvent);
    if (canvasEl) {
      canvasEl.addEventListener("contextmenu", boundHandler, true);
    }
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, true);
      if (canvasEl) {
        canvasEl.removeEventListener("contextmenu", boundHandler, true);
      }
    };
  }, [actions, query]);

  useEffect(() => {
    if (!menu) return;
    const handleClick = (e: MouseEvent) => {
      // Don't close when clicking inside the menu — let the button onClick run first
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-context-menu]")) return;
      close();
    };
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-context-menu]")) return;
      close();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("click", handleClick, true);
    window.addEventListener("contextmenu", handleContextMenu, true);
    window.addEventListener("keydown", handleKey, true);
    return () => {
      window.removeEventListener("click", handleClick, true);
      window.removeEventListener("contextmenu", handleContextMenu, true);
      window.removeEventListener("keydown", handleKey, true);
    };
  }, [menu, close]);

  // Defer reading editor state to next frame to avoid "Cannot update while rendering" (Craft store)
  useEffect(() => {
    if (!menu) return;
    const id = requestAnimationFrame(() => setMenuContentReady(true));
    return () => cancelAnimationFrame(id);
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    setMenuPosition({ left: menu.x, top: menu.y });
  }, [menu]);

  useLayoutEffect(() => {
    if (!menu || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    let nextLeft = menu.x;
    let nextTop = menu.y;

    if (nextLeft + rect.width + MENU_VIEWPORT_GAP > window.innerWidth) {
      nextLeft = window.innerWidth - rect.width - MENU_VIEWPORT_GAP;
    }
    if (nextTop + rect.height + MENU_VIEWPORT_GAP > window.innerHeight) {
      nextTop = window.innerHeight - rect.height - MENU_VIEWPORT_GAP;
    }

    nextLeft = Math.max(MENU_VIEWPORT_GAP, nextLeft);
    nextTop = Math.max(MENU_VIEWPORT_GAP, nextTop);

    setMenuPosition((prev) => {
      if (prev && prev.left === nextLeft && prev.top === nextTop) return prev;
      return { left: nextLeft, top: nextTop };
    });
  }, [menu, menuContentReady]);

  if (!menu) return null;
  if (!menuContentReady) {
    return ReactDOM.createPortal(
      <div
        ref={menuRef}
        data-context-menu
        className="fixed z-[10050] min-w-[200px] max-h-[calc(100vh-16px)] overflow-y-auto bg-brand-darker border border-white/10 rounded-lg shadow-2xl py-2 px-3 text-brand-light/60 text-sm"
        style={{ left: menuPosition?.left ?? menu.x, top: menuPosition?.top ?? menu.y }}
      >
        Loading…
      </div>,
      document.body
    );
  }

  const state = query.getState();
  const selectedIds = selectedToIds(state.events.selected);
  const hasSelection = selectedIds.length > 0;
  const singleSelected = selectedIds.length === 1;
  const firstId = selectedIds[0] ?? null;
  const clipboard = getClipboard();
  const hasClipboard = clipboard !== null && clipboard.nodeIds.length > 0;
  const firstNode = firstId ? state.nodes[firstId] : null;
  const displayName = firstNode?.data?.displayName as string | undefined;
  const canUngroup = singleSelected && (displayName === "Container" || displayName === "Group");
  const canGroup = selectedIds.length >= 1;
  const visibility = (firstNode?.data?.props as Record<string, unknown>)?.visibility as string | undefined;
  const isHidden = visibility === "hidden";
  const locked = (firstNode?.data?.props as Record<string, unknown>)?.locked as boolean | undefined;
  const flipH = (firstNode?.data?.props as Record<string, unknown>)?.flipHorizontal as boolean | undefined;
  const flipV = (firstNode?.data?.props as Record<string, unknown>)?.flipVertical as boolean | undefined;
  const deletable = hasSelection && selectedIds.every((id) => {
    try {
      if (PROTECTED.has(state.nodes[id]?.data?.displayName as string)) return false;
      return query.node(id).isDeletable();
    } catch { return false; }
  });

  const parentId = firstNode?.data?.parent as string | undefined;
  const siblings = parentId && state.nodes[parentId] ? (state.nodes[parentId]?.data?.nodes as string[]) ?? [] : [];
  const selectedIndices = selectedIds.map((id) => siblings.indexOf(id)).filter((i) => i >= 0);
  const minSelectedIndex = selectedIndices.length > 0 ? Math.min(...selectedIndices) : -1;
  const maxSelectedIndex = selectedIndices.length > 0 ? Math.max(...selectedIndices) : -1;
  const allSameParent = hasSelection && parentId && selectedIds.every((id) => (state.nodes[id]?.data?.parent as string) === parentId);
  const canBringForward = hasSelection && allSameParent && maxSelectedIndex >= 0 && maxSelectedIndex < siblings.length - 1 && actions.move;
  const canSendBackward = hasSelection && allSameParent && minSelectedIndex > 0 && actions.move;

  const handleCopy = () => {
    copySelection(query as any, selectedIds);
    close();
  };


  const pasteExternalImageAtTarget = (
    src: string,
    parentIdOpt?: string,
    atIndexOpt?: number
  ) => {
    const cleanSrc = src.trim();
    if (!cleanSrc) return;

    const nodeId = `image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tree = {
      rootNodeId: nodeId,
      nodes: {
        [nodeId]: {
          type: { resolvedName: "Image" },
          isCanvas: false,
          props: {
            src: cleanSrc,
            alt: "Pasted Image",
            objectFit: "cover",
            width: "320px",
            height: "220px",
            _autoFitInTabs: false,
          },
          displayName: "Image",
          nodes: [],
          linkedNodes: {},
          custom: {},
          hidden: false,
        },
      },
    };

    const addNodeTree = (actions as unknown as {
      addNodeTree?: (tree: any, parentId?: string, index?: number) => void;
    }).addNodeTree;

    if (typeof addNodeTree !== "function") return;
    addNodeTree(tree, parentIdOpt, atIndexOpt);
    actions.selectNode(nodeId);
  };

  const handlePasteHere = async () => {
    let parentIdOpt: string | undefined;
    let atIndexOpt: number | undefined;

    if (menu.nodeId && state.nodes[menu.nodeId]) {
      const node = state.nodes[menu.nodeId];
      parentIdOpt = node?.data?.parent as string | undefined;
      const sibs =
        parentIdOpt && state.nodes[parentIdOpt]
          ? ((state.nodes[parentIdOpt]?.data?.nodes as string[]) ?? [])
          : [];
      const idx = sibs.indexOf(menu.nodeId);
      atIndexOpt = idx === -1 ? sibs.length : idx + 1;
    } else if (selectedIds.length > 0) {
      const lastId = selectedIds[selectedIds.length - 1]!;
      const lastNode = state.nodes[lastId];
      parentIdOpt = lastNode?.data?.parent as string | undefined;
      if (parentIdOpt && state.nodes[parentIdOpt]) {
        const sibs = (state.nodes[parentIdOpt]?.data?.nodes as string[]) ?? [];
        const lastIndex = sibs.indexOf(lastId);
        atIndexOpt = lastIndex === -1 ? sibs.length : lastIndex + 1;
      }
    }

    if (hasClipboard) {
      pasteClipboard(actions as any, query as any, {
        parentId: parentIdOpt,
        atIndex: atIndexOpt,
      });
      close();
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((type) => type.startsWith("image/"));
          if (!imageType) continue;
          const blob = await item.getType(imageType);
          const dataUrl = await blobToDataUrl(blob);
          pasteExternalImageAtTarget(dataUrl, parentIdOpt, atIndexOpt);
          close();
          return;
        }
      }

      if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
        const text = (await navigator.clipboard.readText()) || "";
        if (isLikelyImageUrl(text)) {
          pasteExternalImageAtTarget(text.trim(), parentIdOpt, atIndexOpt);
          close();
          return;
        }
      }
    } catch {
      // Ignore clipboard permission and unsupported API errors
    }

    close();
  };
  const handlePasteToReplace = () => {
    if (singleSelected) pasteToReplaceSelection(actions as any, query as any, selectedIds);
    close();
  };
  const handleBringToFront = () => {
    if (!hasSelection || !parentId || !actions.move || !allSameParent) return;
    // Sort by current sibling index so we preserve document order at the end
    const sorted = [...selectedIds].sort((a, b) => siblings.indexOf(a) - siblings.indexOf(b));
    for (const id of sorted) {
      try {
        const st = query.getState();
        const sibs = (st.nodes[parentId]?.data?.nodes as string[]) ?? [];
        const lastIndex = sibs.length - 1;
        const idx = sibs.indexOf(id);
        if (idx >= 0 && idx !== lastIndex) {
          actions.move(id, parentId, lastIndex);
        }
      } catch {
        /* skip */
      }
    }
    close();
  };
  const handleSendToBack = () => {
    if (!hasSelection || !parentId || !actions.move || !allSameParent) return;
    // Sort by current sibling index so we preserve document order at the front
    const sorted = [...selectedIds].sort((a, b) => siblings.indexOf(a) - siblings.indexOf(b));
    for (let i = 0; i < sorted.length; i++) {
      try {
        const st = query.getState();
        const sibs = (st.nodes[parentId]?.data?.nodes as string[]) ?? [];
        const currentIndex = sibs.indexOf(sorted[i]!);
        if (currentIndex >= 0 && currentIndex !== i) {
          actions.move(sorted[i]!, parentId, i);
        }
      } catch {
        /* skip */
      }
    }
    close();
  };
  const handleGroup = () => {
    groupSelection(actions as any, query as any, selectedIds);
    close();
  };
  const handleUngroup = () => {
    ungroupSelection(actions as any, query as any, selectedIds);
    close();
  };
  const handleDuplicate = () => {
      duplicateNodes(actions as any, query as any, selectedIds);
    close();
  };
  const handleShowHide = () => {
    const next = isHidden ? "visible" : "hidden";
    selectedIds.forEach((id) => {
      try {
        actions.setProp(id, (p: Record<string, unknown>) => { p.visibility = next; });
      } catch { /* skip */ }
    });
    close();
  };
  const handleLockUnlock = () => {
    const next = !locked;
    selectedIds.forEach((id) => {
      try {
        actions.setProp(id, (p: Record<string, unknown>) => { p.locked = next; });
      } catch { /* skip */ }
    });
    close();
  };
  const handleFlipH = () => {
    selectedIds.forEach((id) => {
      try {
        actions.setProp(id, (p: Record<string, unknown>) => { p.flipHorizontal = !(p.flipHorizontal as boolean); });
      } catch { /* skip */ }
    });
    close();
  };
  const handleFlipV = () => {
    selectedIds.forEach((id) => {
      try {
        actions.setProp(id, (p: Record<string, unknown>) => { p.flipVertical = !(p.flipVertical as boolean); });
      } catch { /* skip */ }
    });
    close();
  };
  const handleDelete = () => {
    if (!deletable) return;
    try {
      (actions as any).delete(selectedIds.length === 1 ? selectedIds[0]! : selectedIds);
      (actions as any).selectNode(undefined);
    } catch { /* ignore */ }
    close();
  };

  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      data-context-menu
      className="fixed z-[10050] min-w-[200px] max-h-[calc(100vh-16px)] overflow-y-auto bg-brand-darker border border-white/10 rounded-lg shadow-2xl py-1 text-sm"
      style={{ left: menuPosition?.left ?? menu.x, top: menuPosition?.top ?? menu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <MenuItem icon={Copy} label="Copy" shortcut="⌘C" onClick={handleCopy} disabled={!hasSelection} />
      <MenuItem icon={ClipboardPaste} label="Paste here" shortcut="⌘V" onClick={handlePasteHere} disabled={false} />
      <MenuItem icon={Replace} label="Paste to replace" shortcut="⇧⌘R" onClick={handlePasteToReplace} disabled={!singleSelected || !hasClipboard} />
      <Divider />
      <MenuItem icon={ChevronsUp} label="Bring to front" shortcut="]" onClick={handleBringToFront} disabled={!canBringForward} />
      <MenuItem icon={ChevronsDown} label="Send to back" shortcut="[" onClick={handleSendToBack} disabled={!canSendBackward} />
      <Divider />
      <MenuItem icon={Group} label="Group selection" shortcut="⌘G" onClick={handleGroup} disabled={!canGroup} />
      <MenuItem icon={Ungroup} label="Ungroup" shortcut="⇧⌘G" onClick={handleUngroup} disabled={!canUngroup} />
      <MenuItem icon={Copy} label="Duplicate" shortcut="⌘D" onClick={handleDuplicate} disabled={!hasSelection} />
      <Divider />
      <MenuItem
        icon={isHidden ? Eye : EyeOff}
        label={isHidden ? "Show" : "Hide"}
        shortcut="⇧⌘H"
        onClick={handleShowHide}
        disabled={!hasSelection}
      />
      <MenuItem
        icon={locked ? Lock : LockOpen}
        label={locked ? "Unlock" : "Lock"}
        shortcut="⇧⌘L"
        onClick={handleLockUnlock}
        disabled={!hasSelection}
      />
      <Divider />
      <MenuItem icon={ArrowLeftRight} label="Flip horizontal" shortcut="⇧H" onClick={handleFlipH} disabled={!hasSelection} />
      <MenuItem icon={ArrowUpDown} label="Flip vertical" shortcut="⇧V" onClick={handleFlipV} disabled={!hasSelection} />
      <Divider />
      <MenuItem icon={Trash2} label="Delete" shortcut="Del" onClick={handleDelete} disabled={!deletable} danger />
    </div>,
    document.body
  );
}
