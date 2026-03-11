import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { TransformGroup } from "../../_components/rightPanel/settings/TransformGroup";
import { AppearanceGroup } from "../../_components/rightPanel/settings/AppearanceGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import type { SpacerProps, SetProp } from "../../_types/components";

export const SpacerSettings = () => {
    const {
        width, height,
        paddingLeft, paddingRight, paddingTop, paddingBottom,
        marginLeft, marginRight, marginTop, marginBottom,
        rotation, flipHorizontal, flipVertical,
        radiusTopLeft, radiusTopRight, radiusBottomRight, radiusBottomLeft,
        opacity, boxShadow,
        actions: { setProp }
    } = useNode(node => ({
        width: node.data.props.width ?? "100%",
        height: node.data.props.height ?? "20px",
        paddingLeft: node.data.props.paddingLeft ?? 0,
        paddingRight: node.data.props.paddingRight ?? 0,
        paddingTop: node.data.props.paddingTop ?? 0,
        paddingBottom: node.data.props.paddingBottom ?? 0,
        marginLeft: node.data.props.marginLeft ?? 0,
        marginRight: node.data.props.marginRight ?? 0,
        marginTop: node.data.props.marginTop ?? 0,
        marginBottom: node.data.props.marginBottom ?? 0,
        rotation: node.data.props.rotation ?? 0,
        flipHorizontal: node.data.props.flipHorizontal ?? false,
        flipVertical: node.data.props.flipVertical ?? false,
        radiusTopLeft: node.data.props.radiusTopLeft ?? 0,
        radiusTopRight: node.data.props.radiusTopRight ?? 0,
        radiusBottomRight: node.data.props.radiusBottomRight ?? 0,
        radiusBottomLeft: node.data.props.radiusBottomLeft ?? 0,
        opacity: node.data.props.opacity ?? 1,
        boxShadow: node.data.props.boxShadow ?? "none",
    }));

    const typedSetProp = setProp as SetProp<SpacerProps>;

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

            <DesignSection title="Appearance" defaultOpen={false}>
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
