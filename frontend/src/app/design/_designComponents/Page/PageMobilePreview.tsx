"use client";

import React, { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";

const MOBILE_WIDTH = 390;
const MOBILE_MIN_HEIGHT = 640;
const MOBILE_SIDE_GUTTER = 14;
const MOBILE_INNER_WIDTH = MOBILE_WIDTH - MOBILE_SIDE_GUTTER * 2;
const MOBILE_PREVIEW_GAP = 60;

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

function adaptCloneForMobile(root: HTMLElement) {
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
    if (widthPx !== null && widthPx > MOBILE_INNER_WIDTH) {
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
    if (minWidthPx !== null && minWidthPx > MOBILE_INNER_WIDTH) {
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

interface PageMobilePreviewProps {
  pageId: string;
  pageWidth: string;
  pageName: string;
}

export const PageMobilePreview: React.FC<PageMobilePreviewProps> = ({
  pageId,
  pageWidth,
  pageName,
}) => {
  const mobileCanvasRef = useRef<HTMLDivElement | null>(null);
  const { actions, query } = useEditor();

  // Parse page width to calculate mobile preview position
  const pageWidthPx = parsePx(pageWidth) ?? 1920;

  useEffect(() => {
    const mobileRoot = mobileCanvasRef.current;
    if (!mobileRoot) return;

    let frame = 0;

    const renderMobilePreview = () => {
      // Find the page element on the desktop canvas
      const pageEl = document.querySelector(`[data-node-id="${pageId}"]`) as HTMLElement | null;
      if (!pageEl) {
        mobileRoot.innerHTML = "";
        return;
      }

      const clone = pageEl.cloneNode(true) as HTMLElement;
      clone.removeAttribute("data-node-id");
      clone.removeAttribute("data-page-node");
      
      // Remove any nested mobile preview panels from the clone to prevent infinite recursion
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
      clone.style.minHeight = `${MOBILE_MIN_HEIGHT}px`;
      clone.style.transform = "none";
      clone.style.position = "static";
      clone.style.left = "0";
      clone.style.top = "0";
      clone.dataset.mobilePreviewRoot = "true";

      adaptCloneForMobile(clone);
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
      wrapper.style.width = `${MOBILE_WIDTH}px`;
      wrapper.style.minHeight = `${MOBILE_MIN_HEIGHT}px`;
      wrapper.style.height = "auto";
      wrapper.style.overflow = "auto";
      wrapper.style.position = "relative";
      wrapper.style.background = "#e5e7eb";
      wrapper.style.borderRadius = "0.5rem";
      wrapper.style.padding = "0";
      wrapper.style.boxSizing = "border-box";
      wrapper.style.overflowX = "hidden";
      wrapper.appendChild(clone);
      mobileRoot.appendChild(wrapper);
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

      // Scroll to the selected element on the desktop canvas
      const desktopNodeEl = document.querySelector<HTMLElement>(`[data-viewport-desktop] [data-node-id="${nodeId}"]`);
      const canvasContainer = document.querySelector("[data-canvas-container]") as HTMLElement | null;
      if (desktopNodeEl && canvasContainer) {
        const containerRect = canvasContainer.getBoundingClientRect();
        const nodeRect = desktopNodeEl.getBoundingClientRect();
        const centerX = nodeRect.left + nodeRect.width / 2;
        const centerY = nodeRect.top + nodeRect.height / 2;
        const targetScrollLeft = canvasContainer.scrollLeft + (centerX - (containerRect.left + containerRect.width / 2));
        const targetScrollTop = canvasContainer.scrollTop + (centerY - (containerRect.top + containerRect.height / 2));
        canvasContainer.scrollTo({
          left: Math.max(0, targetScrollLeft),
          top: Math.max(0, targetScrollTop),
          behavior: "smooth",
        });
      }

      queueRender();
    };

    const blockCanvasPanFromMobile = (event: Event) => {
      event.stopPropagation();
    };

    // Observe the page element for changes
    const pageEl = document.querySelector(`[data-node-id="${pageId}"]`) as HTMLElement | null;
    const mutation = new MutationObserver(queueRender);
    if (pageEl) {
      mutation.observe(pageEl, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
      });
    }

    const resizeObserver = new ResizeObserver(queueRender);
    if (pageEl) {
      resizeObserver.observe(pageEl);
    }

    mobileRoot.addEventListener("mousedown", handleMobileMouseDown, true);
    mobileRoot.addEventListener("mousedown", blockCanvasPanFromMobile, true);
    mobileRoot.addEventListener("mousemove", blockCanvasPanFromMobile, true);
    mobileRoot.addEventListener("mouseup", blockCanvasPanFromMobile, true);
    mobileRoot.addEventListener("wheel", blockCanvasPanFromMobile, { capture: true });

    queueRender();

    return () => {
      cancelAnimationFrame(frame);
      mutation.disconnect();
      resizeObserver.disconnect();
      mobileRoot.removeEventListener("mousedown", handleMobileMouseDown, true);
      mobileRoot.removeEventListener("mousedown", blockCanvasPanFromMobile, true);
      mobileRoot.removeEventListener("mousemove", blockCanvasPanFromMobile, true);
      mobileRoot.removeEventListener("mouseup", blockCanvasPanFromMobile, true);
      mobileRoot.removeEventListener("wheel", blockCanvasPanFromMobile, true);
    };
  }, [pageId, actions, query]);

  return (
    <div
      data-mobile-preview-panel="true"
      data-page-mobile-preview={pageId}
      className="absolute flex flex-col gap-2 select-none z-10 pointer-events-auto"
      style={{
        left: `${pageWidthPx + MOBILE_PREVIEW_GAP}px`,
        top: 0,
      }}
      onMouseDown={(event) => event.stopPropagation()}
      onMouseMove={(event) => event.stopPropagation()}
      onMouseUp={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
    >
      <span className="text-xs uppercase tracking-wide text-brand-light/70">
        Mobile - {pageName}
      </span>
      <div
        ref={mobileCanvasRef}
        className="w-[390px] min-h-[640px] rounded-lg border border-white/10 bg-brand-white/5 overflow-hidden pointer-events-auto"
        aria-hidden
      />
    </div>
  );
};
