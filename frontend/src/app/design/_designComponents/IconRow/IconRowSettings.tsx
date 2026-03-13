import React, { useMemo, useRef, useState } from "react";
import { useNode } from "@craftjs/core";
import { Loader2, Plus, Upload, X } from "lucide-react";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import { NumericInput } from "../../_components/rightPanel/settings/inputs/NumericInput";
import { useDesignProject } from "../../_context/DesignProjectContext";
import { uploadMediaApi } from "@/lib/api";
import type { IconRowProps, IconRowItem, SetProp } from "../../_types/components";

function safeParseItems(input: string): IconRowItem[] | null {
  try {
    const parsed = JSON.parse(input);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const IconRowSettings = () => {
  const {
    items,
    align,
    gap,
    size,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    width,
    height,
    opacity,
    boxShadow,
    actions: { setProp },
  } = useNode((node) => ({
    items: node.data.props.items,
    align: node.data.props.align,
    gap: node.data.props.gap,
    size: node.data.props.size,
    paddingLeft: node.data.props.paddingLeft,
    paddingRight: node.data.props.paddingRight,
    paddingTop: node.data.props.paddingTop,
    paddingBottom: node.data.props.paddingBottom,
    marginLeft: node.data.props.marginLeft,
    marginRight: node.data.props.marginRight,
    marginTop: node.data.props.marginTop,
    marginBottom: node.data.props.marginBottom,
    width: node.data.props.width,
    height: node.data.props.height,
    opacity: node.data.props.opacity,
    boxShadow: node.data.props.boxShadow,
  }));

  const typedSetProp = setProp as SetProp<IconRowProps>;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { projectId } = useDesignProject();

  const itemsJson = useMemo(
    () =>
      JSON.stringify(
        items && items.length
          ? items
          : [
              { id: "facebook", src: "https://...", alt: "Facebook", link: "https://facebook.com" },
            ],
        null,
        2
      ),
    [items]
  );

  const handleBrowse = () => fileInputRef.current?.click();

  const appendIconItem = (src: string, alt?: string) => {
    typedSetProp((props) => {
      const list = (props.items ?? []).slice();
      const id = `icon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      list.push({ id, src, alt: alt || "Icon", link: "" });
      props.items = list;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setUploadError(null);

    if (projectId) {
      setUploading(true);
      try {
        const { url } = await uploadMediaApi(projectId, file, { folder: "icons" });
        appendIconItem(url, file.name);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setUploadError(msg || "Upload failed");
        fallbackToDataUrl(file);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
      return;
    }

    fallbackToDataUrl(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  function fallbackToDataUrl(file: File) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      appendIconItem(dataUrl, file.name);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Layout">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Align</label>
            <div className="grid grid-cols-3 gap-1 bg-brand-dark/30 p-1 rounded-lg border border-brand-medium/20">
              {(["left", "center", "right"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() =>
                    typedSetProp((props) => {
                      props.align = mode;
                    })
                  }
                  className={`text-[10px] py-1.5 rounded capitalize transition-colors ${
                    align === mode
                      ? "bg-brand-medium/50 text-brand-lighter"
                      : "text-brand-light hover:text-brand-lighter"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Gap</label>
            <NumericInput
              value={gap ?? 16}
              onChange={(val) =>
                typedSetProp((props) => {
                  props.gap = val;
                })
              }
              min={0}
              unit="px"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Icon Size</label>
            <NumericInput
              value={size ?? 22}
              onChange={(val) =>
                typedSetProp((props) => {
                  props.size = val;
                })
              }
              min={8}
              max={128}
              unit="px"
            />
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Icons">
        <div className="flex flex-col gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBrowse}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 bg-brand-medium/30 hover:bg-brand-medium/50 border border-brand-medium/30 rounded-md transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 text-brand-light animate-spin" />
              ) : (
                <Upload className="w-4 h-4 text-brand-light" />
              )}
              <span className="text-xs text-brand-lighter font-medium">Upload icon</span>
            </button>
            <button
              type="button"
              onClick={() =>
                typedSetProp((props) => {
                  props.items = [];
                })
              }
              className="px-3 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 rounded-md transition-colors"
              title="Clear all"
            >
              <X className="w-4 h-4 text-red-300" />
            </button>
          </div>

          {uploadError && <p className="text-[10px] text-red-400">Upload failed: {uploadError}</p>}
          {!projectId && (
            <p className="text-[9px] text-amber-400/90">
              No project selected — uploads are saved as local preview (data URL).
            </p>
          )}

          <div className="flex flex-col gap-2">
            {(items ?? []).length === 0 ? (
              <div className="text-[10px] text-brand-medium">No icons yet. Upload to add.</div>
            ) : (
              (items ?? []).map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 bg-brand-white/5 rounded-lg border border-brand-medium/20"
                >
                  <div className="w-10 h-10 rounded-md bg-brand-dark/40 border border-brand-medium/20 overflow-hidden flex items-center justify-center">
                    {item.src ? (
                      <img src={item.src} alt={item.alt || "Icon"} className="w-full h-full object-contain" />
                    ) : (
                      <Plus className="w-4 h-4 text-brand-medium" />
                    )}
                  </div>

                  <input
                    type="text"
                    value={item.link || ""}
                    onChange={(e) =>
                      typedSetProp((props) => {
                        const list = (props.items ?? []).slice();
                        if (!list[idx]) return;
                        list[idx] = { ...list[idx], link: e.target.value };
                        props.items = list;
                      })
                    }
                    placeholder="https://..."
                    className="flex-1 bg-brand-black border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-2 focus:outline-none focus:border-brand-light"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      typedSetProp((props) => {
                        const list = (props.items ?? []).slice();
                        list.splice(idx, 1);
                        props.items = list;
                      })
                    }
                    className="px-2 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 rounded-md transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4 text-red-300" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Icons Data (advanced)" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-brand-light/80 leading-relaxed">
            Optional: edit icons as JSON. Each item supports{" "}
            <code className="text-[10px] text-brand-blue">id</code>,{" "}
            <code className="text-[10px] text-brand-blue">src</code>,{" "}
            <code className="text-[10px] text-brand-blue">alt</code>,{" "}
            <code className="text-[10px] text-brand-blue">link</code>.
          </p>
          <textarea
            defaultValue={itemsJson}
            onBlur={(e) => {
              const value = e.target.value.trim();
              const parsed = safeParseItems(value);
              if (parsed) {
                typedSetProp((props) => {
                  props.items = parsed;
                });
              }
            }}
            spellCheck={false}
            rows={8}
            className="w-full bg-brand-black border border-brand-medium/40 rounded-md text-[10px] font-mono text-brand-lighter p-2 focus:outline-none focus:border-brand-blue/70 resize-none"
          />
        </div>
      </DesignSection>

      <DesignSection title="Size & Position">
        <SizePositionGroup
          width={width}
          height={height}
          paddingLeft={paddingLeft}
          paddingRight={paddingRight}
          paddingTop={paddingTop}
          paddingBottom={paddingBottom}
          marginLeft={marginLeft}
          marginRight={marginRight}
          marginTop={marginTop}
          marginBottom={marginBottom}
          setProp={typedSetProp}
        />
      </DesignSection>

      <DesignSection title="Effects" defaultOpen={false}>
        <EffectsGroup opacity={opacity} boxShadow={boxShadow} setProp={typedSetProp} />
      </DesignSection>
    </div>
  );
};

