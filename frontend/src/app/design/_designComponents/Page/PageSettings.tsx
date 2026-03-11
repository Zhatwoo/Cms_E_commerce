import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { ColorPicker } from "../../_components/rightPanel/settings/inputs/ColorPicker";
import { slugFromName } from "../../_lib/slug";
import type { PageProps, SetProp } from "../../_types";

export const PageSettings = () => {
  const {
    width, height, background, pageName, pageSlug,
    actions: { setProp }
  } = useNode(node => ({
    width: node.data.props.width,
    height: node.data.props.height,
    background: node.data.props.background,
    pageName: node.data.props.pageName,
    pageSlug: node.data.props.pageSlug,
  }));

  const typedSetProp = setProp as SetProp<PageProps>;

  const handlePageNameChange = (name: string) => {
    const trimmed = name.trim() || "Page Name";
    const slug = slugFromName(trimmed);
    typedSetProp((props) => {
      props.pageName = trimmed;
      props.pageSlug = slug;
    });
  };

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Page">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Page name</label>
            <input
              type="text"
              value={pageName ?? "Page Name"}
              onChange={(e) => handlePageNameChange(e.target.value)}
              placeholder="Page Name"
              className="w-full bg-brand-medium-dark rounded-lg text-xs text-brand-lighter px-2.5 py-1.5 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">URL slug</label>
            <input
              type="text"
              value={pageSlug ?? "page"}
              onChange={(e) => {
                const v = e.target.value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "page";
                typedSetProp((props) => { props.pageSlug = v; });
              }}
              placeholder="page"
              className="w-full bg-brand-medium-dark rounded-lg text-xs text-brand-lighter px-2.5 py-1.5 focus:outline-none"
            />
            <span className="text-[10px] text-brand-medium">Used as path: /{pageSlug ?? "page"}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Width */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-[10px] text-brand-lighter">Width</label>
              <div className="flex items-center px-2.5 bg-brand-medium-dark rounded-lg overflow-hidden">
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
                  className="w-full min-w-0 bg-transparent text-xs text-brand-lighter p-2 focus:outline-none"
                />
                <span className="text-[10px] text-brand-medium pr-2 select-none shrink-0">px</span>
              </div>
            </div>

            {/* Height: Auto or editable Fixed (px) */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-[10px] text-brand-lighter">Height</label>
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
                  className="shrink-0 w-14 bg-brand-medium-dark rounded-lg text-xs text-brand-lighter px-2 py-1.5 focus:outline-none appearance-none"
                >
                  <option value="auto">Auto</option>
                  <option value="fixed">Fixed</option>
                </select>
                {height === "auto" ? (
                  <div className="flex-1 flex items-center px-2.5 py-1.5 bg-brand-medium-dark rounded-lg text-xs text-brand-light min-h-[34px]">
                    Auto
                  </div>
                ) : (
                  <div className="flex-1 flex items-center px-2.5 bg-brand-medium-dark rounded-lg overflow-hidden min-w-0">
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
                      className="w-full min-w-0 bg-transparent text-xs text-brand-lighter p-2 focus:outline-none"
                    />
                    <span className="text-[10px] text-brand-medium pr-2 select-none shrink-0">px</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Background */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Background</label>
            <ColorPicker
              value={background ?? "#ffffff"}
              onChange={(val) => typedSetProp((props) => { props.background = val; })}
              className="w-full"
            />
          </div>
        </div>
      </DesignSection>
    </div>
  );
};
