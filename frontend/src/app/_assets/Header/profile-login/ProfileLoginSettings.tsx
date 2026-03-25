"use client";

import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "@/app/design/_components/rightPanel/settings/DesignSection";
import { TypographyGroup } from "@/app/design/_components/rightPanel/settings/TypographyGroup";
import type { SetProp } from "@/app/design/_types/components";

type ProfileLoginSettingsProps = {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  lineHeight?: number | string;
  letterSpacing?: number | string;
  textAlign?: "left" | "center" | "right" | "justify";
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  color?: string;
};

export const ProfileLoginSettings = () => {
  const {
    text,
    fontSize,
    fontFamily,
    fontWeight,
    fontStyle,
    lineHeight,
    letterSpacing,
    textAlign,
    textTransform,
    color,
    actions: { setProp },
  } = useNode((node) => ({
    text: node.data.props.text,
    fontSize: node.data.props.fontSize,
    fontFamily: node.data.props.fontFamily,
    fontWeight: node.data.props.fontWeight,
    fontStyle: node.data.props.fontStyle,
    lineHeight: node.data.props.lineHeight,
    letterSpacing: node.data.props.letterSpacing,
    textAlign: node.data.props.textAlign,
    textTransform: node.data.props.textTransform,
    color: node.data.props.color,
  }));

  const typedSetProp = setProp as SetProp<ProfileLoginSettingsProps>;

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Typography">
        <div className="flex flex-col gap-3">
          <input
            value={typeof text === "string" ? text : ""}
            onChange={(e) => typedSetProp((props) => { props.text = e.target.value; })}
            placeholder="Login text"
            className="w-full bg-[var(--builder-surface-2)] p-2 rounded-lg text-[var(--builder-text)] focus:border-[var(--builder-accent)] focus:outline-none"
          />

          <TypographyGroup
            fontFamily={typeof fontFamily === "string" ? fontFamily : "Outfit"}
            fontWeight={typeof fontWeight === "string" ? fontWeight : "400"}
            fontStyle={fontStyle === "italic" ? "italic" : "normal"}
            fontSize={typeof fontSize === "number" ? fontSize : 18}
            lineHeight={typeof lineHeight === "number" || typeof lineHeight === "string" ? lineHeight : 1.5}
            letterSpacing={typeof letterSpacing === "number" || typeof letterSpacing === "string" ? letterSpacing : 0}
            textAlign={
              textAlign === "center" || textAlign === "right" || textAlign === "justify" || textAlign === "left"
                ? textAlign
                : "left"
            }
            textTransform={
              textTransform === "uppercase" || textTransform === "lowercase" || textTransform === "capitalize" || textTransform === "none"
                ? textTransform
                : "none"
            }
            color={typeof color === "string" ? color : "#000000"}
            setProp={typedSetProp as unknown as SetProp<any>}
            showAlignmentControls={false}
          />
        </div>
      </DesignSection>
    </div>
  );
};
