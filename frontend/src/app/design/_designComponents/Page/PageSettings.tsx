import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { AppearanceGroup } from "../../_components/rightPanel/settings/AppearanceGroup";
import { LayoutLayerGroup } from "../../_components/rightPanel/settings/LayoutLayerGroup";
import { slugFromName } from "../../_lib/slug";
import type { PageProps, SetProp } from "../../_types";

const PAGE_SIZE_PRESETS = [
  { label: "Large Desktop", width: 1920, height: 900 },
  { label: "Desktop", width: 1440, height: 900 },
  { label: "Laptop", width: 1366, height: 768 },
  { label: "Tablet", width: 834, height: 1112 },
  { label: "Mobile", width: 390, height: 844 },
] as const;

const parsePx = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/px$/i, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const PageSettings = () => {
  const {
    id,
    width,
    height,
    background,
    backgroundImage,
    backgroundSize,
    backgroundPosition,
    backgroundRepeat,
    backgroundOverlay,
    pageName,
    pageSlug,
    position, display, isFreeform, alignItems, justifyContent, flexDirection, flexWrap, gap, editorVisibility,
    gridTemplateColumns, gridTemplateRows, gridGap, gridColumnGap, gridRowGap, gridAutoRows, gridAutoFlow,
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
    width: node.data.props.width,
    height: node.data.props.height,
    background: node.data.props.background,
    backgroundImage: node.data.props.backgroundImage,
    backgroundSize: node.data.props.backgroundSize,
    backgroundPosition: node.data.props.backgroundPosition,
    backgroundRepeat: node.data.props.backgroundRepeat,
    backgroundOverlay: node.data.props.backgroundOverlay,
    pageName: node.data.props.pageName,
    pageSlug: node.data.props.pageSlug,
    position: node.data.props.position,
    display: node.data.props.display,
    isFreeform: node.data.props.isFreeform,
    alignItems: node.data.props.alignItems,
    justifyContent: node.data.props.justifyContent,
    flexDirection: node.data.props.flexDirection,
    flexWrap: node.data.props.flexWrap,
    gap: node.data.props.gap,
    editorVisibility: node.data.props.editorVisibility,
    gridTemplateColumns: node.data.props.gridTemplateColumns,
    gridTemplateRows: node.data.props.gridTemplateRows,
    gridGap: node.data.props.gridGap,
    gridColumnGap: node.data.props.gridColumnGap,
    gridRowGap: node.data.props.gridRowGap,
    gridAutoRows: node.data.props.gridAutoRows,
    gridAutoFlow: node.data.props.gridAutoFlow,
  }));

  const typedSetProp = setProp as SetProp<PageProps>;
  const currentWidth = parsePx(width);
  const currentHeight = parsePx(height);

  const handlePageNameChange = (name: string) => {
    const trimmed = name.trim();
    typedSetProp((props) => {
      props.pageName = trimmed;
      if (trimmed) {
        props.pageSlug = slugFromName(trimmed);
      }
    });
  };

  const applyPreset = (preset: (typeof PAGE_SIZE_PRESETS)[number]) => {
    typedSetProp((props) => {
      props.width = `${preset.width}px`;
      props.height = `${preset.height}px`;
    });
  };

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Page">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Page name</label>
            <input
              type="text"
              value={pageName ?? ""}
              onChange={(e) => handlePageNameChange(e.target.value)}
              placeholder="Page Name"
              className="w-full bg-[var(--builder-surface-2)] rounded-lg text-xs text-[var(--builder-text)] px-2.5 py-1.5 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">URL slug</label>
            <input
              type="text"
              value={pageSlug ?? "page"}
              onChange={(e) => {
                const v = e.target.value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "page";
                typedSetProp((props) => {
                  props.pageSlug = v;
                });
              }}
              placeholder="page"
              className="w-full bg-[var(--builder-surface-2)] rounded-lg text-xs text-[var(--builder-text)] px-2.5 py-1.5 focus:outline-none"
            />
            <span className="text-[10px] text-[var(--builder-text-faint)]">Used as path: /{pageSlug ?? "page"}</span>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Page size</label>
            <div className="grid grid-cols-2 gap-2">
              {PAGE_SIZE_PRESETS.map((preset) => {
                const isActive = currentWidth === preset.width && currentHeight === preset.height;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`rounded-lg border px-2.5 py-2 text-left transition-colors ${isActive
                      ? "border-[var(--builder-accent)] bg-[var(--builder-accent)]/10 text-[var(--builder-text)]"
                      : "border-[var(--builder-border)] bg-[var(--builder-surface-2)] text-[var(--builder-text-muted)] hover:border-[var(--builder-border-mid)] hover:text-[var(--builder-text)]"
                    }`}
                  >
                    <div className="text-xs font-semibold">{preset.label}</div>
                    <div className="text-[10px] text-[var(--builder-text-faint)]">
                      {preset.width} × {preset.height}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-[10px] text-[var(--builder-text)]">Width</label>
              <div className="flex items-center px-2.5 bg-[var(--builder-surface-2)] rounded-lg overflow-hidden">
                <input
                  type="text"
                  value={String(width ?? "").replace("px", "") || "1920"}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^\d*$/.test(v)) {
                      typedSetProp((props) => {
                        props.width = `${v}px`;
                      });
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full min-w-0 bg-transparent text-xs text-[var(--builder-text)] p-2 focus:outline-none"
                />
                <span className="text-[10px] text-[var(--builder-text-faint)] pr-2 select-none shrink-0">px</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-[10px] text-[var(--builder-text)]">Height</label>
              <div className="flex items-center gap-1.5">
                <select
                  value={height === "auto" ? "auto" : "fixed"}
                  onChange={(e) => {
                    if (e.target.value === "auto") {
                      typedSetProp((props) => {
                        props.height = "auto";
                      });
                    } else {
                      typedSetProp((props) => {
                        props.height = "1200px";
                      });
                    }
                  }}
                  className="shrink-0 w-14 bg-[var(--builder-surface-2)] rounded-lg text-xs text-[var(--builder-text)] px-2 py-1.5 focus:outline-none appearance-none"
                >
                  <option value="auto">Auto</option>
                  <option value="fixed">Fixed</option>
                </select>
                {height === "auto" ? (
                  <div className="flex-1 flex items-center px-2.5 py-1.5 bg-[var(--builder-surface-2)] rounded-lg text-xs text-[var(--builder-text-muted)] min-h-[34px]">
                    Auto
                  </div>
                ) : (
                  <div className="flex-1 flex items-center px-2.5 bg-[var(--builder-surface-2)] rounded-lg overflow-hidden min-w-0">
                    <input
                      type="text"
                      value={String(height ?? "").replace("px", "") || "1200"}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^\d*$/.test(v)) {
                          typedSetProp((props) => {
                            props.height = `${v}px`;
                          });
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-full min-w-0 bg-transparent text-xs text-[var(--builder-text)] p-2 focus:outline-none"
                    />
                    <span className="text-[10px] text-[var(--builder-text-faint)] pr-2 select-none shrink-0">px</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <AppearanceGroup
            background={background}
            backgroundImage={backgroundImage}
            backgroundSize={backgroundSize}
            backgroundPosition={backgroundPosition}
            backgroundRepeat={backgroundRepeat}
            backgroundOverlay={backgroundOverlay}
            enableMediaFillModes
            setProp={typedSetProp as any}
          />
        </div>
      </DesignSection>

      <DesignSection title="Layout & Layer" defaultOpen={false}>
        <LayoutLayerGroup
          nodeId={id}
          showPosition={false}
          position={position}
          display={display}
          isFreeform={isFreeform}
          alignItems={alignItems}
          justifyContent={justifyContent}
          flexDirection={flexDirection}
          flexWrap={flexWrap}
          gap={gap}
          editorVisibility={editorVisibility}
          gridTemplateColumns={gridTemplateColumns}
          gridTemplateRows={gridTemplateRows}
          gridGap={gridGap}
          gridColumnGap={gridColumnGap}
          gridRowGap={gridRowGap}
          gridAutoRows={gridAutoRows}
          gridAutoFlow={gridAutoFlow}
          setProp={typedSetProp as any}
        />
      </DesignSection>
    </div>
  );
};
