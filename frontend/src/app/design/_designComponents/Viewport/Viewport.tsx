import React, { useEffect, useRef } from "react";
import { useNode } from "@craftjs/core";
import type { Node } from "@craftjs/core";

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
      clone.style.pointerEvents = "none";
      clone.style.margin = "0";
      clone.style.transformOrigin = "top left";

      const sourceRect = source.getBoundingClientRect();
      const sourceWidth = Math.max(1, sourceRect.width);
      const sourceHeight = Math.max(1, sourceRect.height);
      const mobileWidth = 390;
      const scale = mobileWidth / sourceWidth;

      clone.style.width = `${sourceWidth}px`;
      clone.style.height = `${sourceHeight}px`;
      clone.style.transform = `scale(${scale})`;

      mobileRoot.innerHTML = "";
      const wrapper = document.createElement("div");
      wrapper.style.width = `${mobileWidth}px`;
      wrapper.style.height = `${Math.max(640, sourceHeight * scale)}px`;
      wrapper.style.overflow = "hidden";
      wrapper.style.position = "relative";
      wrapper.style.background = "#e5e7eb";
      wrapper.style.borderRadius = "0.5rem";
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
          className="w-[390px] min-h-[640px] rounded-lg border border-white/10 bg-brand-white/5 overflow-hidden pointer-events-none"
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
