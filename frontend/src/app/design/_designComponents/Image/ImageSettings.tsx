import React, { useRef, useState } from "react";
import { useNode } from "@craftjs/core";
import { Upload, X, Loader2 } from "lucide-react";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { TransformGroup } from "../../_components/rightPanel/settings/TransformGroup";
import { PositionGroup } from "../../_components/rightPanel/settings/PositionGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { AppearanceGroup } from "../../_components/rightPanel/settings/AppearanceGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import { useDesignProject } from "../../_context/DesignProjectContext";
import { uploadMediaApi } from "@/lib/api";
import { addFileToMediaLibrary } from "../../_lib/mediaActions";
import type { ImageProps, SetProp } from "../../_types/components";

export const ImageSettings = () => {
  const {
    src, alt, objectFit,
    width, height,
    borderRadius, radiusTopLeft, radiusTopRight, radiusBottomRight, radiusBottomLeft,
    paddingLeft, paddingRight, paddingTop, paddingBottom,
    marginLeft, marginRight, marginTop, marginBottom,
    opacity, boxShadow, overflow, cursor,
    rotation, flipHorizontal, flipVertical,
    position, display, alignSelf, zIndex, top, right, bottom, left, editorVisibility,
    actions: { setProp }
  } = useNode(node => ({
    src: node.data.props.src,
    alt: node.data.props.alt,
    objectFit: node.data.props.objectFit,
    width: node.data.props.width,
    height: node.data.props.height,
    borderRadius: node.data.props.borderRadius,
    radiusTopLeft: node.data.props.radiusTopLeft,
    radiusTopRight: node.data.props.radiusTopRight,
    radiusBottomRight: node.data.props.radiusBottomRight,
    radiusBottomLeft: node.data.props.radiusBottomLeft,
    paddingLeft: node.data.props.paddingLeft,
    paddingRight: node.data.props.paddingRight,
    paddingTop: node.data.props.paddingTop,
    paddingBottom: node.data.props.paddingBottom,
    marginLeft: node.data.props.marginLeft,
    marginRight: node.data.props.marginRight,
    marginTop: node.data.props.marginTop,
    marginBottom: node.data.props.marginBottom,
    opacity: node.data.props.opacity,
    boxShadow: node.data.props.boxShadow,
    overflow: node.data.props.overflow,
    cursor: node.data.props.cursor,
    rotation: node.data.props.rotation,
    flipHorizontal: node.data.props.flipHorizontal,
    flipVertical: node.data.props.flipVertical,
    position: node.data.props.position,
    display: node.data.props.display,
    alignSelf: node.data.props.alignSelf,
    zIndex: node.data.props.zIndex,
    top: node.data.props.top,
    right: node.data.props.right,
    bottom: node.data.props.bottom,
    left: node.data.props.left,
    editorVisibility: node.data.props.editorVisibility,
  }));

  const typedSetProp = setProp as SetProp<ImageProps>;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { projectId } = useDesignProject();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setUploadError(null);

    if (projectId) {
      setUploading(true);
      setUploadProgress(0);
      try {
        // Use addFileToMediaLibrary to ensure this upload shows up in the 'Media' tab in the left panel
        const item = await addFileToMediaLibrary(projectId, file);
        typedSetProp((props) => { props.src = item.url; });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Upload failed:", err);
        setUploadError(msg || "Upload failed");
        fallbackToDataUrl(file);
      } finally {
        setUploading(false);
        setUploadProgress(0);
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
      typedSetProp((props) => { props.src = dataUrl; });
    };
    reader.readAsDataURL(file);
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearImage = () => {
    typedSetProp((props) => { props.src = ''; });
  };

  const isDataUrl = src?.startsWith('data:image');

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Image">
        <div className="flex flex-col gap-3">
          {/* Source URL */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Source URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={src}
                onChange={(e) => typedSetProp((props) => { props.src = e.target.value; })}
                placeholder="https://example.com/image.jpg"
                className="flex-1 bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-2 focus:outline-none focus:border-[var(--builder-accent)]"
              />
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {/* Browse button */}
              <button
                type="button"
                onClick={handleBrowseClick}
                disabled={uploading}
                className="px-3 py-2 bg-[var(--builder-surface-3)] hover:bg-[var(--builder-surface-3)] border border-[var(--builder-border)] rounded-md transition-colors flex items-center justify-center disabled:opacity-50"
                title="Browse files"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 text-[var(--builder-text-muted)] animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 text-[var(--builder-text-muted)]" />
                )}
              </button>
              {/* Clear button (only show if image is selected) */}
              {src && (
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-md transition-colors flex items-center justify-center"
                  title="Clear image"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              )}
            </div>
            {uploading && (
              <div className="mt-1.5 flex flex-col gap-1">
                <div className="h-1.5 w-full bg-[var(--builder-surface-3)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--builder-accent)] rounded-full transition-[width] duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-[var(--builder-text-muted)]">{uploadProgress}% uploaded</p>
              </div>
            )}
            {uploadError && (
              <p className="text-[10px] text-red-400 mt-1.5">
                Upload failed: {uploadError}
              </p>
            )}
            {!projectId && (
              <p className="text-[9px] text-amber-400/90 mt-1">
                No project — uploads go through backend. Open a project to upload images.
              </p>
            )}
            {isDataUrl && !uploading && !uploadError && (
              <p className="text-[9px] text-[var(--builder-text-faint)] mt-1">
                Using local preview (not in Storage)
              </p>
            )}
            <p className="text-[9px] text-[var(--builder-text-faint)] mt-2 italic px-1">
              Tip: Drag & drop from the Media tab to replace instantly.
            </p>
          </div>

          {/* Alt Text */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Alt Text</label>
            <input
              type="text"
              value={alt}
              onChange={(e) => typedSetProp((props) => { props.alt = e.target.value; })}
              placeholder="Describe the image"
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-2 focus:outline-none focus:border-[var(--builder-accent)]"
            />
          </div>

          {/* Object Fit */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Object Fit</label>
            <select
              value={objectFit}
              onChange={(e) => typedSetProp((props) => {
                props.objectFit = e.target.value as ImageProps["objectFit"];
              })}
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-1.5 focus:outline-none"
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
              <option value="none">None</option>
              <option value="scale-down">Scale Down</option>
            </select>
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Transform" defaultOpen={false}>
        <TransformGroup
          rotation={rotation}
          flipHorizontal={flipHorizontal}
          flipVertical={flipVertical}
          setProp={typedSetProp}
        />
      </DesignSection>

      <DesignSection title="Layout & Layer" defaultOpen={false}>
        <PositionGroup
          position={position}
          display={display}
          alignSelf={alignSelf}
          zIndex={zIndex}
          top={top}
          right={right}
          bottom={bottom}
          left={left}
          editorVisibility={editorVisibility}
          setProp={typedSetProp as any}
        />
      </DesignSection>

      <DesignSection title="Size & Spacing">
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
          setProp={(updater) => {
            typedSetProp((props) => {
              const beforeWidth = props.width;
              const beforeHeight = props.height;
              updater(props);
              if (props.width !== beforeWidth || props.height !== beforeHeight) {
                props._autoFitInTabs = false;
              }
            });
          }}
        />
      </DesignSection>

      <DesignSection title="Appearance">
        <AppearanceGroup
          radiusTopLeft={radiusTopLeft}
          radiusTopRight={radiusTopRight}
          radiusBottomRight={radiusBottomRight}
          radiusBottomLeft={radiusBottomLeft}
          setProp={typedSetProp}
        />
      </DesignSection>

      <DesignSection title="Effects" defaultOpen={false}>
        <EffectsGroup
          opacity={opacity}
          boxShadow={boxShadow}
          overflow={overflow}
          cursor={cursor}
          setProp={typedSetProp}
        />
      </DesignSection>
    </div>
  );
};
