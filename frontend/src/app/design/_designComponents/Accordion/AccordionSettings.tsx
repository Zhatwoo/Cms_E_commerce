import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { PositionGroup } from "../../_components/rightPanel/settings/PositionGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import { NumericInput } from "../../_components/rightPanel/settings/inputs/NumericInput";
import { ColorPicker } from "../../_components/rightPanel/settings/inputs/ColorPicker";
import { TypographyGroup } from "../../_components/rightPanel/settings/TypographyGroup";
import type { TypographyProps, SetProp, AccordionProps, AccordionItem, TransformProps, EffectsProps } from "../../_types/components";
import { Plus, Trash2 } from "lucide-react";
import { uploadMediaApi } from "@/lib/api";

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
    minHeight,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    position,
    display,
    zIndex,
    top,
    right,
    bottom,
    left,
    editorVisibility,
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
    opacity,
    boxShadow,
    overflow,
    cursor,
    node,
    fontFamily,
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
    minHeight: node.data.props.minHeight as number,
    marginTop: node.data.props.marginTop as number,
    marginRight: node.data.props.marginRight as number,
    marginBottom: node.data.props.marginBottom as number,
    marginLeft: node.data.props.marginLeft as number,
    position: node.data.props.position as AccordionProps["position"],
    display: node.data.props.display as AccordionProps["display"],
    zIndex: node.data.props.zIndex as number,
    top: node.data.props.top as string,
    right: node.data.props.right as string,
    bottom: node.data.props.bottom as string,
    left: node.data.props.left as string,
    editorVisibility: node.data.props.editorVisibility as AccordionProps["editorVisibility"],
    borderRadius: node.data.props.borderRadius as number,
    backgroundColor: node.data.props.backgroundColor as string,
    headerBg: node.data.props.headerBg as string,
    headerTextColor: node.data.props.headerTextColor as string,
    headerFontSize: node.data.props.headerFontSize as number,
    headerFontWeight: node.data.props.headerFontWeight as string,
    headerFontStyle: node.data.props.headerFontStyle as string,
    headerLetterSpacing: node.data.props.headerLetterSpacing as string | number,
    headerLineHeight: node.data.props.headerLineHeight as string | number,
    headerTextAlign: node.data.props.headerTextAlign as any,
    headerTextTransform: node.data.props.headerTextTransform as any,
    headerTextDecoration: node.data.props.headerTextDecoration as string,
    contentBg: node.data.props.contentBg as string,
    contentTextColor: node.data.props.contentTextColor as string,
    contentFontSize: node.data.props.contentFontSize as number,
    contentFontWeight: node.data.props.contentFontWeight as string,
    contentFontStyle: node.data.props.contentFontStyle as string,
    contentLetterSpacing: node.data.props.contentLetterSpacing as string | number,
    contentLineHeight: node.data.props.contentLineHeight as string | number,
    contentTextAlign: node.data.props.contentTextAlign as any,
    contentTextTransform: node.data.props.contentTextTransform as any,
    contentTextDecoration: node.data.props.contentTextDecoration as string,
    fontFamily: node.data.props.fontFamily as string,
    borderColor: node.data.props.borderColor as string,
    borderWidth: node.data.props.borderWidth as number,
    iconColor: node.data.props.iconColor as string,
    opacity: node.data.props.opacity as number,
    boxShadow: node.data.props.boxShadow as string,
    overflow: node.data.props.overflow as string,
    cursor: node.data.props.cursor as string,
    node,
  }));

  const safeItems: AccordionItem[] = Array.isArray(items) ? items : [];

  const updateItem = (index: number, key: keyof AccordionItem, value: string) => {
    setProp((props: AccordionProps) => {
      const copy = [...(props.items ?? [])];
      copy[index] = { ...copy[index], [key]: value };
      props.items = copy;
    });
  };

  const addItem = () => {
    setProp((props: AccordionProps) => {
      props.items = [
        ...(props.items ?? []),
        { title: `Item ${(props.items?.length ?? 0) + 1}`, content: "Add your content here.", mediaType: "none", mediaUrl: "" },
      ];
    });
  };

  const removeItem = (index: number) => {
    setProp((props: AccordionProps) => {
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

      setProp((props: AccordionProps) => {
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
      <DesignSection title="Items" defaultOpen>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Canvas Preview</label>
            <div className="grid grid-cols-2 gap-1 bg-[var(--builder-surface-2)] p-1 rounded-lg border border-[var(--builder-border)]">
              <button
                type="button"
                onClick={() => setProp((props: AccordionProps) => { props.editorPreviewMode = "expand-all"; })}
                className={`text-[10px] py-1.5 rounded transition-colors ${editorPreviewMode === "expand-all"
                  ? "bg-[var(--builder-accent)] text-black"
                  : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"
                }`}
              >
                Expand
              </button>
              <button
                type="button"
                onClick={() => setProp((props: AccordionProps) => { props.editorPreviewMode = "collapse-all"; })}
                className={`text-[10px] py-1.5 rounded transition-colors ${editorPreviewMode === "collapse-all"
                  ? "bg-[var(--builder-accent)] text-black"
                  : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"
                }`}
              >
                Collapse
              </button>
            </div>
          </div>

          {safeItems.map((item, index) => (
            <div key={index} className="flex flex-col gap-1.5 bg-[var(--builder-surface-2)] rounded-lg p-2 border border-[var(--builder-border)]">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--builder-text-faint)]">Item {index + 1}</span>
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
                <label className="text-[10px] text-[var(--builder-text)]">Title</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateItem(index, "title", e.target.value)}
                  className="w-full bg-[var(--builder-surface-1)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-[var(--builder-accent)]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[var(--builder-text)]">Content</label>
                <textarea
                  value={item.content}
                  rows={3}
                  onChange={(e) => updateItem(index, "content", e.target.value)}
                  className="w-full bg-[var(--builder-surface-1)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-[var(--builder-accent)] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-1">
                <label className="text-[10px] text-[var(--builder-text)]">Media Type</label>
                <select
                  value={item.mediaType ?? "none"}
                  onChange={(e) => updateItem(index, "mediaType", e.target.value as "none" | "image" | "video")}
                  className="w-full bg-[var(--builder-surface-1)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-[var(--builder-accent)]"
                >
                  <option value="none">None</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {(item.mediaType ?? "none") !== "none" && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--builder-text)]">
                    {(item.mediaType ?? "none") === "image" ? "Image URL" : "Video URL"}
                  </label>
                  <input
                    type="text"
                    value={item.mediaUrl ?? ""}
                    placeholder={(item.mediaType ?? "none") === "image" ? "https://.../image.jpg" : "https://.../video.mp4"}
                    onChange={(e) => updateItem(index, "mediaUrl", e.target.value)}
                    className="w-full bg-[var(--builder-surface-1)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none focus:border-[var(--builder-accent)]"
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
                      className="w-full rounded-md border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--builder-text)] hover:bg-[var(--builder-surface-3)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-dashed border-[var(--builder-border)] text-[10px] font-bold uppercase tracking-widest text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] hover:border-[var(--builder-border-mid)] transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Item
            </button>
          )}

          {/* Allow Multiple Toggle */}
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-[var(--builder-text)]">Allow Multiple Open</span>
            <button
              type="button"
              onClick={() => setProp((props: AccordionProps) => { props.allowMultiple = !props.allowMultiple; })}
              className={`relative w-9 h-5 rounded-full transition-colors ${allowMultiple ? "bg-blue-500" : "bg-[var(--builder-surface-3)]"}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${allowMultiple ? "translate-x-[18px]" : "translate-x-0.5"}`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-[var(--builder-text)]">Allow Collapse All</span>
            <button
              type="button"
              onClick={() => setProp((props: AccordionProps) => { props.allowCollapseAll = !props.allowCollapseAll; })}
              className={`relative w-9 h-5 rounded-full transition-colors ${allowCollapseAll !== false ? "bg-blue-500" : "bg-[var(--builder-surface-3)]"}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${allowCollapseAll !== false ? "translate-x-[18px]" : "translate-x-0.5"}`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Style Preset</label>
              <select
                value={stylePreset ?? "wix"}
                onChange={(e) => setProp((props: AccordionProps) => { props.stylePreset = e.target.value as "classic" | "wix"; })}
                className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none"
              >
                <option value="wix">Wix</option>
                <option value="classic">Classic</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Default Open Index</label>
              <NumericInput
                value={defaultOpenIndex ?? 0}
                min={0}
                max={Math.max(0, safeItems.length - 1)}
                onChange={(v) => setProp((props: AccordionProps) => { props.defaultOpenIndex = v; })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Animation (ms)</label>
              <NumericInput
                value={animationDurationMs ?? 280}
                min={80}
                max={1200}
                unit="ms"
                onChange={(v) => setProp((props: AccordionProps) => { props.animationDurationMs = v; })}
              />
            </div>
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Layout & Layer" defaultOpen={false}>
        <PositionGroup
          position={position}
          display={display}
          zIndex={zIndex}
          top={top}
          right={right}
          bottom={bottom}
          left={left}
          editorVisibility={editorVisibility}
          setProp={setProp as any}
        />
      </DesignSection>

      <DesignSection title="Size & Spacing" defaultOpen={false}>
        <SizePositionGroup
          width={width}
          minHeight={minHeight}
          marginTop={marginTop}
          marginRight={marginRight}
          marginBottom={marginBottom}
          marginLeft={marginLeft}
          setProp={setProp as any}
        />
      </DesignSection>

      <DesignSection title="Appearance" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Container Background</label>
            <ColorPicker value={backgroundColor ?? "transparent"} onChange={(v) => setProp((p: AccordionProps) => { p.backgroundColor = v; })} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Border Color</label>
            <ColorPicker value={borderColor ?? "#2d2d44"} onChange={(v) => setProp((p: AccordionProps) => { p.borderColor = v; })} className="w-full" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Border Width</label>
              <NumericInput value={borderWidth ?? 1} min={0} max={8} unit="px" onChange={(v) => setProp((p: AccordionProps) => { p.borderWidth = v; })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Radius</label>
              <NumericInput value={borderRadius ?? 8} min={0} max={32} unit="px" onChange={(v) => setProp((p: AccordionProps) => { p.borderRadius = v; })} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Header Background</label>
            <ColorPicker value={headerBg ?? "#1e1e2e"} onChange={(v) => setProp((p: AccordionProps) => { p.headerBg = v; })} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Content Background</label>
            <ColorPicker value={contentBg ?? "#12121c"} onChange={(v) => setProp((p: AccordionProps) => { p.contentBg = v; })} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Icon Color</label>
            <ColorPicker value={iconColor ?? "#94a3b8"} onChange={(v) => setProp((p: AccordionProps) => { p.iconColor = v; })} className="w-full" />
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Header Typography" defaultOpen={false}>
        <TypographyGroup
          fontSize={headerFontSize}
          fontWeight={headerFontWeight}
          fontFamily={fontFamily}
          fontStyle={node.data.props.headerFontStyle}
          lineHeight={node.data.props.headerLineHeight}
          letterSpacing={node.data.props.headerLetterSpacing}
          textAlign={node.data.props.headerTextAlign}
          textTransform={node.data.props.headerTextTransform}
          textDecoration={node.data.props.headerTextDecoration}
          color={headerTextColor}
          setProp={(cb) => setProp((props: any) => {
            const fake: TypographyProps = {
              fontSize: props.headerFontSize,
              fontWeight: props.headerFontWeight,
              fontFamily: props.fontFamily,
              fontStyle: props.headerFontStyle,
              lineHeight: props.headerLineHeight,
              letterSpacing: props.headerLetterSpacing,
              textAlign: props.headerTextAlign,
              textTransform: props.headerTextTransform,
              textDecoration: props.headerTextDecoration,
              color: props.headerTextColor,
            };
            cb(fake);
            props.headerFontSize = fake.fontSize;
            props.headerFontWeight = fake.fontWeight;
            props.fontFamily = fake.fontFamily;
            props.headerFontStyle = fake.fontStyle;
            props.headerLineHeight = fake.lineHeight;
            props.headerLetterSpacing = fake.letterSpacing;
            props.headerTextAlign = fake.textAlign;
            props.headerTextTransform = fake.textTransform;
            props.headerTextDecoration = fake.textDecoration;
            props.headerTextColor = fake.color;
          })}
        />
      </DesignSection>

      <DesignSection title="Content Typography" defaultOpen={false}>
        <TypographyGroup
          fontSize={contentFontSize}
          fontWeight={node.data.props.contentFontWeight}
          fontFamily={fontFamily}
          fontStyle={node.data.props.contentFontStyle}
          lineHeight={node.data.props.contentLineHeight}
          letterSpacing={node.data.props.contentLetterSpacing}
          textAlign={node.data.props.contentTextAlign}
          textTransform={node.data.props.contentTextTransform}
          textDecoration={node.data.props.contentTextDecoration}
          color={contentTextColor}
          setProp={(cb) => setProp((props: any) => {
            const fake: TypographyProps = {
              fontSize: props.contentFontSize,
              fontWeight: props.contentFontWeight,
              fontFamily: props.fontFamily,
              fontStyle: props.contentFontStyle,
              lineHeight: props.contentLineHeight,
              letterSpacing: props.contentLetterSpacing,
              textAlign: props.contentTextAlign,
              textTransform: props.contentTextTransform,
              textDecoration: props.contentTextDecoration,
              color: props.contentTextColor,
            };
            cb(fake);
            props.contentFontSize = fake.fontSize;
            props.contentFontWeight = fake.fontWeight;
            props.fontFamily = fake.fontFamily;
            props.contentFontStyle = fake.fontStyle;
            props.contentLineHeight = fake.lineHeight;
            props.contentLetterSpacing = fake.letterSpacing;
            props.contentTextAlign = fake.textAlign;
            props.contentTextTransform = fake.textTransform;
            props.contentTextDecoration = fake.textDecoration;
            props.contentTextColor = fake.color;
          })}
        />
      </DesignSection>

      <DesignSection title="Effects" defaultOpen={false}>
        <EffectsGroup
          opacity={opacity}
          boxShadow={boxShadow}
          overflow={overflow}
          cursor={cursor}
          setProp={setProp as any}
        />
      </DesignSection>


    </div>
  );
};
