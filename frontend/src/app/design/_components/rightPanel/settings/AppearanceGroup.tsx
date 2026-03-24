import React, { useEffect, useMemo, useRef, useState } from "react";
import { Scan, Plus, SquareRoundCorner, Eye, EyeOff, Minus } from "lucide-react";
import { NumericInput } from "./inputs/NumericInput";
import { ColorPicker } from "./inputs/ColorPicker";
import type { AppearanceProps, SetProp } from "../../../_types/components";

interface AppearanceGroupProps extends AppearanceProps {
  setProp: SetProp<AppearanceProps>;
  enableMediaFillModes?: boolean;
}

type FillMode = "color" | "image" | "video";

function normalizeUrlInput(raw: string): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "";

  const cssUrl = trimmed.match(/^url\(\s*(['"]?)(.*?)\1\s*\)/i);
  if (cssUrl?.[2]) return cssUrl[2].trim();

  return trimmed;
}

export const AppearanceGroup = ({
  background,
  backgroundImage = "",
  backgroundSize = "cover",
  backgroundPosition = "center",
  backgroundRepeat = "no-repeat",
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
  const [isFillVisible, setIsFillVisible] = useState(background !== "transparent");
  const lastVisibleFillRef = useRef(
    background && background !== "transparent" ? background : "#A54C4C"
  );

  const derivedFillMode = useMemo<FillMode>(() => {
    if (!enableMediaFillModes) return "color";
    if (backgroundVideo && backgroundVideo.trim()) return "video";
    if (backgroundImage && backgroundImage.trim()) return "image";
    return "color";
  }, [backgroundImage, backgroundVideo, enableMediaFillModes]);

  const [fillMode, setFillMode] = useState<FillMode>(derivedFillMode);
  const lastImageRef = useRef(backgroundImage || "");
  const lastVideoRef = useRef(backgroundVideo || "");

  useEffect(() => {
    setFillMode(derivedFillMode);
  }, [derivedFillMode]);

  const applyFillColor = (val: string) => {
    if (val !== "transparent") {
      lastVisibleFillRef.current = val;
      setIsFillVisible(true);
    } else {
      setIsFillVisible(false);
    }

    setProp((props) => {
      props.background = val;
    });
  };

  const toggleFillVisibility = () => {
    if (isFillVisible) {
      if (background && background !== "transparent") {
        lastVisibleFillRef.current = background;
      }
      applyFillColor("transparent");
      return;
    }

    applyFillColor(lastVisibleFillRef.current || "#A54C4C");
  };

  const addFill = () => {
    if (background === "transparent" || !background) {
      applyFillColor(lastVisibleFillRef.current || "#A54C4C");
    }
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const setFillModeAndSyncProps = (nextMode: FillMode) => {
    setFillMode(nextMode);
    setProp((props) => {
      if (nextMode === "color") {
        if (props.backgroundImage) lastImageRef.current = props.backgroundImage;
        if (props.backgroundVideo) lastVideoRef.current = props.backgroundVideo;
        props.backgroundImage = "";
        props.backgroundVideo = "";
      }

      if (nextMode === "image") {
        if (props.backgroundVideo) lastVideoRef.current = props.backgroundVideo;
        props.backgroundVideo = "";
        props.backgroundImage = props.backgroundImage || lastImageRef.current || "";
        props.backgroundSize = props.backgroundSize || "cover";
        props.backgroundPosition = props.backgroundPosition || "center";
        props.backgroundRepeat = props.backgroundRepeat || "no-repeat";
      }

      if (nextMode === "video") {
        if (props.backgroundImage) lastImageRef.current = props.backgroundImage;
        props.backgroundImage = "";
        props.backgroundVideo = props.backgroundVideo || lastVideoRef.current || "";
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Fill */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[12px] text-[var(--builder-text)] font-base">Fill</label>
          {enableMediaFillModes ? (
            <div className="flex items-center gap-2">
              <select
                value={fillMode}
                onChange={(e) => setFillModeAndSyncProps(e.target.value as FillMode)}
                className="h-7 bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] px-2 focus:outline-none focus:border-[var(--builder-accent)]"
                title="Fill type"
              >
                <option value="color">Color</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>

              {fillMode === "color" ? (
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
                  <button
                    type="button"
                    onClick={addFill}
                    className="p-0.5 rounded text-[var(--builder-text-faint)] hover:text-[var(--builder-text)]"
                    title="Add fill"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
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
              <button
                type="button"
                onClick={addFill}
                className="p-0.5 rounded text-[var(--builder-text-faint)] hover:text-[var(--builder-text)]"
                title="Add fill"
              >
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>

        {(!enableMediaFillModes || fillMode === "color") ? (
          <div className="flex items-center gap-1">
            <ColorPicker
              value={background || "transparent"}
              onChange={applyFillColor}
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
              title={isFillVisible ? "Hide fill" : "Show fill"}
            >
              {isFillVisible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
            <button
              type="button"
              onClick={() => applyFillColor("transparent")}
              className="h-8 w-8 rounded-lg bg-[var(--builder-surface-2)] border border-[var(--builder-border)] text-[var(--builder-text-faint)] hover:text-[var(--builder-text)] flex items-center justify-center"
              title="Remove fill"
            >
              <Minus size={12} />
            </button>
          </div>
        ) : null}

        {enableMediaFillModes && fillMode === "image" ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Image URL</label>
              <input
                type="text"
                value={backgroundImage || ""}
                onChange={(e) => {
                  const next = e.target.value;
                  setProp((props) => {
                    props.backgroundImage = next;
                  });
                }}
                onBlur={(e) => {
                  const normalized = normalizeUrlInput(e.target.value);
                  lastImageRef.current = normalized;
                  setProp((props) => {
                    props.backgroundImage = normalized;
                  });
                }}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] px-2 py-1.5 focus:outline-none focus:border-[var(--builder-accent)]"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const objectUrl = URL.createObjectURL(file);
                  lastImageRef.current = objectUrl;
                  setProp((props) => {
                    props.backgroundImage = objectUrl;
                    props.backgroundSize = props.backgroundSize || "cover";
                    props.backgroundPosition = props.backgroundPosition || "center";
                    props.backgroundRepeat = props.backgroundRepeat || "no-repeat";
                  });
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="h-8 px-3 rounded-md bg-[#2f8cff] text-white text-xs"
              >
                Upload image
              </button>
              <button
                type="button"
                onClick={() =>
                  setProp((props) => {
                    if (props.backgroundImage) lastImageRef.current = props.backgroundImage;
                    props.backgroundImage = "";
                  })
                }
                className="h-8 px-3 rounded-md bg-[var(--builder-surface-2)] border border-[var(--builder-border)] text-xs text-[var(--builder-text)] hover:bg-[var(--builder-surface-3)]"
              >
                Clear
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[var(--builder-text)]">Size</label>
                <input
                  type="text"
                  value={String(backgroundSize || "")}
                  onChange={(e) => setProp((props) => { props.backgroundSize = e.target.value; })}
                  placeholder="cover"
                  className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] px-2 py-1.5 focus:outline-none focus:border-[var(--builder-accent)]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[var(--builder-text)]">Position</label>
                <input
                  type="text"
                  value={String(backgroundPosition || "")}
                  onChange={(e) => setProp((props) => { props.backgroundPosition = e.target.value; })}
                  placeholder="center"
                  className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] px-2 py-1.5 focus:outline-none focus:border-[var(--builder-accent)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[var(--builder-text)]">Repeat</label>
                <select
                  value={backgroundRepeat || "no-repeat"}
                  onChange={(e) => setProp((props) => { props.backgroundRepeat = e.target.value as AppearanceProps["backgroundRepeat"]; })}
                  className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] px-2 py-1.5 focus:outline-none focus:border-[var(--builder-accent)]"
                >
                  <option value="no-repeat">No repeat</option>
                  <option value="repeat">Repeat</option>
                  <option value="repeat-x">Repeat X</option>
                  <option value="repeat-y">Repeat Y</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[var(--builder-text)]">Overlay</label>
                <ColorPicker
                  value={backgroundOverlay || "transparent"}
                  onChange={(val) => setProp((props) => { props.backgroundOverlay = val; })}
                  className="w-full"
                  popoverContainerRef={popoverContainerRef}
                />
              </div>
            </div>
          </div>
        ) : null}

        {enableMediaFillModes && fillMode === "video" ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Video URL</label>
              <input
                type="text"
                value={backgroundVideo || ""}
                onChange={(e) =>
                  setProp((props) => {
                    props.backgroundVideo = e.target.value;
                  })
                }
                onBlur={(e) => {
                  const normalized = normalizeUrlInput(e.target.value);
                  lastVideoRef.current = normalized;
                  setProp((props) => {
                    props.backgroundVideo = normalized;
                  });
                }}
                placeholder="https://example.com/video.mp4"
                className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] px-2 py-1.5 focus:outline-none focus:border-[var(--builder-accent)]"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const objectUrl = URL.createObjectURL(file);
                  lastVideoRef.current = objectUrl;
                  setProp((props) => {
                    props.backgroundVideo = objectUrl;
                  });
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="h-8 px-3 rounded-md bg-[#2f8cff] text-white text-xs"
              >
                Upload video
              </button>
              <button
                type="button"
                onClick={() =>
                  setProp((props) => {
                    if (props.backgroundVideo) lastVideoRef.current = props.backgroundVideo;
                    props.backgroundVideo = "";
                  })
                }
                className="h-8 px-3 rounded-md bg-[var(--builder-surface-2)] border border-[var(--builder-border)] text-xs text-[var(--builder-text)] hover:bg-[var(--builder-surface-3)]"
              >
                Clear
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Overlay</label>
              <ColorPicker
                value={backgroundOverlay || "transparent"}
                onChange={(val) => setProp((props) => { props.backgroundOverlay = val; })}
                className="w-full"
                popoverContainerRef={popoverContainerRef}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Stroke / Border */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] text-[var(--builder-text)] font-base">Stroke</label>
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
            title="Stroke placement"
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
                icon={<div className="w-2 h-2 border-t border-l border-[var(--builder-border-mid)] mr-2" />}
              />
            </div>
            <div className="flex bg-[var(--builder-surface-2)] rounded-lg px-2 items-center gap-2">
              <NumericInput
                value={radiusTopRight}
                onChange={(val) => handleRadiusChange("tr", val)}
                icon={<div className="w-2 h-2 border-t border-r border-[var(--builder-border-mid)] mr-2" />}
              />
            </div>

            <div className="flex bg-[var(--builder-surface-2)] rounded-lg px-2 items-center gap-2">
              <NumericInput
                value={radiusBottomLeft}
                onChange={(val) => handleRadiusChange("bl", val)}
                icon={<div className="w-2 h-2 border-b border-l border-[var(--builder-border-mid)] mr-2" />}
              />
            </div>
            <div className="flex bg-[var(--builder-surface-2)] rounded-lg px-2 items-center gap-2">
              <NumericInput
                value={radiusBottomRight}
                onChange={(val) => handleRadiusChange("br", val)}
                icon={<div className="w-2 h-2 border-b border-r border-[var(--builder-border-mid)] mr-2" />}
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
