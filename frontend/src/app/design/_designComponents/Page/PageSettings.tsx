import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { AppearanceGroup } from "../../_components/rightPanel/settings/AppearanceGroup";
import { slugFromName } from "../../_lib/slug";
import type { PageProps, SetProp } from "../../_types";

export const PageSettings = () => {
  const {
    width, height, background, backgroundImage, backgroundSize, backgroundPosition, backgroundRepeat, backgroundOverlay,
    pageName, pageSlug,
    actions: { setProp }
  } = useNode(node => ({
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
  }));

  const typedSetProp = setProp as SetProp<PageProps>;

  const handlePageNameChange = (name: string) => {
    const trimmed = name.trim();
    typedSetProp((props) => {
      props.pageName = trimmed;
      // Only update slug if name is not empty
      if (trimmed) {
        props.pageSlug = slugFromName(trimmed);
      }
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
              value={pageName ?? "Page Name"}
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
                typedSetProp((props) => { props.pageSlug = v; });
              }}
              placeholder="page"
              className="w-full bg-[var(--builder-surface-2)] rounded-lg text-xs text-[var(--builder-text)] px-2.5 py-1.5 focus:outline-none"
            />
            <span className="text-[10px] text-[var(--builder-text-faint)]">Used as path: /{pageSlug ?? "page"}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Width */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-[10px] text-[var(--builder-text)]">Width</label>
              <div className="flex items-center px-2.5 bg-[var(--builder-surface-2)] rounded-lg overflow-hidden">
                <input
                  type="text"
                  value={String(width ?? "").replace("px", "") || "1920"}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^\d*$/.test(v)) {
                      typedSetProp((props) => { props.width = v + "px"; });
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full min-w-0 bg-transparent text-xs text-[var(--builder-text)] p-2 focus:outline-none"
                />
                <span className="text-[10px] text-[var(--builder-text-faint)] pr-2 select-none shrink-0">px</span>
              </div>
            </div>

            {/* Height: Auto or editable Fixed (px) */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-[10px] text-[var(--builder-text)]">Height</label>
              <div className="flex items-center gap-1.5">
                <select
                  value={height === "auto" ? "auto" : "fixed"}
                  onChange={(e) => {
                    if (e.target.value === "auto") {
                      typedSetProp((props) => { props.height = "auto"; });
                    } else {
                      typedSetProp((props) => { props.height = "1200px"; });
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
                          typedSetProp((props) => { props.height = v + "px"; });
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

          {/* Background */}
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
    </div>
  );
};
