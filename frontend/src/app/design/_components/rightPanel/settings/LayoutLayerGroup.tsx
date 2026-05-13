import React from "react";
import { useEditor } from "@craftjs/core";
import { AutoLayoutGroup } from "./AutoLayoutGroup";
import { GridLayoutGroup } from "./GridLayoutGroup";
import { PositionGroup } from "./PositionGroup";
import type { GridProps, LayoutProps, PositionProps, SetProp } from "../../../_types/components";

interface LayoutLayerGroupProps extends PositionProps, LayoutProps, GridProps {
  nodeId?: string;
  showPosition?: boolean;
  setProp: SetProp<any>;
}

function getChildIds(node: Record<string, any> | null | undefined): string[] {
  if (!node || typeof node !== "object") return [];
  const data = (node.data ?? {}) as Record<string, unknown>;
  const fromNodes = (data.nodes ?? node.nodes) as unknown;
  const nodeIds = Array.isArray(fromNodes) ? (fromNodes as string[]) : [];
  return nodeIds.filter((id) => typeof id === "string" && id);
}

type ChildPositionMode = "flow" | "absolute" | "fixed" | "mixed";

function normalizeChildPosition(value: unknown): "flow" | "absolute" | "fixed" {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "absolute") return "absolute";
  if (raw === "fixed") return "fixed";
  // treat static/relative/sticky/empty as flow
  return "flow";
}

function inferChildPositionMode(positions: unknown[]): ChildPositionMode {
  if (positions.length === 0) return "flow";
  let sawFlow = false;
  let sawAbsolute = false;
  let sawFixed = false;
  for (const pos of positions) {
    const n = normalizeChildPosition(pos);
    if (n === "flow") sawFlow = true;
    if (n === "absolute") sawAbsolute = true;
    if (n === "fixed") sawFixed = true;
  }
  const buckets = Number(sawFlow) + Number(sawAbsolute) + Number(sawFixed);
  if (buckets > 1) return "mixed";
  if (sawAbsolute) return "absolute";
  if (sawFixed) return "fixed";
  return "flow";
}

export const LayoutLayerGroup = ({
  nodeId,
  showPosition = true,
  position = "static",
  display = "flex",
  isFreeform = false,
  alignSelf = "auto",
  zIndex = 0,
  top = "auto",
  right = "auto",
  bottom = "auto",
  left = "auto",
  editorVisibility = "auto",
  flexDirection = "column",
  flexWrap = "nowrap",
  alignItems = "flex-start",
  justifyContent = "flex-start",
  gap = 0,
  gridTemplateColumns = "1fr 1fr",
  gridTemplateRows = "auto",
  gridGap = 0,
  gridColumnGap = 0,
  gridRowGap = 0,
  gridAutoRows = "auto",
  gridAutoFlow = "row",
  setProp,
}: LayoutLayerGroupProps) => {
  const isFlexDisplay = display === "flex" || display === "inline-flex";
  const isGridDisplay = display === "grid";
    const { actions, query } = useEditor();
    const { childIds, childPositions, isPage } = useEditor((state) => {
        if (!nodeId) return { childIds: [] as string[], childPositions: [] as unknown[], isPage: false };
        const parentNode = state.nodes?.[nodeId] as any;
        const ids = getChildIds(parentNode);
        const positions = ids.map((id) => (state.nodes?.[id] as any)?.data?.props?.position);
        const isPage = parentNode?.data?.displayName === "Page";
        return { childIds: ids, childPositions: positions, isPage };
    });

    const childMode = React.useMemo(() => inferChildPositionMode(childPositions), [childPositions]);
    const hasChildren = childIds.length > 0;
    const canShowAlignment =
        !isFreeform && (isFlexDisplay || isGridDisplay) && (!hasChildren || childMode === "flow");

    const setChildrenPositionMode = React.useCallback(
        (mode: ChildPositionMode) => {
            if (!nodeId) return;
            if (!childIds.length) return;
            if (mode === "mixed") return;

            // When children are set to absolute, the parent should be at least relative
            if (mode === "absolute" && !isPage) {
                setProp((parentProps: Record<string, unknown>) => {
                    const parentPos = String(parentProps.position ?? "static");
                    if (!parentPos || parentPos === "static") {
                        parentProps.position = "relative";
                    }
                });
            }

            for (const childId of childIds) {
                actions.setProp(childId, (props: Record<string, unknown>) => {
                    if (mode === "flow") {
                        props.position = "relative";
                        props.left = "auto";
                        props.top = "auto";
                        props.right = "auto";
                        props.bottom = "auto";
                        return;
                    }

                    if (mode === "absolute" || mode === "fixed") {
                        const nextPos = mode === "absolute" ? "absolute" : "fixed";
                        props.position = nextPos;
                        const left = String(props.left ?? "auto");
                        const top = String(props.top ?? "auto");
                        props.left = !left || left === "auto" ? "0px" : props.left;
                        props.top = !top || top === "auto" ? "0px" : props.top;
                        props.right = props.right ?? "auto";
                        props.bottom = props.bottom ?? "auto";
                        return;
                    }
                });
            }
        },
        [actions, childIds, nodeId, setProp, isPage]
    );

    return (
        <div className="flex flex-col gap-5">
            {/* Layout Mode Toggle */}
            <div className="flex flex-col gap-2">
                <label className="text-[12px] text-[var(--builder-text)] font-base">Layout Mode</label>
                <div className="flex items-center gap-1 bg-[var(--builder-surface-2)] rounded-[10px] border border-[var(--builder-border)] p-0.5">
                    <button
                        type="button"
                        onClick={() => {
                            setProp((props: any) => {
                                props.isFreeform = true;
                                props.display = "block";
                                if (!isPage) props.position = "absolute";
                            });
                            if (hasChildren) {
                                setChildrenPositionMode("absolute");
                            }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs flex-1 transition-colors ${isFreeform
                            ? "bg-[var(--builder-surface-3)] text-[var(--builder-text)] shadow-sm"
                            : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"
                            }`}
                        title="Freeform (Figma canvas-like)"
                    >
                        Freeform
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setProp((props: any) => {
                                props.isFreeform = false;
                                if (!props.display || props.display === "block" || props.display === "none") {
                                    props.display = "flex";
                                }
                                if (!isPage) props.position = "relative";
                            });
                            if (hasChildren) {
                                setChildrenPositionMode("flow");
                            }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs flex-1 transition-colors ${!isFreeform
                            ? "bg-[var(--builder-accent)] text-black font-medium"
                            : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"
                            }`}
                        title="Auto Layout (Flex/Grid)"
                    >
                        Auto
                    </button>
        </div>
      </div>

      {showPosition && (
        <PositionGroup
          position={position}
          display={display}
          alignSelf={alignSelf}
          zIndex={zIndex}
          top={top}
          right={right}
          bottom={bottom}
          left={left}
          editorVisibility={editorVisibility}
          setProp={setProp as any}
        />
      )}

      {nodeId && hasChildren ? (
        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-[var(--builder-text)] font-base">Children Position</label>
          <div className="bg-[var(--builder-surface-2)] px-2 rounded-lg border border-[var(--builder-border)]">
            <select
              className="w-full text-xs bg-[var(--builder-surface-2)] text-[var(--builder-text)] py-1.5 px-1.5 focus:outline-none appearance-none"
              value={childMode}
              onChange={(e) => setChildrenPositionMode(e.target.value as ChildPositionMode)}
              title="Controls whether children participate in layout flow (needed for alignment/distribution)"
            >
              <option value="flow">Flow (Relative)</option>
              <option value="absolute">Absolute</option>
              <option value="fixed">Fixed</option>
              {childMode === "mixed" ? <option value="mixed">Mixed</option> : null}
            </select>
          </div>

          {childMode !== "flow" ? (
            <div className="text-[11px] text-[var(--builder-text-muted)] leading-relaxed">
              Alignment/Distribution only works when children are in{" "}
              <span className="text-[var(--builder-text)]">Flow (Relative)</span>.
            </div>
          ) : null}
        </div>
      ) : null}

      {isFreeform ? (
        <div className="text-[11px] text-[var(--builder-text-muted)] leading-relaxed italic bg-[var(--builder-surface-2)] p-3 rounded-lg border border-[var(--builder-border)]">
          Auto Layout is disabled in <span className="text-[var(--builder-text)] font-medium">Freeform</span> mode. Elements can be placed anywhere using absolute coordinates.
        </div>
      ) : (
        <>
          {!canShowAlignment && (isFlexDisplay || isGridDisplay) ? (
            <button
              type="button"
              onClick={() => setChildrenPositionMode("flow")}
              className="w-full bg-[var(--builder-surface-2)] hover:bg-[var(--builder-surface-hover)] border border-[var(--builder-border)] rounded-lg py-2 text-xs text-[var(--builder-text)] transition-colors"
            >
              Set children to Flow (Relative) to enable alignment
            </button>
          ) : null}

          {canShowAlignment && isFlexDisplay ? (
            <AutoLayoutGroup
              flexDirection={flexDirection}
              flexWrap={flexWrap}
              alignItems={alignItems}
              justifyContent={justifyContent}
              gap={gap}
              setProp={setProp as any}
            />
          ) : canShowAlignment && isGridDisplay ? (
            <GridLayoutGroup
              gridTemplateColumns={gridTemplateColumns}
              gridTemplateRows={gridTemplateRows}
              gridGap={gridGap}
              gridColumnGap={gridColumnGap}
              gridRowGap={gridRowGap}
              gridAutoRows={gridAutoRows}
              gridAutoFlow={gridAutoFlow}
              setProp={setProp as any}
            />
          ) : (
            <div className="text-[11px] text-[var(--builder-text-muted)] leading-relaxed">
              Set <span className="text-[var(--builder-text)]">Display</span> to{" "}
              <span className="text-[var(--builder-text)]">Flex</span> or{" "}
              <span className="text-[var(--builder-text)]">Grid</span> to enable alignment and
              distribution.
            </div>
          )}
        </>
      )}
    </div>
  );
};
