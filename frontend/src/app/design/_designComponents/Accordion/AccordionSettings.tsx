import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { NumericInput } from "../../_components/rightPanel/settings/inputs/NumericInput";
import { ColorPicker } from "../../_components/rightPanel/settings/inputs/ColorPicker";
import { Plus, Trash2 } from "lucide-react";
import { uploadMediaApi } from "@/lib/api";

interface AccordionItem {
  title: string;
  content: string;
  mediaType?: "none" | "image" | "video";
  mediaUrl?: string;
}

interface AccordionStyleProps {
  items?: AccordionItem[];
  stylePreset?: "classic" | "wix";
  editorPreviewMode?: "normal" | "expand-all" | "collapse-all";
  allowMultiple?: boolean;
  allowCollapseAll?: boolean;
  defaultOpenIndex?: number;
  animationDurationMs?: number;
  width?: string;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  borderRadius?: number;
  backgroundColor?: string;
  headerBg?: string;
  headerTextColor?: string;
  headerFontSize?: number;
  headerFontWeight?: string;
  contentBg?: string;
  contentTextColor?: string;
  contentFontSize?: number;
  borderColor?: string;
  borderWidth?: number;
  iconColor?: string;
}

export const AccordionSettings = () => {
  const fileInputRefs = React.useRef<Record<number, HTMLInputElement | null>>({});
  const [uploadingIndex, setUploadingIndex] = React.useState<number | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const {
    items,
    stylePreset,
    editorPreviewMode,
    allowMultiple,
    allowCollapseAll,
    defaultOpenIndex,
    animationDurationMs,
    width,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    borderRadius,
    backgroundColor,
    headerBg,
    headerTextColor,
    headerFontSize,
    headerFontWeight,
    contentBg,
    contentTextColor,
    contentFontSize,
    borderColor,
    borderWidth,
    iconColor,
    actions: { setProp },
  } = useNode((node) => ({
    items: node.data.props.items as AccordionItem[],
    stylePreset: node.data.props.stylePreset as "classic" | "wix" | undefined,
    editorPreviewMode: node.data.props.editorPreviewMode as "normal" | "expand-all" | "collapse-all" | undefined,
    allowMultiple: node.data.props.allowMultiple as boolean,
    allowCollapseAll: node.data.props.allowCollapseAll as boolean,
    defaultOpenIndex: node.data.props.defaultOpenIndex as number,
    animationDurationMs: node.data.props.animationDurationMs as number,
    width: node.data.props.width as string,
    marginTop: node.data.props.marginTop as number,
    marginRight: node.data.props.marginRight as number,
    marginBottom: node.data.props.marginBottom as number,
    marginLeft: node.data.props.marginLeft as number,
    borderRadius: node.data.props.borderRadius as number,
    backgroundColor: node.data.props.backgroundColor as string,
    headerBg: node.data.props.headerBg as string,
    headerTextColor: node.data.props.headerTextColor as string,
    headerFontSize: node.data.props.headerFontSize as number,
    headerFontWeight: node.data.props.headerFontWeight as string,
    contentBg: node.data.props.contentBg as string,
    contentTextColor: node.data.props.contentTextColor as string,
    contentFontSize: node.data.props.contentFontSize as number,
    borderColor: node.data.props.borderColor as string,
    borderWidth: node.data.props.borderWidth as number,
    iconColor: node.data.props.iconColor as string,
  }));

  const safeItems: AccordionItem[] = Array.isArray(items) ? items : [];

  const updateItem = (index: number, key: keyof AccordionItem, value: string) => {
    setProp((props: AccordionStyleProps) => {
      const copy = [...(props.items ?? [])];
      copy[index] = { ...copy[index], [key]: value };
      props.items = copy;
    });
  };

  const addItem = () => {
    setProp((props: AccordionStyleProps) => {
      props.items = [
        ...(props.items ?? []),
        { title: `Item ${(props.items?.length ?? 0) + 1}`, content: "Add your content here.", mediaType: "none", mediaUrl: "" },
      ];
    });
  };

  const removeItem = (index: number) => {
    setProp((props: AccordionStyleProps) => {
      props.items = (props.items ?? []).filter((_, i) => i !== index);
    });
  };

  const handleLocalMediaUpload = async (index: number, file: File | null) => {
    if (!file) return;

    const selectedType = safeItems[index]?.mediaType ?? "none";
    if (selectedType === "none") return;

    if (selectedType === "image" && !file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }
    if (selectedType === "video" && !file.type.startsWith("video/")) {
      setUploadError("Please select a video file.");
      return;
    }

    setUploadingIndex(index);
    setUploadError(null);

    try {
      let mediaUrl = "";
      const projectId = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("projectId")
        : null;

      if (projectId) {
        const { url } = await uploadMediaApi(projectId, file, {
          folder: selectedType === "video" ? "videos" : "images",
        });
        mediaUrl = url;
      } else {
        // Fallback preview when no projectId is available.
        mediaUrl = URL.createObjectURL(file);
      }

      setProp((props: AccordionStyleProps) => {
        const next = [...(props.items ?? [])];
        const current = next[index];
        if (!current) return;
        next[index] = {
          ...current,
          mediaUrl,
        };
        props.items = next;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setUploadError(message);
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <div className="flex flex-col pb-4">

      {/* Items */}
      <DesignSection title="Items">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Canvas Preview</label>
            <div className="grid grid-cols-2 gap-1 bg-brand-dark/30 p-1 rounded-lg border border-brand-medium/20">
              <button
                type="button"
                onClick={() => setProp((props: AccordionStyleProps) => { props.editorPreviewMode = "expand-all"; })}
                className={`text-[10px] py-1.5 rounded transition-colors ${editorPreviewMode === "expand-all"
                  ? "bg-brand-medium/50 text-brand-lighter"
                  : "text-brand-light hover:text-brand-lighter"
                  }`}
              >
                Expand
              </button>
              <button
                type="button"
                onClick={() => setProp((props: AccordionStyleProps) => { props.editorPreviewMode = "collapse-all"; })}
                className={`text-[10px] py-1.5 rounded transition-colors ${editorPreviewMode === "collapse-all"
                  ? "bg-brand-medium/50 text-brand-lighter"
                  : "text-brand-light hover:text-brand-lighter"
                  }`}
              >
                Collapse
              </button>
            </div>
          </div>

          {safeItems.map((item, index) => (
            <div key={index} className="flex flex-col gap-1.5 bg-brand-dark/30 rounded-lg p-2 border border-brand-medium/20">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-brand-medium">Item {index + 1}</span>
                {safeItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-brand-lighter">Title</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateItem(index, "title", e.target.value)}
                  className="w-full bg-brand-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none focus:border-brand-light/50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-brand-lighter">Content</label>
                <textarea
                  value={item.content}
                  rows={3}
                  onChange={(e) => updateItem(index, "content", e.target.value)}
                  className="w-full bg-brand-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none focus:border-brand-light/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-1">
                <label className="text-[10px] text-brand-lighter">Media Type</label>
                <select
                  value={item.mediaType ?? "none"}
                  onChange={(e) => updateItem(index, "mediaType", e.target.value as "none" | "image" | "video")}
                  className="w-full bg-brand-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none focus:border-brand-light/50"
                >
                  <option value="none">None</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {(item.mediaType ?? "none") !== "none" && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-brand-lighter">
                    {(item.mediaType ?? "none") === "image" ? "Image URL" : "Video URL"}
                  </label>
                  <input
                    type="text"
                    value={item.mediaUrl ?? ""}
                    placeholder={(item.mediaType ?? "none") === "image" ? "https://.../image.jpg" : "https://.../video.mp4"}
                    onChange={(e) => updateItem(index, "mediaUrl", e.target.value)}
                    className="w-full bg-brand-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none focus:border-brand-light/50"
                  />
                  <input
                    ref={(el) => { fileInputRefs.current[index] = el; }}
                    type="file"
                    accept={(item.mediaType ?? "none") === "image" ? "image/*" : "video/*"}
                    className="hidden"
                    onChange={(e) => {
                      handleLocalMediaUpload(index, e.target.files?.[0] ?? null);
                      e.currentTarget.value = "";
                    }}
                  />
                  <div className="mt-1 grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[index]?.click()}
                      disabled={uploadingIndex === index}
                      className="w-full rounded-md border border-brand-medium/30 bg-brand-dark/40 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-lighter hover:bg-brand-medium/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {uploadingIndex === index ? "Uploading..." : "Upload"}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateItem(index, "mediaUrl", "")}
                      disabled={!item.mediaUrl}
                      className="w-full rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-300 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  {uploadError && uploadingIndex === null && (
                    <p className="text-[10px] text-red-300 mt-1">{uploadError}</p>
                  )}
                </div>
              )}
            </div>
          ))}

          {safeItems.length < 10 && (
            <button
              type="button"
              onClick={addItem}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-dashed border-brand-medium/40 text-[10px] font-bold uppercase tracking-widest text-brand-light hover:text-brand-lighter hover:border-brand-medium/70 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Item
            </button>
          )}

          {/* Allow Multiple Toggle */}
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-brand-lighter">Allow Multiple Open</span>
            <button
              type="button"
              onClick={() => setProp((props: AccordionStyleProps) => { props.allowMultiple = !props.allowMultiple; })}
              className={`relative w-9 h-5 rounded-full transition-colors ${allowMultiple ? "bg-blue-500" : "bg-brand-medium/40"}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${allowMultiple ? "translate-x-[18px]" : "translate-x-0.5"}`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-brand-lighter">Allow Collapse All</span>
            <button
              type="button"
              onClick={() => setProp((props: AccordionStyleProps) => { props.allowCollapseAll = !props.allowCollapseAll; })}
              className={`relative w-9 h-5 rounded-full transition-colors ${allowCollapseAll !== false ? "bg-blue-500" : "bg-brand-medium/40"}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${allowCollapseAll !== false ? "translate-x-[18px]" : "translate-x-0.5"}`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Style Preset</label>
              <select
                value={stylePreset ?? "wix"}
                onChange={(e) => setProp((props: AccordionStyleProps) => { props.stylePreset = e.target.value as "classic" | "wix"; })}
                className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
              >
                <option value="wix">Wix</option>
                <option value="classic">Classic</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Default Open Index</label>
              <NumericInput
                value={defaultOpenIndex ?? 0}
                min={0}
                max={Math.max(0, safeItems.length - 1)}
                onChange={(v) => setProp((props: AccordionStyleProps) => { props.defaultOpenIndex = v; })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Animation (ms)</label>
              <NumericInput
                value={animationDurationMs ?? 280}
                min={80}
                max={1200}
                unit="ms"
                onChange={(v) => setProp((props: AccordionStyleProps) => { props.animationDurationMs = v; })}
              />
            </div>
          </div>

        </div>
      </DesignSection>

      {/* Header Style */}
      <DesignSection title="Header">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Background</label>
            <ColorPicker value={headerBg ?? "#1e1e2e"} onChange={(v) => setProp((p: AccordionStyleProps) => { p.headerBg = v; })} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Text Color</label>
            <ColorPicker value={headerTextColor ?? "#e2e8f0"} onChange={(v) => setProp((p: AccordionStyleProps) => { p.headerTextColor = v; })} className="w-full" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Font Size</label>
              <NumericInput value={headerFontSize ?? 14} min={8} max={48} unit="px" onChange={(v) => setProp((p: AccordionStyleProps) => { p.headerFontSize = v; })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Weight</label>
              <select
                value={headerFontWeight ?? "600"}
                onChange={(e) => setProp((p: AccordionStyleProps) => { p.headerFontWeight = e.target.value; })}
                className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
              >
                {["400", "500", "600", "700", "800"].map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Icon Color</label>
            <ColorPicker value={iconColor ?? "#94a3b8"} onChange={(v) => setProp((p: AccordionStyleProps) => { p.iconColor = v; })} className="w-full" />
          </div>
        </div>
      </DesignSection>

      {/* Content Style */}
      <DesignSection title="Content">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Background</label>
            <ColorPicker value={contentBg ?? "#12121c"} onChange={(v) => setProp((p: AccordionStyleProps) => { p.contentBg = v; })} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Text Color</label>
            <ColorPicker value={contentTextColor ?? "#a0aec0"} onChange={(v) => setProp((p: AccordionStyleProps) => { p.contentTextColor = v; })} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Font Size</label>
            <NumericInput value={contentFontSize ?? 13} min={8} max={48} unit="px" onChange={(v) => setProp((p: AccordionStyleProps) => { p.contentFontSize = v; })} />
          </div>
        </div>
      </DesignSection>

      {/* Border & Shape */}
      <DesignSection title="Border & Shape">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Border Color</label>
            <ColorPicker value={borderColor ?? "#2d2d44"} onChange={(v) => setProp((p: AccordionStyleProps) => { p.borderColor = v; })} className="w-full" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Border Width</label>
              <NumericInput value={borderWidth ?? 1} min={0} max={8} unit="px" onChange={(v) => setProp((p: AccordionStyleProps) => { p.borderWidth = v; })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Radius</label>
              <NumericInput value={borderRadius ?? 8} min={0} max={32} unit="px" onChange={(v) => setProp((p: AccordionStyleProps) => { p.borderRadius = v; })} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Container Background</label>
            <ColorPicker value={backgroundColor ?? "transparent"} onChange={(v) => setProp((p: AccordionStyleProps) => { p.backgroundColor = v; })} className="w-full" />
          </div>
        </div>
      </DesignSection>

      {/* Size & Spacing */}
      <DesignSection title="Spacing">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Width</label>
            <select
              value={width ?? "100%"}
              onChange={(e) => setProp((p: AccordionStyleProps) => { p.width = e.target.value; })}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            >
              <option value="100%">Full (100%)</option>
              <option value="75%">75%</option>
              <option value="50%">50%</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Margin Top</label>
              <NumericInput value={marginTop ?? 0} min={0} unit="px" onChange={(v) => setProp((p: AccordionStyleProps) => { p.marginTop = v; })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Margin Bottom</label>
              <NumericInput value={marginBottom ?? 16} min={0} unit="px" onChange={(v) => setProp((p: AccordionStyleProps) => { p.marginBottom = v; })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Margin Left</label>
              <NumericInput value={marginLeft ?? 0} min={0} unit="px" onChange={(v) => setProp((p: AccordionStyleProps) => { p.marginLeft = v; })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-brand-lighter">Margin Right</label>
              <NumericInput value={marginRight ?? 0} min={0} unit="px" onChange={(v) => setProp((p: AccordionStyleProps) => { p.marginRight = v; })} />
            </div>
          </div>
        </div>
      </DesignSection>

    </div>
  );
};
