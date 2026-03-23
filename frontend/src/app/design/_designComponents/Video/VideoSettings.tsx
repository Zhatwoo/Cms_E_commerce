import React, { useRef, useState } from "react";
import { useNode } from "@craftjs/core";
import { Upload, X, Loader2 } from "lucide-react";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { TransformGroup } from "../../_components/rightPanel/settings/TransformGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { AppearanceGroup } from "../../_components/rightPanel/settings/AppearanceGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import { useDesignProject } from "../../_context/DesignProjectContext";
import { uploadMediaApi } from "@/lib/api";
import { addFileToMediaLibrary } from "../../_lib/mediaActions";
import type { VideoProps, SetProp } from "../../_types/components";

export const VideoSettings = () => {
    const {
        src, autoPlay, loop, muted, controls, objectFit,
        width, height,
        borderRadius, radiusTopLeft, radiusTopRight, radiusBottomRight, radiusBottomLeft,
        paddingLeft, paddingRight, paddingTop, paddingBottom,
        marginLeft, marginRight, marginTop, marginBottom,
        opacity, boxShadow,
        rotation, flipHorizontal, flipVertical,
        actions: { setProp }
    } = useNode(node => ({
        src: node.data.props.src,
        autoPlay: node.data.props.autoPlay,
        loop: node.data.props.loop,
        muted: node.data.props.muted,
        controls: node.data.props.controls,
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
        rotation: node.data.props.rotation,
        flipHorizontal: node.data.props.flipHorizontal,
        flipVertical: node.data.props.flipVertical,
    }));

    const typedSetProp = setProp as SetProp<VideoProps>;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const { projectId } = useDesignProject();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith("video/")) {
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
            } finally {
                setUploading(false);
                setUploadProgress(0);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
            return;
        }
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const handleClearVideo = () => {
        typedSetProp((props) => { props.src = ''; });
    };

    return (
        <div className="flex flex-col pb-4">
            <DesignSection title="Position & Transform">
                <TransformGroup
                    rotation={rotation}
                    flipHorizontal={flipHorizontal}
                    flipVertical={flipVertical}
                    setProp={typedSetProp}
                />
            </DesignSection>

            <DesignSection title="Video Source">
                <div className="flex flex-col gap-3">
                    {/* Source URL */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-[var(--builder-text)]">Source URL</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={src}
                                onChange={(e) => typedSetProp((props) => { props.src = e.target.value; })}
                                placeholder="https://example.com/video.mp4"
                                className="flex-1 bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-2 focus:outline-none focus:border-[var(--builder-accent)]"
                            />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
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
                            {src && (
                                <button
                                    type="button"
                                    onClick={handleClearVideo}
                                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-md transition-colors flex items-center justify-center"
                                    title="Clear video"
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
                        <p className="text-[9px] text-[var(--builder-text-faint)] mt-2 italic px-1">
                            Tip: Drag & drop from the Media tab to replace instantly.
                        </p>
                    </div>

                    {/* Object Fit */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-[var(--builder-text)]">Object Fit</label>
                        <select
                            value={objectFit}
                            onChange={(e) => typedSetProp((props) => {
                                props.objectFit = e.target.value as VideoProps["objectFit"];
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

            <DesignSection title="Playback Settings">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-2 bg-[var(--builder-surface-2)]/30 rounded-md border border-[var(--builder-border)]">
                        <span className="text-[10px] text-[var(--builder-text)] uppercase tracking-wider">Autoplay</span>
                        <input
                            type="checkbox"
                            checked={autoPlay}
                            onChange={(e) => typedSetProp(props => { props.autoPlay = e.target.checked; })}
                            className="w-3 h-3 accent-[var(--builder-accent)]"
                        />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-[var(--builder-surface-2)]/30 rounded-md border border-[var(--builder-border)]">
                        <span className="text-[10px] text-[var(--builder-text)] uppercase tracking-wider">Loop</span>
                        <input
                            type="checkbox"
                            checked={loop}
                            onChange={(e) => typedSetProp(props => { props.loop = e.target.checked; })}
                            className="w-3 h-3 accent-[var(--builder-accent)]"
                        />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-[var(--builder-surface-2)]/30 rounded-md border border-[var(--builder-border)]">
                        <span className="text-[10px] text-[var(--builder-text)] uppercase tracking-wider">Muted</span>
                        <input
                            type="checkbox"
                            checked={muted}
                            onChange={(e) => typedSetProp(props => { props.muted = e.target.checked; })}
                            className="w-3 h-3 accent-[var(--builder-accent)]"
                        />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-[var(--builder-surface-2)]/30 rounded-md border border-[var(--builder-border)]">
                        <span className="text-[10px] text-[var(--builder-text)] uppercase tracking-wider">Controls</span>
                        <input
                            type="checkbox"
                            checked={controls}
                            onChange={(e) => typedSetProp(props => { props.controls = e.target.checked; })}
                            className="w-3 h-3 accent-[var(--builder-accent)]"
                        />
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

            <DesignSection title="Appearance">
                <AppearanceGroup
                    radiusTopLeft={radiusTopLeft}
                    radiusTopRight={radiusTopRight}
                    radiusBottomRight={radiusBottomRight}
                    radiusBottomLeft={radiusBottomLeft}
                    showBackgroundImageOption={false}
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
