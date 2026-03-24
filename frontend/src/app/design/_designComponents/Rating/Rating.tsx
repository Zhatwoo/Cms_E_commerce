import React from "react";
import { useNode } from "@craftjs/core";
import { Star } from "lucide-react";
import { RatingSettings } from "./RatingSettings";
import type { RatingProps } from "../../_types/components";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function fluidSpace(value: number, min = 0): string {
  if (!Number.isFinite(value) || value <= 0) return `${value || 0}px`;
  const preferred = Math.max(0.1, value / 12);
  const floor = Math.max(min, Math.round(value * 0.45));
  return `clamp(${floor}px, ${preferred.toFixed(2)}cqw, ${value}px)`;
}

export const Rating = ({
  value = 4.2,
  max = 5,
  allowFractional = false,
  size = 36,
  gap = 12,
  valueGap = 8,
  filledColor = "#f7c200",
  emptyColor = "#6b6b6b",
  showValue = false,
  valueText,
  interactive = false,
  width = "auto",
  height = "auto",
  padding = 0,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  margin = 0,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  fontFamily = "Outfit",
  fontWeight = "500",
  fontStyle = "normal",
  fontSize = 12,
  lineHeight = 1.2,
  letterSpacing = 0,
  textAlign = "left",
  textTransform = "none",
  color = "#e2e8f0",
  background = "transparent",
  borderRadius = 8,
  radiusTopLeft,
  radiusTopRight,
  radiusBottomRight,
  radiusBottomLeft,
  borderWidth = 0,
  borderColor = "transparent",
  borderStyle = "solid",
  opacity = 1,
  boxShadow = "none",
  position = "relative",
  display = "inline-flex",
  editorVisibility = "auto",
  zIndex = 1,
  top = "auto",
  right = "auto",
  bottom = "auto",
  left = "auto",
  visibility = "visible",
  customClassName = "",
  rotation = 0,
  flipHorizontal = false,
  flipVertical = false,
  cursor = "default",
  overflow = "visible",
}: RatingProps) => {
  const { connectors: { connect, drag }, actions } = useNode();
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const safeMax = Math.max(1, Math.round(Number.isFinite(max) ? max : 5));
  const rawValue = Number.isFinite(value) ? value : 0;
  const safeValue = clamp(rawValue, 0, safeMax);
  const effectiveValue = hoverValue ?? safeValue;
  const normalizedValue = allowFractional ? effectiveValue : Math.round(effectiveValue);
  const safeNormalizedValue = clamp(normalizedValue, 0, safeMax);
  const displayValue = valueText !== undefined ? valueText : `${safeNormalizedValue}/${safeMax}`;

  const p = typeof padding === "number" ? padding : 0;
  const pt = paddingTop ?? p;
  const pr = paddingRight ?? p;
  const pb = paddingBottom ?? p;
  const pl = paddingLeft ?? p;

  const m = typeof margin === "number" ? margin : 0;
  const mt = marginTop ?? m;
  const mr = marginRight ?? m;
  const mb = marginBottom ?? m;
  const ml = marginLeft ?? m;

  const br = borderRadius ?? 0;
  const rtl = radiusTopLeft ?? br;
  const rtr = radiusTopRight ?? br;
  const rbr = radiusBottomRight ?? br;
  const rbl = radiusBottomLeft ?? br;
  const fluidFontSize = `clamp(${Math.max(10, Math.round(fontSize * 0.8))}px, ${(fontSize / 16 * 2.1).toFixed(2)}cqw, ${fontSize}px)`;

  const effectiveDisplay = editorVisibility === "hide" ? "none" : display;

  const justifyContent =
    textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : textAlign === "justify" ? "space-between" : "flex-start";

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      data-fluid-space="true"
      className={`inline-flex ${customClassName}`}
      style={{
        width: width === "auto" ? "fit-content" : width,
        height: height === "auto" ? "auto" : height,
        paddingTop: fluidSpace(pt),
        paddingRight: fluidSpace(pr),
        paddingBottom: fluidSpace(pb),
        paddingLeft: fluidSpace(pl),
        marginTop: fluidSpace(mt),
        marginRight: fluidSpace(mr),
        marginBottom: fluidSpace(mb),
        marginLeft: fluidSpace(ml),
        position,
        display: effectiveDisplay,
        zIndex,
        top: position !== "static" ? top : undefined,
        right: position !== "static" ? right : undefined,
        bottom: position !== "static" ? bottom : undefined,
        left: position !== "static" ? left : undefined,
        background,
        borderTopLeftRadius: `${rtl}px`,
        borderTopRightRadius: `${rtr}px`,
        borderBottomRightRadius: `${rbr}px`,
        borderBottomLeftRadius: `${rbl}px`,
        borderWidth: `${borderWidth}px`,
        borderColor,
        borderStyle: borderWidth > 0 ? borderStyle : "none",
        opacity,
        boxShadow,
        visibility: visibility === "hidden" ? "hidden" : "visible",
        transform: [rotation ? `rotate(${rotation}deg)` : null, flipHorizontal ? "scaleX(-1)" : null, flipVertical ? "scaleY(-1)" : null].filter(Boolean).join(" ") || undefined,
        cursor: interactive ? "pointer" : cursor,
        alignItems: "center",
        justifyContent,
        gap: showValue ? `${valueGap}px` : 0,
      }}
    >
      <div
        className="inline-flex items-center"
        style={{ gap: `${Math.max(0, gap)}px` }}
        onMouseLeave={() => {
          if (interactive) setHoverValue(null);
        }}
      >
        {Array.from({ length: safeMax }).map((_, index) => {
          const fillRatio = clamp(safeNormalizedValue - index, 0, 1);
          const starValue = index + 1;

          const starScale = interactive && hoverValue !== null && starValue <= hoverValue ? 1.04 : 1;
          const starGlow = interactive && fillRatio > 0 ? "drop-shadow(0 3px 6px rgba(247, 194, 0, 0.35))" : "none";

          return (
            <span
              key={index}
              className="relative inline-flex"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                cursor: interactive ? "pointer" : "default",
                filter: starGlow,
                transition: interactive ? "transform 0.12s ease, filter 0.12s ease" : undefined,
                transform: starScale !== 1 ? `scale(${starScale})` : "scale(1)"
              }}
              onMouseEnter={() => {
                if (interactive) setHoverValue(starValue);
              }}
              onClick={() => {
                if (!interactive) return;
                actions.setProp((props: RatingProps) => {
                  props.value = starValue;
                });
              }}
            >
              <Star className="w-full h-full" stroke="none" fill={emptyColor} />
              <span
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: `${fillRatio * 100}%` }}
              >
                <Star className="w-full h-full" stroke="none" fill={filledColor} />
              </span>
            </span>
          );
        })}
      </div>

      {showValue && (
        <span
          className="whitespace-nowrap"
          style={{
            fontFamily,
            fontWeight,
            fontStyle,
            fontSize: fluidFontSize,
            lineHeight,
            letterSpacing: `${letterSpacing}px`,
            textTransform,
            color,
          }}
        >
          {displayValue}
        </span>
      )}
    </div>
  );
};

export const RatingDefaultProps: Partial<RatingProps> = {
  value: 4,
  max: 5,
  size: 36,
  gap: 12,
  valueGap: 8,
  filledColor: "#f7c200",
  emptyColor: "#6b6b6b",
  showValue: false,
  interactive: false,
  width: "auto",
  height: "auto",
  padding: 0,
  margin: 0,
  fontFamily: "Outfit",
  fontWeight: "500",
  fontSize: 12,
  lineHeight: 1.2,
  letterSpacing: 0,
  textAlign: "left",
  textTransform: "none",
  color: "#e2e8f0",
  background: "transparent",
  borderRadius: 8,
  borderWidth: 0,
  borderColor: "transparent",
  borderStyle: "solid",
  position: "relative",
  display: "inline-flex",
  zIndex: 1,
  top: "auto",
  right: "auto",
  bottom: "auto",
  left: "auto",
  visibility: "visible",
  customClassName: "",
  opacity: 1,
  boxShadow: "none",
};

Rating.craft = {
  displayName: "Rating",
  props: RatingDefaultProps,
  related: {
    settings: RatingSettings,
  },
};
