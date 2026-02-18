import React, { useState, useCallback } from "react";
import { useNode } from "@craftjs/core";
import { PageSettings } from "./PageSettings";
import type { PageProps } from "../../_types";
import { slugFromName } from "../../_lib/slug";

export const Page = ({
  children,
  width = "1000px",
  height = "auto",
  background = "#ffffff",
  pageName = "Page Name",
}: PageProps) => {
  const { id, connectors: { connect, drag }, actions: { setProp } } = useNode();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(pageName);

  const handleBlur = useCallback(() => {
    setEditing(false);
    const trimmed = editValue.trim() || "Page Name";
    const slug = slugFromName(trimmed);
    setProp((props: Record<string, unknown>) => {
      props.pageName = trimmed;
      props.pageSlug = slug;
    });
  }, [editValue, setProp]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        (e.target as HTMLInputElement).blur();
      }
      if (e.key === "Escape") {
        setEditValue(pageName);
        setEditing(false);
      }
    },
    [pageName]
  );

  return (
    <div
      data-node-id={id}
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className="rounded-lg shadow-xl relative min-h-[600px] transition-[outline] duration-150"
      style={{
        width,
        height: height === "auto" ? "auto" : height,
        minHeight: "800px",
        backgroundColor: background,
      }}
    >
      <div className="absolute -top-8 left-0 text-brand-lighter font-bold text-2xl opacity-50 select-none min-w-[120px]">
        {editing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="bg-brand-dark/90 border border-brand-medium rounded px-2 py-0.5 text-lg text-brand-lighter focus:outline-none focus:border-blue-500 w-full max-w-[240px]"
            data-panel="page-name-edit"
          />
        ) : (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditValue(pageName);
              setEditing(true);
            }}
            className="cursor-text hover:opacity-80"
          >
            {pageName}
          </span>
        )}
      </div>
      {children}
    </div>
  );
};

export const PageDefaultProps: Partial<PageProps> = {
  width: "1000px",
  height: "auto",
  background: "#E6E6E9",
  pageName: "Page Name",
};

Page.craft = {
  displayName: "Page",
  props: PageDefaultProps,
  rules: {
    canDrag: () => true,
  },
  related: {
    settings: PageSettings,
  },
};
