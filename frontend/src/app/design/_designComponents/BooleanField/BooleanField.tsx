import React, { useEffect, useId, useMemo, useState } from "react";
import { useNode } from "@craftjs/core";
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

function fluidFontSize(value: number, min = 10): string {
  if (!Number.isFinite(value) || value <= 0) return `${value || 0}px`;
  const preferred = (value / 16 * 2.1).toFixed(2);
  const floor = Math.max(min, Math.round(value * 0.8));
  return `clamp(${floor}px, ${preferred}cqw, ${value}px)`;
}

function fluidSpace(value: number, min = 0): string {
  if (!Number.isFinite(value) || value <= 0) return `${value || 0}px`;
  const preferred = Math.max(0.1, value / 12);
  const floor = Math.max(min, Math.round(value * 0.45));
  return `clamp(${floor}px, ${preferred.toFixed(2)}cqw, ${value}px)`;
}

export const BooleanField = ({
  controlType = "checkbox",
  name = "boolean-field",
  disabled = false,
  labelColor = "#000000",
  color,
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
  fontStyle = "normal",
  lineHeight = 1.2,
  letterSpacing = 0,
  textAlign = "left",
  textTransform = "none",
  textDecoration = "none",
  showLabels = true,
  position = "relative",
  top = "auto",
  right = "auto",
  bottom = "auto",
  left = "auto",
  zIndex = 0,
  display = "inline-flex",
  editorVisibility = "auto",
  alignSelf = "auto",
  options,
  // back-compat single option
  label,
  checked,
  opacity = 1,
  boxShadow = "none",
  overflow = "visible",
  cursor = "default",
  visibility = "visible",
  customClassName = "",
  rotation = 0,
  flipHorizontal = false,
  flipVertical = false,
  isFreeform,
}: BooleanFieldProps) => {
  const { id, connectors: { connect, drag } } = useNode();
  const reactId = useId();
  const effectiveLabelColor = color ?? labelColor;

  // Resolve spacing
  const pt = paddingTop ?? 0;
  const pr = paddingRight ?? 0;
  const pb = paddingBottom ?? 0;
  const pl = paddingLeft ?? 0;
  const mt = marginTop ?? 0;
  const mr = marginRight ?? 0;
  const mb = marginBottom ?? 0;
  const ml = marginLeft ?? 0;

  const normalizedControlType = useMemo(
    () => (String(controlType ?? "checkbox").trim().toLowerCase() === "radio" ? "radio" : "checkbox"),
    [controlType]
  );

  const isRadio = normalizedControlType === "radio";
  const groupName = useMemo(() => (isRadio ? `${name}-${id}` : undefined), [isRadio, name, id]);
  const normalizedOptions = useMemo(() => ensureOptions({ options, label, checked }), [options, label, checked]);
  const [previewById, setPreviewById] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    normalizedOptions.forEach((o) => { initial[o.id] = !!o.checked; });
    return initial;
  });

  const radioSelectedId = useMemo(() => {
    if (!isRadio) return null;
    const fromPreview = normalizedOptions.find((o) => previewById[o.id]);
    return fromPreview?.id ?? normalizedOptions[0]?.id ?? null;
  }, [isRadio, normalizedOptions, previewById]);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    normalizedOptions.forEach((o) => { next[o.id] = !!o.checked; });
    setPreviewById(next);
  }, [normalizedOptions]);

  const fluidFSize = useMemo(() => fluidFontSize(fontSize, 8), [fontSize]);

  const effectiveDisplay = isFreeform
    ? "block"
    : editorVisibility === "hide"
      ? "none"
      : editorVisibility === "show" && display === "none"
        ? "inline-flex"
        : display;

  return (
    <div
      data-node-id={id}
      data-fluid-text="true"
      data-fluid-space="true"
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={customClassName}
      style={{
        paddingTop: fluidSpace(pt),
        paddingRight: fluidSpace(pr),
        paddingBottom: fluidSpace(pb),
        paddingLeft: fluidSpace(pl),
        marginTop: fluidSpace(mt),
        marginRight: fluidSpace(mr),
        marginBottom: fluidSpace(mb),
        marginLeft: fluidSpace(ml),
        width: width ?? "auto",
        height: height ?? "auto",
        gap: fluidSpace(itemGap, 4),
        opacity,
        cursor: disabled ? "not-allowed" : cursor,
        userSelect: "none",
        position,
        top: position !== "static" ? top : undefined,
        right: position !== "static" ? right : undefined,
        bottom: position !== "static" ? bottom : undefined,
        left: position !== "static" ? left : undefined,
        zIndex: zIndex !== 0 ? zIndex : undefined,
        display: effectiveDisplay ?? "inline-flex",
        alignSelf,
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        transform: [rotation ? `rotate(${rotation}deg)` : null, flipHorizontal ? "scaleX(-1)" : null, flipVertical ? "scaleY(-1)" : null].filter(Boolean).join(" ") || undefined,
        visibility: visibility === "hidden" ? "hidden" : "visible",
      }}
    >
      {normalizedOptions.map((opt, idx) => {
        const inputId = `bf-${id}-${reactId}-${opt.id}`.replace(/[^a-zA-Z0-9-_]/g, "");
        const isChecked = isRadio
          ? radioSelectedId === opt.id
          : !!previewById[opt.id];

        return (
          <label
            key={opt.id}
            htmlFor={inputId}
            className="inline-flex items-center flex-wrap"
            style={{
              gap: fluidSpace(gap, 4),
              cursor: disabled ? "not-allowed" : "pointer",
              minWidth: "min-content",
              maxWidth: "100%",
            }}
          >
            <input
              id={inputId}
              type={normalizedControlType}
              name={groupName}
              checked={isChecked}
              disabled={disabled}
              onChange={(e) => {
                const nextChecked = e.target.checked;
                setPreviewById((prev) => {
                  if (isRadio) {
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
                  color: effectiveLabelColor,
                  fontSize: fluidFSize,
                  fontFamily,
                  fontWeight,
                  fontStyle,
                  lineHeight,
                  letterSpacing,
                  textAlign,
                  textTransform,
                  textDecoration,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "normal",
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
  related: {
    settings: BooleanFieldSettings,
  },
};
