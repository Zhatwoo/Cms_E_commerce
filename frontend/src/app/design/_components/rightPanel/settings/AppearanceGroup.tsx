import React, { useEffect, useRef, useState } from "react";
import { Scan, SquareRoundCorner, Eye, EyeOff } from "lucide-react";
import { NumericInput } from "./inputs/NumericInput";
import { ColorPicker } from "./inputs/ColorPicker";
import type { AppearanceProps, SetProp } from "../../../_types/components";

interface AppearanceGroupProps extends AppearanceProps {
  setProp: SetProp<AppearanceProps>;
  enableMediaFillModes?: boolean;
}

export const AppearanceGroup = ({
  background,
  backgroundImage = "",
  backgroundOverlay = "",
  backgroundVideo = "",
  borderColor = "transparent",
  borderWidth = 0,
  borderStyle = "solid",
  strokePlacement = "mid",
  radiusTopLeft = 0,
  radiusTopRight = 0,
  radiusBottomRight = 0,
  radiusBottomLeft = 0,
  enableMediaFillModes = false,
  setProp
}: AppearanceGroupProps) => {
  const [expandRadius, setExpandRadius] = useState(false);
  const [fillPickerToggleKey, setFillPickerToggleKey] = useState(0);

  const hasMedia = Boolean(String(backgroundImage || "").trim() || String(backgroundVideo || "").trim());
  const [isFillVisible, setIsFillVisible] = useState(
    (background && background !== "transparent") || hasMedia
  );

  const lastVisibleFillRef = useRef(
    background && background !== "transparent" ? background : "#A54C4C"
  );
  const lastImageRef = useRef(backgroundImage || "");
  const lastVideoRef = useRef(backgroundVideo || "");
  const lastOverlayRef = useRef(backgroundOverlay || "");

  useEffect(() => {
    if (background && background !== "transparent") lastVisibleFillRef.current = background;
  }, [background]);

  useEffect(() => {
    if (backgroundImage) lastImageRef.current = backgroundImage;
  }, [backgroundImage]);

  useEffect(() => {
    if (backgroundVideo) lastVideoRef.current = backgroundVideo;
  }, [backgroundVideo]);

  useEffect(() => {
    if (backgroundOverlay) lastOverlayRef.current = backgroundOverlay;
  }, [backgroundOverlay]);

  const applySolidFill = (val: string) => {
    if (val !== "transparent") {
      lastVisibleFillRef.current = val;
      setIsFillVisible(true);
    } else if (!hasMedia) {
      setIsFillVisible(false);
    }

    setProp((props) => {
      props.background = val;
      props.backgroundImage = "";
      props.backgroundVideo = "";
      props.backgroundOverlay = props.backgroundOverlay || "";
    });
  };

  const handleFillChange = (val: string) => {
    // Media fills (image/video) are handled via `onMediaChange`.
    if (/^url\(/i.test(String(val ?? "").trim())) return;
    applySolidFill(val);
  };

  const handleMediaChange = (media: { type: "image" | "video"; url: string }) => {
    setIsFillVisible(true);
    setProp((props) => {
      if (media.type === "image") {
        props.backgroundImage = media.url;
        props.backgroundVideo = "";
        props.backgroundSize = props.backgroundSize || "cover";
        props.backgroundPosition = props.backgroundPosition || "center";
        props.backgroundRepeat = props.backgroundRepeat || "no-repeat";
      } else {
        props.backgroundVideo = media.url;
        props.backgroundImage = "";
      }
    });
  };

  const toggleFillVisibility = () => {
    const effectiveVisible =
      isFillVisible ||
      Boolean(String(backgroundImage || "").trim()) ||
      Boolean(String(backgroundVideo || "").trim());

    if (effectiveVisible) {
      if (background && background !== "transparent") lastVisibleFillRef.current = background;
      if (backgroundImage) lastImageRef.current = backgroundImage;
      if (backgroundVideo) lastVideoRef.current = backgroundVideo;
      if (backgroundOverlay) lastOverlayRef.current = backgroundOverlay;

      setIsFillVisible(false);
      setProp((props) => {
        props.background = "transparent";
        props.backgroundImage = "";
        props.backgroundVideo = "";
        props.backgroundOverlay = "";
      });
      return;
    }

    const restoreVideo = String(lastVideoRef.current || "").trim();
    const restoreImage = String(lastImageRef.current || "").trim();
    const restoreColor = String(lastVisibleFillRef.current || "#A54C4C");

    setIsFillVisible(true);
    setProp((props) => {
      props.background = restoreColor;
      props.backgroundOverlay = lastOverlayRef.current || "";

      if (enableMediaFillModes && restoreVideo) {
        props.backgroundVideo = restoreVideo;
        props.backgroundImage = "";
        return;
      }

      if (enableMediaFillModes && restoreImage) {
        props.backgroundImage = restoreImage;
        props.backgroundVideo = "";
        props.backgroundSize = props.backgroundSize || "cover";
        props.backgroundPosition = props.backgroundPosition || "center";
        props.backgroundRepeat = props.backgroundRepeat || "no-repeat";
      }
    });
  };

  const handleRadiusChange = (corner: string, val: number) => {
    setProp((props) => {
      if (corner === "all") {
        props.radiusTopLeft = val;
        props.radiusTopRight = val;
        props.radiusBottomRight = val;
        props.radiusBottomLeft = val;
        props.borderRadius = val;
      } else {
        if (corner === "tl") props.radiusTopLeft = val;
        if (corner === "tr") props.radiusTopRight = val;
        if (corner === "br") props.radiusBottomRight = val;
        if (corner === "bl") props.radiusBottomLeft = val;
      }
    });
  };

  const popoverContainerRef = useRef<HTMLDivElement>(null);
  const mediaSwatchUrl = String(backgroundVideo || backgroundImage || "").trim();
  const pickerValue =
    enableMediaFillModes && mediaSwatchUrl
      ? `url("${mediaSwatchUrl}") center / cover no-repeat`
      : (background || "transparent");

  return (
    <div className="flex flex-col gap-4">
      {/* Fill */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[12px] text-[var(--builder-text)] font-base">Fill</label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFillPickerToggleKey((prev) => prev + 1)}
              className="h-6 w-6 rounded-md border border-[var(--builder-border)] bg-[var(--builder-surface-2)] text-[#2f8cff] hover:bg-[var(--builder-surface-3)] flex items-center justify-center"
              title="Apply styles and variables"
            >
              <span className="grid grid-cols-2 gap-0.5">
                <span className="h-1 w-1 rounded-full bg-current" />
                <span className="h-1 w-1 rounded-full bg-current" />
                <span className="h-1 w-1 rounded-full bg-current" />
                <span className="h-1 w-1 rounded-full bg-current" />
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <ColorPicker
            value={pickerValue}
            onChange={handleFillChange}
            onMediaChange={enableMediaFillModes ? handleMediaChange : undefined}
            toggleKey={fillPickerToggleKey}
            enableFillModes
            enableMediaFillModes={enableMediaFillModes}
            popoverContainerRef={popoverContainerRef}
            className="flex-1 min-w-0"
          />
          <button
            type="button"
            onClick={toggleFillVisibility}
            className="h-8 w-8 rounded-lg bg-[var(--builder-surface-2)] border border-[var(--builder-border)] text-[var(--builder-text-faint)] hover:text-[var(--builder-text)] flex items-center justify-center"
            title={isFillVisible || hasMedia ? "Hide fill" : "Show fill"}
          >
            {isFillVisible || hasMedia ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
        </div>
      </div>

      {/* Border */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] text-[var(--builder-text)] font-base">Border</label>
        <div className="flex gap-2">
          {/* Color Picker */}
          <ColorPicker
            value={borderColor || "transparent"}
            onChange={(val) => setProp((props) => { props.borderColor = val; })}
            className="flex-1 min-w-0"
          />
          {/* Thickness Input */}
          <div className="w-16 bg-[var(--builder-surface-2)] rounded-lg px-2.5">
            <NumericInput
              value={borderWidth}
              onChange={(val) => setProp((props) => { props.borderWidth = val; })}
              unit="px"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={borderStyle}
            onChange={(e) => setProp((props) => { props.borderStyle = e.target.value; })}
            className="w-full bg-[var(--builder-surface-2)] rounded-lg text-xs text-[var(--builder-text)] px-2.5 py-1.5 focus:outline-none appearance-none"
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
          <select
            value={strokePlacement}
            onChange={(e) => setProp((props) => { props.strokePlacement = e.target.value as "mid" | "inside" | "outside"; })}
            className="w-full bg-[var(--builder-surface-2)] rounded-lg text-xs text-[var(--builder-text)] px-2.5 py-1.5 focus:outline-none appearance-none"
            title="Border placement"
          >
            <option value="mid">Mid</option>
            <option value="inside">Inside</option>
            <option value="outside">Outside</option>
          </select>
        </div>
      </div>

      {/* Corner Radius */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[12px] text-[var(--builder-text)]">Corners</label>
          <button
            onClick={() => setExpandRadius(!expandRadius)}
            className={`p-0.5 rounded ${expandRadius ? "bg-[var(--builder-accent)] text-black" : "text-[var(--builder-text-faint)] hover:text-[var(--builder-text)]"}`}
          >
            <Scan strokeWidth={2} size={12} className={`text-[var(--builder-text)] hover:text-[var(--builder-text)] ${expandRadius ? "rotate-90" : "rotate-0"}`} />
          </button>
        </div>

        {expandRadius ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="flex bg-[var(--builder-surface-2)] rounded-lg px-2 items-center gap-2">

              <NumericInput
                value={radiusTopLeft}
                onChange={(val) => handleRadiusChange("tl", val)}
                icon={<div className="w-2 h-2 border-t border-l border-[var(--builder-text)] mr-2" />}
              />
            </div>
            <div className="flex bg-[var(--builder-surface-2)] rounded-lg px-2 items-center gap-2">
              <NumericInput
                value={radiusTopRight}
                onChange={(val) => handleRadiusChange("tr", val)}
                icon={<div className="w-2 h-2 border-t border-r border-[var(--builder-text)] mr-2" />}
              />
            </div>

            <div className="flex bg-[var(--builder-surface-2)] rounded-lg px-2 items-center gap-2">
              <NumericInput
                value={radiusBottomLeft}
                onChange={(val) => handleRadiusChange("bl", val)}
                icon={<div className="w-2 h-2 border-b border-l border-[var(--builder-text)] mr-2" />}
              />
            </div>
            <div className="flex bg-[var(--builder-surface-2)] rounded-lg px-2 items-center gap-2">
              <NumericInput
                value={radiusBottomRight}
                onChange={(val) => handleRadiusChange("br", val)}
                icon={<div className="w-2 h-2 border-b border-r border-[var(--builder-text)] mr-2" />}
              />
            </div>
          </div>
        ) : (
          <div className="flex bg-[var(--builder-surface-2)] rounded-lg px-2 items-center gap-2">
            <SquareRoundCorner size={16} className="text-[var(--builder-text)] mx-2.5" />
            <NumericInput
              value={radiusTopLeft}
              onChange={(val) => handleRadiusChange("all", val)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
