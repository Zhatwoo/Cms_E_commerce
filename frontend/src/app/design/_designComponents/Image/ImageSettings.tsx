import React, { useRef } from "react";
import { useNode } from "@craftjs/core";
import { Upload, X } from "lucide-react";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { AppearanceGroup } from "../../_components/rightPanel/settings/AppearanceGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import type { ImageProps, SetProp } from "../../_types/components";

export const ImageSettings = () => {
  const {
    src, alt, objectFit,
    width, height,
    borderRadius, radiusTopLeft, radiusTopRight, radiusBottomRight, radiusBottomLeft,
    paddingLeft, paddingRight, paddingTop, paddingBottom,
    marginLeft, marginRight, marginTop, marginBottom,
    opacity, boxShadow,
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
  }));

  const typedSetProp = setProp as SetProp<ImageProps>;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        typedSetProp((props) => { props.src = dataUrl; });
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
            <label className="text-[10px] text-brand-lighter">Source URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={src}
                onChange={(e) => typedSetProp((props) => { props.src = e.target.value; })}
                placeholder="https://example.com/image.jpg"
                className="flex-1 bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-2 focus:outline-none focus:border-brand-light"
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
                className="px-3 py-2 bg-brand-medium/30 hover:bg-brand-medium/50 border border-brand-medium/30 rounded-md transition-colors flex items-center justify-center"
                title="Browse files"
              >
                <Upload className="w-4 h-4 text-brand-light" />
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
            {isDataUrl && (
              <p className="text-[9px] text-brand-medium mt-1">
                Using uploaded image
              </p>
            )}
          </div>

          {/* Alt Text */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Alt Text</label>
            <input
              type="text"
              value={alt}
              onChange={(e) => typedSetProp((props) => { props.alt = e.target.value; })}
              placeholder="Describe the image"
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-2 focus:outline-none focus:border-brand-light"
            />
          </div>

          {/* Object Fit */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Object Fit</label>
            <select
              value={objectFit}
              onChange={(e) => typedSetProp((props) => {
                props.objectFit = e.target.value as ImageProps["objectFit"];
              })}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
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

      <DesignSection title="Corners">
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
          setProp={typedSetProp}
        />
      </DesignSection>
    </div>
  );
};
