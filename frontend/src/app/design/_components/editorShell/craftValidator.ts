import * as React from "react";
import { RenderBlocks } from "../../_designComponents";
import { Container } from "../../_designComponents/Container/Container";
import { Text } from "../../_designComponents/Text/Text";
import { Image } from "../../_designComponents/Image/Image";
import { Page } from "../../_designComponents/Page/Page";
import { Viewport } from "../../_designComponents/Viewport/Viewport";
import { CRAFT_RESOLVER } from "../craftResolver";

const SAFE_CONTAINER: React.ComponentType<unknown> =
  (typeof Container === "function" ? Container : null) ??
  ((props: unknown) => React.createElement("div", null, (props as any)?.children));

const asComponent = (value: unknown): React.ComponentType<unknown> =>
  typeof value === "function" ? (value as React.ComponentType<unknown>) : SAFE_CONTAINER;

const VALIDATOR_RESOLVER: Record<string, React.ComponentType<unknown>> = {
  ...RenderBlocks,
  ...CRAFT_RESOLVER,
  Container: SAFE_CONTAINER,
  container: SAFE_CONTAINER,
  CONTAINER: SAFE_CONTAINER,
  Text: asComponent(Text),
  text: asComponent(Text),
  TEXT: asComponent(Text),
  Image: asComponent(Image),
  image: asComponent(Image),
  IMAGE: asComponent(Image),
  Page: asComponent(Page),
  page: asComponent(Page),
  PAGE: asComponent(Page),
  Viewport: asComponent(Viewport),
  viewport: asComponent(Viewport),
  VIEWPORT: asComponent(Viewport),
};

const VALIDATOR_CANONICAL_NAME_BY_LOWER = new Map<string, string>();
for (const key of Object.keys(VALIDATOR_RESOLVER)) {
  const lowered = key.toLowerCase();
  if (!VALIDATOR_CANONICAL_NAME_BY_LOWER.has(lowered)) {
    VALIDATOR_CANONICAL_NAME_BY_LOWER.set(lowered, key);
  }
}

export function normalizeResolvedName(rawName: unknown): string {
  const name = typeof rawName === "string" ? rawName.trim() : "";
  if (!name) return "Container";
  const lowered = name.toLowerCase();
  const exact = VALIDATOR_CANONICAL_NAME_BY_LOWER.get(lowered);
  if (exact) return exact;
  if (lowered.includes("image")) return "Image";
  if (lowered.includes("text")) return "Text";
  if (lowered.includes("container")) return "Container";
  if (lowered.includes("page")) return "Page";
  if (lowered.includes("viewport")) return "Viewport";
  return "Container";
}

/**
 * Deep validation function that walks through the entire Craft.js node tree
 * and ensures all node references are valid.
 */
export function validateCraftData(jsonString: string): { valid: boolean; data?: string } {
  try {
    const parsed = JSON.parse(jsonString);

    // Must have ROOT
    if (!parsed || !parsed.ROOT) {
      console.error('❌ Validation failed: Missing ROOT node');
      return { valid: false };
    }

    // ROOT must have basic structure
    if (!parsed.ROOT.type || !parsed.ROOT.type.resolvedName) {
      console.error('❌ Validation failed: ROOT missing type.resolvedName');
      return { valid: false };
    }

    if (!Array.isArray(parsed.ROOT.nodes)) {
      console.error('❌ Validation failed: ROOT.nodes is not an array');
      return { valid: false };
    }

    // Collect all valid nodes - be VERY strict about what makes a node valid
    const allNodeIds = Object.keys(parsed);
    const invalidNodes: string[] = [];
    const validNodeIds = new Set(allNodeIds.filter((id: string) => {
      const node = parsed[id];

      // Must be an object
      if (!node || typeof node !== 'object') {
        invalidNodes.push(id);
        return false;
      }

      // Must have type property
      if (!node.type) {
        invalidNodes.push(id);
        return false;
      }

      const resolvedName = normalizeResolvedName(
        typeof node.type === "string" ? node.type : node.type?.resolvedName
      );
      if (typeof node.type === "string") {
        node.type = { resolvedName };
      } else {
        node.type.resolvedName = resolvedName;
      }

      // Must have nodes array (even if empty)
      if (!Array.isArray(node.nodes)) {
        node.nodes = [];
      }

      return true;
    }));

    // If too many invalid nodes, abort
    if (invalidNodes.length > allNodeIds.length * 0.5) {
      console.error(`❌ Too many invalid nodes (${invalidNodes.length}/${allNodeIds.length}). Data is too corrupted.`);
      return { valid: false };
    }

    // Recursively validate and clean all node references
    let hasInvalidRefs = false;
    let removedRefsCount = 0;

    function cleanNodeRefs(nodeId: string, visited = new Set<string>()): void {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = parsed[nodeId];
      if (!node) return;

      if (Array.isArray(node.nodes)) {
        const originalLength = node.nodes.length;
        node.nodes = node.nodes.filter((childId: string) => {
          if (!validNodeIds.has(childId)) {
            hasInvalidRefs = true;
            removedRefsCount++;
            return false;
          }
          return true;
        });

        if (node.nodes.length !== originalLength) {
          hasInvalidRefs = true;
        }

        node.nodes.forEach((childId: string) => cleanNodeRefs(childId, visited));
      }

      if (node.linkedNodes && typeof node.linkedNodes === 'object') {
        for (const [key, linkedId] of Object.entries(node.linkedNodes)) {
          if (typeof linkedId === 'string' && !validNodeIds.has(linkedId)) {
            delete node.linkedNodes[key];
            hasInvalidRefs = true;
            removedRefsCount++;
          }
        }
      }
    }

    cleanNodeRefs('ROOT');

    invalidNodes.forEach((id: string) => {
      delete parsed[id];
    });

    Object.keys(parsed).forEach((id: string) => {
      const node = parsed[id];
      if (!node || typeof node !== "object") return;
      const canonical = normalizeResolvedName(
        typeof node.type === "string" ? node.type : node.type?.resolvedName
      );
      if (typeof node.type === "string") {
        node.type = { resolvedName: canonical };
      } else if (node.type && typeof node.type === "object") {
        node.type.resolvedName = canonical;
      } else {
        node.type = { resolvedName: canonical };
      }
      node.displayName = canonical;
    });

    const finalJson = JSON.stringify(parsed);

    if (hasInvalidRefs && removedRefsCount > 0) {
      console.warn(`Editor data cleaned: removed ${removedRefsCount} invalid references.`);
    }

    return { valid: true, data: finalJson };
  } catch (error) {
    console.error('❌ Validation error:', error);
    return { valid: false };
  }
}

export function prepareFrameData(jsonString: string): { valid: boolean; data?: string } {
  return validateCraftData(jsonString);
}
