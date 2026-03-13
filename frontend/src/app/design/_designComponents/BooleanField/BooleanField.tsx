import React, { useEffect, useId, useMemo, useState } from "react";
import { useNode } from "@craftjs/core";
import type { Node } from "@craftjs/core";
import { BooleanFieldSettings } from "./BooleanFieldSettings";
import type { BooleanFieldProps } from "../../_types/components";

function ensureOptions(props: Pick<BooleanFieldProps, "options" | "label" | "checked">): NonNullable<BooleanFieldProps["options"]> {
  if (Array.isArray(props.options) && props.options.length > 0) return props.options;
  return [
    { id: "opt-1", label: props.label ?? "Option 1", checked: !!props.checked },
    { id: "opt-2", label: "Option 2", checked: false },
    { id: "opt-3", label: "Option 3", checked: false },
  ];
}

export const BooleanField = ({
  controlType = "checkbox",
  name = "boolean-field",
  disabled = false,
  labelColor = "#000000",
  width = "fit-content",
  height = "fit-content",
  paddingTop = 0,
  paddingRight = 0,
  paddingBottom = 0,
  paddingLeft = 0,
  marginTop = 0,
  marginRight = 0,
  marginBottom = 0,
  marginLeft = 0,
  gap = 10,
  itemGap = 10,
  fontSize = 14,
  fontFamily = "Outfit",
  fontWeight = "500",
  showLabels = true,
  options,
  // back-compat single option
  label,
  checked,
  opacity = 1,
  customClassName = "",
}: BooleanFieldProps) => {
  const { id, connectors: { connect, drag } } = useNode();
  const reactId = useId();
  const groupName = useMemo(() => (controlType === "radio" ? `${name}-${id}` : undefined), [controlType, name, id]);
  const normalizedOptions = useMemo(() => ensureOptions({ options, label, checked }), [options, label, checked]);
  const [previewById, setPreviewById] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    normalizedOptions.forEach((o) => { initial[o.id] = !!o.checked; });
    return initial;
  });

  const radioSelectedId = useMemo(() => {
    if (controlType !== "radio") return null;
    const fromPreview = normalizedOptions.find((o) => previewById[o.id]);
    return fromPreview?.id ?? normalizedOptions[0]?.id ?? null;
  }, [controlType, normalizedOptions, previewById]);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    normalizedOptions.forEach((o) => { next[o.id] = !!o.checked; });
    setPreviewById(next);
  }, [normalizedOptions]);

  return (
    <div
      data-node-id={id}
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={`inline-flex flex-col items-start ${customClassName}`}
      style={{
        width,
        height,
        paddingTop: `${paddingTop}px`,
        paddingRight: `${paddingRight}px`,
        paddingBottom: `${paddingBottom}px`,
        paddingLeft: `${paddingLeft}px`,
        marginTop: `${marginTop}px`,
        marginRight: `${marginRight}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
        gap: `${itemGap}px`,
        opacity,
        cursor: disabled ? "not-allowed" : "default",
        userSelect: "none",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      {normalizedOptions.map((opt, idx) => {
        const inputId = `bf-${id}-${reactId}-${opt.id}`.replace(/[^a-zA-Z0-9-_]/g, "");
        const isChecked = controlType === "radio"
          ? radioSelectedId === opt.id
          : !!previewById[opt.id];

        return (
          <label
            key={opt.id}
            htmlFor={inputId}
            className="inline-flex items-center"
            style={{
              gap: `${gap}px`,
              cursor: disabled ? "not-allowed" : "pointer",
              maxWidth: "100%",
            }}
          >
            <input
              id={inputId}
              type={controlType}
              name={groupName}
              checked={isChecked}
              disabled={disabled}
              onChange={(e) => {
                const nextChecked = e.target.checked;
                setPreviewById((prev) => {
                  if (controlType === "radio") {
                    const next: Record<string, boolean> = {};
                    normalizedOptions.forEach((o) => { next[o.id] = o.id === opt.id ? nextChecked : false; });
                    return next;
                  }
                  return { ...prev, [opt.id]: nextChecked };
                });
              }}
              className="h-4 w-4 accent-brand-blue"
            />

            {showLabels && (
              <span
                style={{
                  color: labelColor,
                  fontSize: `${fontSize}px`,
                  fontFamily,
                  fontWeight,
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={opt.label || `Option ${idx + 1}`}
              >
                {opt.label || `Option ${idx + 1}`}
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
};

export const BooleanFieldDefaultProps: Partial<BooleanFieldProps> = {
  controlType: "checkbox",
  name: "choice",
  disabled: false,
  labelColor: "#000000",
  width: "fit-content",
  height: "fit-content",
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0,
  gap: 10,
  itemGap: 10,
  fontSize: 14,
  fontFamily: "Outfit",
  fontWeight: "500",
  showLabels: true,
  options: [
    { id: "opt-1", label: "Option 1", checked: false },
    { id: "opt-2", label: "Option 2", checked: false },
    { id: "opt-3", label: "Option 3", checked: false },
  ],
  opacity: 1,
};

BooleanField.craft = {
  displayName: "Boolean Field",
  props: BooleanFieldDefaultProps,
  rules: {
    canMoveIn: (incomingNodes: Node[]) =>
      incomingNodes.every((node) => node.data.displayName !== "Page"),
  },
  related: {
    settings: BooleanFieldSettings,
  },
};

