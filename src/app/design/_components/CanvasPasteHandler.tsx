"use client";

import React, { useEffect, useCallback, useRef } from "react";
import { useEditor } from "@craftjs/core";
import { addFileToMediaLibrary } from "../_lib/mediaActions";
import { useDesignProject } from "../_context/DesignProjectContext";
import { Image } from "../_designComponents/Image/Image";

/**
 * Global handler for external paste events (specifically images).
 * Intercepts clipboard events and inserts an Image component if an image is found.
 */
export const CanvasPasteHandler = () => {
  const { actions, query } = useEditor();
  const { projectId } = useDesignProject();

  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const trackMouse = (e: MouseEvent) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", trackMouse, true);
    return () => window.removeEventListener("mousemove", trackMouse, true);
  }, []);

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    // 1. Don't intercept when typing in inputs/textareas
    const target = e.target as HTMLElement;
    if (
      target.isContentEditable ||
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT"
    ) {
      return;
    }

    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;

    // Check if any item is an image
    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        hasImage = true;
        break;
      }
    }

    if (!hasImage) return;

    // 2. We found an image, prevent default browser behavior
    e.preventDefault();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (!file) continue;

        try {
          // 3. Resolve where to paste based on cursor
          const { x, y } = lastMousePos.current;
          const elUnderCursor = document.elementFromPoint(x, y) as HTMLElement | null;
          const nodeEl = elUnderCursor?.closest("[data-node-id]") as HTMLElement | null;
          const hitNodeId = nodeEl?.getAttribute("data-node-id") ?? null;
          
          const state = query.getState();
          const nodes = state.nodes as Record<string, any>;
          
          const resolvePage = (id: string | null): string | null => {
            let curr = id;
            while (curr && curr !== "ROOT") {
              if (nodes[curr]?.data?.displayName === "Page") return curr;
              curr = nodes[curr]?.data?.parent;
            }
            return Object.keys(nodes).find(k => nodes[k]?.data?.displayName === "Page") || null;
          };

          const pageId = resolvePage(hitNodeId);
          const parentId = pageId || "ROOT";
          let imageLeft = 40;
          let imageTop = 40;

          if (pageId) {
            try {
              const pageDom = query.node(pageId).get()?.dom;
              if (pageDom) {
                const rect = pageDom.getBoundingClientRect();
                const baseW = pageDom.offsetWidth || 1;
                const scaleX = rect.width / baseW;
                const baseH = pageDom.offsetHeight || 1;
                const scaleY = rect.height / baseH;
                
                imageLeft = Math.max(0, Math.round((x - rect.left) / scaleX));
                imageTop = Math.max(0, Math.round((y - rect.top) / scaleY));
              }
            } catch (e) {}
          }

          // 4. Upload to project storage
          let imageUrl: string;
          if (projectId) {
            try {
              const mediaItem = await addFileToMediaLibrary(projectId, file);
              imageUrl = mediaItem.url;
            } catch (err) {
              console.error("Paste upload failed:", err);
              imageUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (re) => resolve(re.target?.result as string);
                reader.readAsDataURL(file);
              });
            }
          } else {
            imageUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (re) => resolve(re.target?.result as string);
              reader.readAsDataURL(file);
            });
          }

          // 5. Create and add the Image component
          const imageNode = (
            <Image
              src={imageUrl}
              width="320px"
              height="auto"
              alt="Pasted Image"
              position="absolute"
              top={`${imageTop}px`}
              left={`${imageLeft}px`}
            />
          );

          try {
            const nodeTree = query.parseReactElement(imageNode).toNodeTree();
            const newId = (nodeTree as any).rootNodeId || (nodeTree as any).root;
            
            if ((actions as any).addNodeTree) {
              (actions as any).addNodeTree(nodeTree, parentId);
            } else {
              (actions as any).add(nodeTree, parentId);
            }
            
            if (newId) {
              setTimeout(() => {
                try {
                  actions.selectNode(newId);
                } catch (e) {}
              }, 100);
            }
          } catch (err) {
            console.error("Paste add failed:", err);
          }

        } catch (error) {
          console.error("CanvasPasteHandler: Error processing pasted image:", error);
        }
      }
    }
  }, [actions, query, projectId]);

  useEffect(() => {
    // Using capture phase to ensure we catch the event before other listeners might stop it
    window.addEventListener("paste", handlePaste, true);
    return () => window.removeEventListener("paste", handlePaste, true);
  }, [handlePaste]);

  return null;
};
