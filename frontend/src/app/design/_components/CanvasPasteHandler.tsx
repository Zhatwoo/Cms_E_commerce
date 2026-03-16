"use client";

import React, { useEffect, useCallback } from "react";
import { useEditor } from "@craftjs/core";
import { uploadMediaApi } from "@/lib/api";
import { useDesignProject } from "../_context/DesignProjectContext";
import { Image } from "../_designComponents/Image/Image";

/**
 * Global handler for external paste events (specifically images).
 * Intercepts clipboard events and inserts an Image component if an image is found.
 */
export const CanvasPasteHandler = () => {
  const { actions, query } = useEditor();
  const { projectId } = useDesignProject();

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
    // This stops the browser from doing anything with the image data (like pasting into a hidden div)
    e.preventDefault();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (!file) continue;

        try {
          let imageUrl: string;

          // 3. Upload to project storage if possible, otherwise fallback to base64
          if (projectId) {
            try {
              const result = await uploadMediaApi(projectId, file, { folder: "images" });
              imageUrl = result.url;
            } catch (err) {
              console.error("Paste upload failed, falling back to local data URL:", err);
              imageUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target?.result as string);
                reader.readAsDataURL(file);
              });
            }
          } else {
            imageUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (event) => resolve(event.target?.result as string);
              reader.readAsDataURL(file);
            });
          }

          // 4. Determine where to paste
          const state = query.getState();
          const selectedSets = state.events.selected;
          const selectedIds = Array.from(selectedSets);
          
          let parentId = "ROOT";
          
          // Try to use selected container/page as parent
          if (selectedIds.length > 0) {
            const firstId = selectedIds[0];
            const node = state.nodes[firstId];
            if (node?.data?.isCanvas) {
              parentId = firstId;
            } else {
              parentId = node?.data?.parent || "ROOT";
            }
          }

          // Better default: Find the first page's main container if parent is ROOT or Viewport
          if (parentId === "ROOT" || (state.nodes[parentId] && state.nodes[parentId].data.displayName === "Viewport")) {
            const rootNode = state.nodes["ROOT"];
            const viewportId = rootNode?.data?.nodes?.[0];
            if (viewportId) {
              const viewportNode = state.nodes[viewportId];
              const firstPageId = viewportNode?.data?.nodes?.[0];
              if (firstPageId) {
                const firstPageNode = state.nodes[firstPageId];
                const firstContainerId = firstPageNode?.data?.nodes?.[0];
                parentId = firstContainerId || firstPageId;
              } else {
                parentId = viewportId;
              }
            }
          }

          // 5. Create and add the Image component
          // We use absolute positioning so it appears exactly where it's pasted (defaulting to top-left of parent)
          const imageNode = (
            <Image
              src={imageUrl}
              width="320px"
              height="auto"
              alt="Pasted Image"
              position="absolute"
              top="40px"
              left="40px"
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
            
            // Select the newly added node in the next tick
            if (newId) {
              setTimeout(() => {
                try {
                  actions.selectNode(newId);
                } catch (e) {
                  // node might not be ready
                }
              }, 100);
            }
          } catch (err) {
            console.error("Paste add failed:", err);
            // Fallback for some Craft.js versions
            (actions as any).add(imageNode, parentId);
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
