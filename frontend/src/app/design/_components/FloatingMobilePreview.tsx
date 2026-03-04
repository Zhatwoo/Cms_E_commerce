"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useEditor } from "@craftjs/core";
import { X, Smartphone, Move, Minus, ChevronDown, Monitor } from "lucide-react";

// Phone device presets with realistic screen dimensions
interface PhonePreset {
  name: string;
  brand: string;
  width: number;
  height: number;
}

const PHONE_PRESETS: PhonePreset[] = [
  // Apple iPhones
  { name: "iPhone 15 Pro Max", brand: "Apple", width: 430, height: 932 },
  { name: "iPhone 15 Pro", brand: "Apple", width: 393, height: 852 },
  { name: "iPhone 15", brand: "Apple", width: 393, height: 852 },
  { name: "iPhone 14 Pro Max", brand: "Apple", width: 430, height: 932 },
  { name: "iPhone 14 Pro", brand: "Apple", width: 393, height: 852 },
  { name: "iPhone 14", brand: "Apple", width: 390, height: 844 },
  { name: "iPhone SE", brand: "Apple", width: 375, height: 667 },
  { name: "iPhone 12 Mini", brand: "Apple", width: 375, height: 812 },

  // Samsung Galaxy
  { name: "Galaxy S24 Ultra", brand: "Samsung", width: 412, height: 915 },
  { name: "Galaxy S24+", brand: "Samsung", width: 412, height: 915 },
  { name: "Galaxy S24", brand: "Samsung", width: 360, height: 780 },
  { name: "Galaxy S23 Ultra", brand: "Samsung", width: 412, height: 915 },
  { name: "Galaxy Z Fold 5", brand: "Samsung", width: 373, height: 841 },
  { name: "Galaxy Z Flip 5", brand: "Samsung", width: 412, height: 919 },
  { name: "Galaxy A54", brand: "Samsung", width: 412, height: 915 },

  // Google Pixel
  { name: "Pixel 8 Pro", brand: "Google", width: 412, height: 892 },
  { name: "Pixel 8", brand: "Google", width: 412, height: 892 },
  { name: "Pixel 7 Pro", brand: "Google", width: 412, height: 892 },
  { name: "Pixel 7", brand: "Google", width: 412, height: 915 },

  // Other Popular
  { name: "OnePlus 12", brand: "OnePlus", width: 412, height: 915 },
  { name: "Xiaomi 14 Pro", brand: "Xiaomi", width: 412, height: 915 },
];

const DEFAULT_DEVICE = PHONE_PRESETS[2]; // iPhone 15

const MOBILE_SIDE_GUTTER = 14;

function parsePx(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = parseFloat(value.replace("px", "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function asElements(collection: HTMLCollection): HTMLElement[] {
  return Array.from(collection).filter((el): el is HTMLElement => el instanceof HTMLElement);
}

function applyHamburgerIfNeeded(root: HTMLElement): HTMLElement | null {
  const candidates = Array.from(root.querySelectorAll<HTMLElement>("*"));
  const header = candidates.find((el) => {
    if ((el.style.display || "").toLowerCase() !== "flex") return false;
    const direction = (el.style.flexDirection || "row").toLowerCase();
    if (direction !== "row") return false;

    const children = asElements(el.children);
    if (children.length < 3) return false;

    const readable = children.filter((child) => {
      const text = (child.textContent || "").trim();
      return text.length >= 2 && text.length <= 24;
    }).length;

    return readable >= 3;
  });

  if (!header) return null;

  const children = asElements(header.children);
  if (children.length < 3) return null;

  const logo = children[0];
  const menuItems = children.slice(1);

  header.dataset.mobileNavRoot = "true";

  header.style.flexDirection = "row";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.flexWrap = "nowrap";
  header.style.gap = "12px";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.textContent = "☰";
  toggle.setAttribute("aria-label", "Toggle menu");
  toggle.style.display = "inline-flex";
  toggle.style.alignItems = "center";
  toggle.style.justifyContent = "center";
  toggle.style.width = "34px";
  toggle.style.height = "34px";
  toggle.style.border = "1px solid rgba(255,255,255,0.25)";
  toggle.style.borderRadius = "8px";
  toggle.style.background = "transparent";
  toggle.style.color = "inherit";
  toggle.style.cursor = "pointer";

  const menu = document.createElement("div");
  menu.style.display = "none";
  menu.style.flexDirection = "column";
  menu.style.gap = "8px";
  menu.style.padding = "10px 0 0";
  menu.style.width = "100%";

  menuItems.forEach((item) => {
    item.style.position = "static";
    item.style.top = "auto";
    item.style.right = "auto";
    item.style.bottom = "auto";
    item.style.left = "auto";
    item.style.transform = "none";
    item.style.display = "block";
    item.style.width = "100%";
    item.style.textAlign = "left";
    item.style.margin = "0";
    menu.appendChild(item);
  });

  const shell = document.createElement("div");
  shell.dataset.mobileNavShell = "true";
  shell.style.width = "100%";
  shell.appendChild(menu);

  toggle.onclick = () => {
    menu.style.display = menu.style.display === "none" ? "flex" : "none";
  };

  header.textContent = "";
  logo.style.position = "static";
  logo.style.top = "auto";
  logo.style.right = "auto";
  logo.style.bottom = "auto";
  logo.style.left = "auto";
  logo.style.transform = "none";
  header.appendChild(logo);
  header.appendChild(toggle);
  header.insertAdjacentElement("afterend", shell);
  return header;
}

function adaptCloneForMobile(root: HTMLElement, mobileInnerWidth: number) {
  const mobileNavHeader = applyHamburgerIfNeeded(root);
  const all = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

  all.forEach((el) => {
    el.dataset.mobilePreviewClone = "true";

    el.style.boxSizing = "border-box";
    el.style.maxWidth = "100%";

    if (el === root) {
      el.style.overflowX = "hidden";
    }

    const isMobileNavHeader = el === mobileNavHeader || el.dataset.mobileNavRoot === "true";
    const isMobileNavShell = el.dataset.mobileNavShell === "true";

    const position = (el.style.position || "").toLowerCase();
    if (position === "absolute" || position === "fixed") {
      const insideMobileNav = !!el.closest("[data-mobile-nav-root='true']") || !!el.closest("[data-mobile-nav-shell='true']");
      if (insideMobileNav) {
        el.style.position = "static";
        el.style.top = "auto";
        el.style.right = "auto";
        el.style.bottom = "auto";
        el.style.left = "auto";
        el.style.transform = "none";
      }
    }

    const widthPx = parsePx(el.style.width);
    if (widthPx !== null && widthPx > mobileInnerWidth) {
      el.style.width = "100%";
    }

    const tag = el.tagName.toLowerCase();
    const isMediaElement = ["img", "svg", "canvas", "video", "path"].includes(tag);
    const hasReadableText = (el.textContent || "").trim().length > 0;

    if (!isMediaElement && hasReadableText && widthPx !== null && widthPx > 0 && widthPx < 140) {
      el.style.width = "100%";
      el.style.minWidth = "0px";
    }

    const minWidthPx = parsePx(el.style.minWidth);
    if (minWidthPx !== null && minWidthPx > mobileInnerWidth) {
      el.style.minWidth = "0px";
    }

    const leftPx = parsePx(el.style.left);
    if (leftPx !== null && (leftPx > 8 || leftPx < 0)) {
      el.style.left = "0px";
    }

    const rightPx = parsePx(el.style.right);
    if (rightPx !== null && (rightPx > 8 || rightPx < 0)) {
      el.style.right = "0px";
    }

    const paddingLeftPx = parsePx(el.style.paddingLeft);
    if (paddingLeftPx !== null && paddingLeftPx > 40) {
      el.style.paddingLeft = `${MOBILE_SIDE_GUTTER}px`;
    }

    const paddingRightPx = parsePx(el.style.paddingRight);
    if (paddingRightPx !== null && paddingRightPx > 40) {
      el.style.paddingRight = `${MOBILE_SIDE_GUTTER}px`;
    }

    const gapPx = parsePx(el.style.gap);
    if (gapPx !== null && gapPx > 40) {
      el.style.gap = "16px";
    }

    const fontSizePx = parsePx(el.style.fontSize);
    if (fontSizePx !== null && fontSizePx > 48) {
      el.style.fontSize = "32px";
    }
  });
}

function hasVisibleContentInViewport(wrapper: HTMLElement): boolean {
  const viewportRect = wrapper.getBoundingClientRect();
  const nodes = Array.from(wrapper.querySelectorAll<HTMLElement>("[data-node-id]"));
  if (nodes.length === 0) {
    const fallbackRenderable = wrapper.querySelector("img, svg, canvas, video, iframe, [data-layout], [class]");
    const text = (wrapper.textContent || "").trim();
    return !!fallbackRenderable || text.length > 0;
  }

  for (const node of nodes) {
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
      continue;
    }
    const rect = node.getBoundingClientRect();
    const intersects =
      rect.right > viewportRect.left &&
      rect.left < viewportRect.right &&
      rect.bottom > viewportRect.top &&
      rect.top < viewportRect.bottom &&
      rect.width > 1 &&
      rect.height > 1;
    if (intersects) return true;
  }

  return false;
}

interface FloatingMobilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PageInfo {
  id: string;
  name: string;
}

export const FloatingMobilePreview: React.FC<FloatingMobilePreviewProps> = ({
  isOpen,
  onClose,
}) => {
  const mobileCanvasRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to editor state to get pages list and detect selected page
  const { actions, query, pages, selectedPageFromCanvas } = useEditor((state) => {
    const nodes = state.nodes ?? {};
    const pageList: PageInfo[] = [];

    Object.entries(nodes).forEach(([nodeId, node]) => {
      if (node?.data?.displayName === "Page") {
        pageList.push({
          id: nodeId,
          name: (node.data.props as Record<string, unknown>)?.pageName as string || "Untitled Page",
        });
      }
    });

    // Find which page is currently selected or contains the selected node
    let detectedPageId: string | null = null;
    const selectedIds = state.events.selected;
    const selectedId = selectedIds instanceof Set
      ? selectedIds.values().next().value
      : Array.isArray(selectedIds)
        ? selectedIds[0]
        : null;

    if (selectedId && selectedId !== "ROOT") {
      // Check if selected node is a Page
      const selectedNode = nodes[selectedId];
      if (selectedNode?.data?.displayName === "Page") {
        detectedPageId = selectedId;
      } else if (selectedNode) {
        // Walk up the tree to find the parent Page
        let currentId: string | null = selectedNode.data?.parent ?? null;
        while (currentId && currentId !== "ROOT") {
          const parentNode = nodes[currentId];
          if (parentNode?.data?.displayName === "Page") {
            detectedPageId = currentId;
            break;
          }
          currentId = parentNode?.data?.parent ?? null;
        }
      }
    }

    return { pages: pageList, selectedPageFromCanvas: detectedPageId };
  });

  // Panel position state — use refs during drag for zero-rerender movement
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragRafRef = useRef<number>(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<PhonePreset>(DEFAULT_DEVICE);
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);

  // Initialize position to bottom-right corner
  useEffect(() => {
    if (isOpen && positionRef.current.x === 0 && positionRef.current.y === 0) {
      const initial = {
        x: window.innerWidth - selectedDevice.width - 80,
        y: 80,
      };
      positionRef.current = initial;
      setPosition(initial);
    }
  }, [isOpen, selectedDevice.width]);

  // Auto-sync with canvas selection - when user clicks on a page or element in a page
  useEffect(() => {
    if (!isOpen) return;

    if (selectedPageFromCanvas && pages.find(p => p.id === selectedPageFromCanvas)) {
      setSelectedPageId(selectedPageFromCanvas);
    }
  }, [isOpen, selectedPageFromCanvas, pages]);

  // Auto-select first page if none selected
  useEffect(() => {
    if (!isOpen) return;

    // Select first page if none selected or if current selection is invalid
    if (pages.length > 0 && (!selectedPageId || !pages.find(p => p.id === selectedPageId))) {
      setSelectedPageId(pages[0].id);
    }
  }, [isOpen, pages, selectedPageId]);

  // Handle dragging — uses refs + direct DOM transform for smooth 60fps drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-drag-handle]")) {
      e.preventDefault();
      isDraggingRef.current = true;
      setIsDragging(true);
      document.body.style.userSelect = "none";
      dragStartRef.current = {
        x: e.clientX - positionRef.current.x,
        y: e.clientY - positionRef.current.y,
      };
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      // Cancel any pending rAF to avoid queueing multiple frames
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);

      dragRafRef.current = requestAnimationFrame(() => {
        const newX = Math.max(0, Math.min(e.clientX - dragStartRef.current.x, window.innerWidth - selectedDevice.width - 40));
        const newY = Math.max(48, Math.min(e.clientY - dragStartRef.current.y, window.innerHeight - 100));

        positionRef.current = { x: newX, y: newY };

        // Apply directly to DOM — no React re-render
        const el = panelRef.current;
        if (el) {
          el.style.left = `${newX}px`;
          el.style.top = `${newY}px`;
        }
      });
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);

      // Sync final position back to React state (single re-render)
      setPosition({ ...positionRef.current });
      setIsDragging(false);
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);
    };
  }, [selectedDevice.width]);

  // Render mobile preview
  useEffect(() => {
    if (!isOpen || isMinimized || !selectedPageId) return;

    let frame = 0;
    let retryCount = 0;
    const MAX_RETRIES = 20;
    let refCheckCount = 0;
    const MAX_REF_CHECKS = 10;

    const renderMobilePreview = () => {
      const mobileRoot = mobileCanvasRef.current;

      // Wait for ref to be available (happens after render cycle)
      if (!mobileRoot) {
        if (refCheckCount < MAX_REF_CHECKS) {
          refCheckCount++;
          frame = requestAnimationFrame(renderMobilePreview);
          return;
        }
        console.warn("[FloatingMobilePreview] mobileCanvasRef not available after retries");
        return;
      }

      const pageEl = document.querySelector(`[data-node-id="${selectedPageId}"]`) as HTMLElement | null;
      if (!pageEl) {
        // Retry a few times in case the page hasn't rendered yet
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          frame = requestAnimationFrame(renderMobilePreview);
          return;
        }
        mobileRoot.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-brand-light/50 text-sm gap-2 p-4">
          <span>Page not found in DOM</span>
          <span class="text-xs opacity-50">ID: ${selectedPageId}</span>
        </div>`;
        return;
      }

      retryCount = 0; // Reset retry count on success

      const clone = pageEl.cloneNode(true) as HTMLElement;
      clone.removeAttribute("data-node-id");
      clone.removeAttribute("data-page-node");

      // Remove any nested mobile preview panels from the clone
      const nestedMobilePreviews = clone.querySelectorAll("[data-mobile-preview-panel]");
      nestedMobilePreviews.forEach((el) => el.remove());

      // Remove the page name label
      const pageNameLabel = clone.querySelector("[data-page-name-label]");
      if (pageNameLabel) pageNameLabel.remove();

      clone.style.pointerEvents = "auto";
      clone.style.margin = "0";
      clone.style.transformOrigin = "top left";
      clone.style.width = "100%";
      clone.style.height = "auto";
      clone.style.minHeight = `${selectedDevice.height}px`;
      clone.style.transform = "none";
      clone.style.position = "static";
      clone.style.left = "0";
      clone.style.top = "0";
      clone.dataset.mobilePreviewRoot = "true";

      const mobileInnerWidth = selectedDevice.width - MOBILE_SIDE_GUTTER * 2;
      adaptCloneForMobile(clone, mobileInnerWidth);
      const interactiveNodes = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>("*"))];
      interactiveNodes.forEach((el) => {
        el.style.pointerEvents = "auto";
      });

      let selectedNodeId: string | null = null;
      try {
        selectedNodeId = query.getEvent("selected").first() ?? null;
      } catch {
        selectedNodeId = null;
      }

      if (selectedNodeId) {
        const selectedEl = clone.querySelector<HTMLElement>(`[data-node-id="${selectedNodeId}"]`);
        if (selectedEl) {
          selectedEl.style.outline = "2px solid #3b82f6";
          selectedEl.style.outlineOffset = "1px";
        }
      }

      mobileRoot.innerHTML = "";
      const wrapper = document.createElement("div");
      wrapper.style.width = `${selectedDevice.width}px`;
      wrapper.style.minHeight = `${selectedDevice.height}px`;
      wrapper.style.height = "auto";
      wrapper.style.overflow = "auto";
      wrapper.style.position = "relative";
      wrapper.style.background = "#e5e7eb";
      wrapper.style.borderRadius = "0";
      wrapper.style.padding = "0";
      wrapper.style.boxSizing = "border-box";
      wrapper.style.overflowX = "hidden";
      wrapper.appendChild(clone);
      mobileRoot.appendChild(wrapper);

      if (!hasVisibleContentInViewport(wrapper)) {
        const fallbackClone = pageEl.cloneNode(true) as HTMLElement;
        fallbackClone.removeAttribute("data-node-id");
        fallbackClone.removeAttribute("data-page-node");
        fallbackClone.querySelectorAll("[data-mobile-preview-panel]").forEach((el) => el.remove());
        const fallbackPageNameLabel = fallbackClone.querySelector("[data-page-name-label]");
        if (fallbackPageNameLabel) fallbackPageNameLabel.remove();

        const sourceWidth = Math.max(1, pageEl.offsetWidth || pageEl.scrollWidth || selectedDevice.width);
        const sourceHeight = Math.max(1, pageEl.offsetHeight || pageEl.scrollHeight || selectedDevice.height);
        const fitWidth = Math.max(1, selectedDevice.width - MOBILE_SIDE_GUTTER * 2);
        const scale = Math.min(1, fitWidth / sourceWidth);

        fallbackClone.style.pointerEvents = "auto";
        fallbackClone.style.margin = "0";
        fallbackClone.style.transformOrigin = "top left";
        fallbackClone.style.width = `${sourceWidth}px`;
        fallbackClone.style.height = `${sourceHeight}px`;
        fallbackClone.style.minHeight = `${sourceHeight}px`;
        fallbackClone.style.transform = "none";
        fallbackClone.style.position = "static";
        fallbackClone.style.left = "0";
        fallbackClone.style.top = "0";

        const fallbackAll = [fallbackClone, ...Array.from(fallbackClone.querySelectorAll<HTMLElement>("*"))];
        fallbackAll.forEach((el) => {
          const position = (el.style.position || "").toLowerCase();
          if (position === "fixed") {
            el.style.position = "absolute";
          }
          const minWidthPx = parsePx(el.style.minWidth);
          if (minWidthPx !== null && minWidthPx > fitWidth) {
            el.style.minWidth = "0px";
          }
          const widthPx = parsePx(el.style.width);
          if (widthPx !== null && widthPx > sourceWidth) {
            el.style.width = "100%";
          }
        });

        mobileRoot.innerHTML = "";
        const fallbackWrapper = document.createElement("div");
        fallbackWrapper.style.width = `${selectedDevice.width}px`;
        fallbackWrapper.style.minHeight = `${selectedDevice.height}px`;
        fallbackWrapper.style.height = "auto";
        fallbackWrapper.style.overflow = "auto";
        fallbackWrapper.style.position = "relative";
        fallbackWrapper.style.background = "#e5e7eb";
        fallbackWrapper.style.borderRadius = "0";
        fallbackWrapper.style.padding = "0";
        fallbackWrapper.style.boxSizing = "border-box";
        fallbackWrapper.style.overflowX = "hidden";

        const scaledStage = document.createElement("div");
        scaledStage.style.width = `${sourceWidth}px`;
        scaledStage.style.height = `${sourceHeight}px`;
        scaledStage.style.transform = `scale(${scale})`;
        scaledStage.style.transformOrigin = "top left";
        scaledStage.style.margin = `0 ${MOBILE_SIDE_GUTTER}px`;
        scaledStage.appendChild(fallbackClone);
        fallbackWrapper.appendChild(scaledStage);
        mobileRoot.appendChild(fallbackWrapper);
      }
    };

    const queueRender = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(renderMobilePreview);
    };

    const handleMobileMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const nodeEl = target.closest<HTMLElement>("[data-node-id]");
      if (!nodeEl) return;

      const nodeId = nodeEl.getAttribute("data-node-id");
      if (!nodeId || nodeId === "ROOT") return;

      if (!query.getState().nodes[nodeId]) return;

      event.preventDefault();
      event.stopPropagation();
      actions.selectNode(nodeId);

      // Center the camera on the selected element on the desktop canvas
      const canvasContainer = document.querySelector("[data-canvas-container]") as HTMLElement | null;
      if (canvasContainer) {
        canvasContainer.dispatchEvent(
          new CustomEvent("center-on-node", { detail: { nodeId } })
        );
      }

      queueRender();
    };

    const blockCanvasPanFromMobile = (event: Event) => {
      event.stopPropagation();
    };

    // Observe the page element for changes
    const pageEl = document.querySelector(`[data-viewport-desktop] [data-page-node='true'][data-node-id="${selectedPageId}"]`) as HTMLElement | null;
    const mutation = new MutationObserver(queueRender);
    if (pageEl) {
      mutation.observe(pageEl, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
      });
    }

    // Also observe the canvas container for new page elements appearing
    const canvasContainer = document.querySelector("[data-canvas-container]");
    const containerMutation = new MutationObserver(() => {
      // Check if the page appeared
      const newPageEl = document.querySelector(`[data-viewport-desktop] [data-page-node='true'][data-node-id="${selectedPageId}"]`);
      if (newPageEl) {
        queueRender();
      }
    });
    if (canvasContainer) {
      containerMutation.observe(canvasContainer, {
        subtree: true,
        childList: true,
      });
    }

    const resizeObserver = new ResizeObserver(queueRender);
    if (pageEl) {
      resizeObserver.observe(pageEl);
    }

    // Setup event listeners after a small delay to ensure ref is available
    let listenersAdded = false;
    const setupListeners = () => {
      const mobileRoot = mobileCanvasRef.current;
      if (!mobileRoot) {
        requestAnimationFrame(setupListeners);
        return;
      }
      mobileRoot.addEventListener("mousedown", handleMobileMouseDown, true);
      mobileRoot.addEventListener("mousedown", blockCanvasPanFromMobile, true);
      mobileRoot.addEventListener("mousemove", blockCanvasPanFromMobile, true);
      mobileRoot.addEventListener("mouseup", blockCanvasPanFromMobile, true);
      mobileRoot.addEventListener("wheel", blockCanvasPanFromMobile, { capture: true });
      listenersAdded = true;
    };
    setupListeners();

    queueRender();

    return () => {
      cancelAnimationFrame(frame);
      mutation.disconnect();
      containerMutation.disconnect();
      resizeObserver.disconnect();
      const mobileRoot = mobileCanvasRef.current;
      if (mobileRoot && listenersAdded) {
        mobileRoot.removeEventListener("mousedown", handleMobileMouseDown, true);
        mobileRoot.removeEventListener("mousedown", blockCanvasPanFromMobile, true);
        mobileRoot.removeEventListener("mousemove", blockCanvasPanFromMobile, true);
        mobileRoot.removeEventListener("mouseup", blockCanvasPanFromMobile, true);
        mobileRoot.removeEventListener("wheel", blockCanvasPanFromMobile, true);
      }
    };
  }, [isOpen, isMinimized, selectedPageId, actions, query, pages, selectedDevice]);

  if (!isOpen) return null;

  const selectedPage = pages.find(p => p.id === selectedPageId);

  // Group devices by brand for the dropdown
  const devicesByBrand = PHONE_PRESETS.reduce((acc, device) => {
    if (!acc[device.brand]) acc[device.brand] = [];
    acc[device.brand].push(device);
    return acc;
  }, {} as Record<string, PhonePreset[]>);

  return (
    <div
      ref={panelRef}
      className={`fixed z-[100] bg-brand-darker/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl ${isDragging ? "cursor-grabbing" : "transition-[width] duration-200"
        }`}
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? "auto" : selectedDevice.width + 24,
        willChange: isDragging ? "left, top" : "auto",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div
        data-drag-handle
        className="flex items-center justify-between px-4 py-3 border-b border-white/10 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-brand-light/50" />
          <Smartphone className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-brand-lighter">Mobile Preview</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-brand-medium/40 transition-colors text-brand-light hover:text-brand-lighter"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-brand-medium/40 transition-colors text-brand-light hover:text-brand-lighter"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Device Selector */}
          <div className="px-3 py-2 border-b border-white/10">
            <div className="relative">
              <button
                onClick={() => setShowDeviceDropdown((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-brand-medium-dark/50 hover:bg-brand-medium/30 transition-colors text-sm text-brand-lighter cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-blue-400" />
                  <span className="truncate">{selectedDevice.name}</span>
                  <span className="text-xs text-brand-light/50">
                    {selectedDevice.width}×{selectedDevice.height}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDeviceDropdown ? "rotate-180" : ""}`} />
              </button>
              {showDeviceDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-brand-dark border border-white/10 rounded-lg shadow-lg py-1 z-20 max-h-64 overflow-y-auto">
                  {Object.entries(devicesByBrand).map(([brand, devices]) => (
                    <div key={brand}>
                      <div className="px-3 py-1.5 text-xs font-semibold text-brand-light/60 uppercase tracking-wider bg-brand-medium-dark/30">
                        {brand}
                      </div>
                      {devices.map((device) => (
                        <button
                          key={device.name}
                          onClick={() => {
                            setSelectedDevice(device);
                            setShowDeviceDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between ${device.name === selectedDevice.name
                            ? "bg-blue-500/20 text-blue-400"
                            : "text-brand-lighter hover:bg-brand-medium/30"
                            }`}
                        >
                          <span>{device.name}</span>
                          <span className="text-xs text-brand-light/50">
                            {device.width}×{device.height}
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Page Selector */}
          <div className="px-3 py-2 border-b border-white/10">
            <div className="relative">
              <button
                onClick={() => pages.length > 1 && setShowPageDropdown((v) => !v)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg bg-brand-medium-dark/50 transition-colors text-sm text-brand-lighter ${pages.length > 1 ? "hover:bg-brand-medium/30 cursor-pointer" : "cursor-default"
                  }`}
              >
                <span className="truncate">
                  {pages.length === 0 ? "No pages found" : (selectedPage?.name || "Select Page")}
                </span>
                {pages.length > 1 && (
                  <ChevronDown className={`w-4 h-4 transition-transform ${showPageDropdown ? "rotate-180" : ""}`} />
                )}
              </button>
              {showPageDropdown && pages.length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-brand-dark border border-white/10 rounded-lg shadow-lg py-1 z-10 max-h-48 overflow-y-auto">
                  {pages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => {
                        setSelectedPageId(page.id);
                        setShowPageDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors ${page.id === selectedPageId
                        ? "bg-blue-500/20 text-blue-400"
                        : "text-brand-lighter hover:bg-brand-medium/30"
                        }`}
                    >
                      {page.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Preview Content */}
          <div className="p-3">
            {!selectedPageId ? (
              <div
                className="rounded-xl border border-white/10 bg-brand-white/5 flex items-center justify-center text-brand-light/50 text-sm"
                style={{ width: selectedDevice.width, minHeight: Math.min(selectedDevice.height, 640) }}
              >
                {pages.length === 0 ? "Loading pages..." : "Select a page to preview"}
              </div>
            ) : (
              <div
                ref={mobileCanvasRef}
                className="rounded-xl border border-white/10 bg-brand-white/5 overflow-auto"
                style={{
                  width: selectedDevice.width,
                  minHeight: Math.min(selectedDevice.height, 640),
                  maxHeight: "70vh"
                }}
                aria-hidden
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};
