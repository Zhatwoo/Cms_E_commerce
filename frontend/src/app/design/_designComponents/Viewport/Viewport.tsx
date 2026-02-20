import React, { useEffect, useRef } from "react";
import { useNode } from "@craftjs/core";
import type { Node } from "@craftjs/core";

const MOBILE_WIDTH = 390;
const MOBILE_MIN_HEIGHT = 640;

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
    item.style.display = "block";
    item.style.width = "100%";
    item.style.textAlign = "left";
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
  header.appendChild(logo);
  header.appendChild(toggle);
  header.insertAdjacentElement("afterend", shell);
  return header;
}

function adaptCloneForMobile(root: HTMLElement) {
  const mobileNavHeader = applyHamburgerIfNeeded(root);
  const all = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

  all.forEach((el) => {
    el.removeAttribute("data-node-id");

    el.style.maxWidth = "100%";

    if (el === root) {
      el.style.overflowX = "hidden";
    }

    const isMobileNavHeader = el === mobileNavHeader || el.dataset.mobileNavRoot === "true";
    const isMobileNavShell = el.dataset.mobileNavShell === "true";

    const position = (el.style.position || "").toLowerCase();
    if (position === "absolute" || position === "fixed") {
      const hasText = (el.textContent || "").trim().length > 0;
      if (hasText || !!el.closest("[data-mobile-nav-root='true']")) {
        el.style.position = "static";
        el.style.top = "auto";
        el.style.right = "auto";
        el.style.bottom = "auto";
        el.style.left = "auto";
        el.style.transform = "none";
      }
    }

    const widthPx = parsePx(el.style.width);
    if (widthPx !== null && widthPx > MOBILE_WIDTH) {
      el.style.width = "100%";
    }

    const leftPx = parsePx(el.style.left);
    if (leftPx !== null && leftPx > 8) {
      el.style.left = "0px";
    }

    if ((el.style.display || "").toLowerCase() === "grid") {
      const gridCols = (el.style.gridTemplateColumns || "").trim();
      if (gridCols.includes(" ")) {
        el.style.gridTemplateColumns = "1fr";
      }
    }

    if ((el.style.display || "").toLowerCase() === "flex") {
      const direction = (el.style.flexDirection || "row").toLowerCase();
      if (direction === "row" && !isMobileNavHeader && !isMobileNavShell) {
        const childCount = asElements(el.children).length;
        if (childCount > 1) {
          el.style.flexDirection = "column";
          el.style.alignItems = "stretch";
          el.style.justifyContent = "flex-start";
          if (!el.style.gap) el.style.gap = "10px";
        }
      }
    }

    const fontPx = parsePx(el.style.fontSize);
    if (fontPx !== null && fontPx > 20) {
      el.style.fontSize = `${Math.round(fontPx * 0.8)}px`;
    }
  });
}

export const Viewport = ({ children }: { children?: React.ReactNode }) => {
  const desktopCanvasRef = useRef<HTMLDivElement | null>(null);
  const mobileCanvasRef = useRef<HTMLDivElement | null>(null);
  const { connectors: { connect, drag } } = useNode();

  useEffect(() => {
    const desktopRoot = desktopCanvasRef.current;
    const mobileRoot = mobileCanvasRef.current;
    if (!desktopRoot || !mobileRoot) return;

    let frame = 0;

    const renderMobilePreview = () => {
      const source = desktopRoot.querySelector("[data-node-id]") as HTMLElement | null;
      if (!source) {
        mobileRoot.innerHTML = "";
        return;
      }

      const clone = source.cloneNode(true) as HTMLElement;
      clone.removeAttribute("data-node-id");
      clone.style.pointerEvents = "auto";
      clone.style.margin = "0";
      clone.style.transformOrigin = "top left";
      clone.style.width = "100%";
      clone.style.height = "auto";
      clone.style.transform = "none";

      adaptCloneForMobile(clone);

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
      wrapper.appendChild(clone);
      mobileRoot.appendChild(wrapper);
    };

    const queueRender = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(renderMobilePreview);
    };

    const mutation = new MutationObserver(queueRender);
    mutation.observe(desktopRoot, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    });

    const resizeObserver = new ResizeObserver(queueRender);
    resizeObserver.observe(desktopRoot);

    queueRender();

    return () => {
      cancelAnimationFrame(frame);
      mutation.disconnect();
      resizeObserver.disconnect();
    };
  }, [children]);

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className="flex gap-16 p-20 min-w-max min-h-max items-start"
    >
      <div className="flex flex-col gap-2" ref={desktopCanvasRef}>
        <span className="text-xs uppercase tracking-wide text-brand-light/70">Desktop</span>
        {children}
      </div>

      <div className="flex flex-col gap-2 select-none">
        <span className="text-xs uppercase tracking-wide text-brand-light/70">Mobile</span>
        <div
          ref={mobileCanvasRef}
          className="w-[390px] min-h-[640px] rounded-lg border border-white/10 bg-brand-white/5 overflow-hidden pointer-events-auto"
          aria-hidden
        />
      </div>
    </div>
  );
};

Viewport.craft = {
  displayName: "Viewport",
  rules: {
    canMoveIn: (incomingNodes: Node[]) =>
      incomingNodes.every((node) => node.data.displayName === "Page"),
  }
};
