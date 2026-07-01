"use client";

import React from "react";
import { useNode } from "@craftjs/core";

export interface ImportedBlockProps {
  blockName?: string;
  blockCss?: string;
  blockHtml?: string;
}

export const ImportedBlock = ({
  blockName = "Imported",
  blockCss = "",
  blockHtml = "<div>Empty</div>",
}: ImportedBlockProps) => {
  const { id, connectors } = useNode();
  const scopeId = `imported-${id.replace(/[^a-z0-9]/gi, "")}`;

  const scopedCss = blockCss
    ? blockCss.replace(/([^{}]+)\{/g, (_, sel) => {
        const s = sel.trim();
        if (s.startsWith("@keyframes") || s.startsWith("@media") || s.startsWith("@")) return `${s} {`;
        return `.${scopeId} ${s} {`;
      })
    : "";

  return (
    <div
      ref={(ref) => { if (ref) connectors.connect(connectors.drag(ref)); }}
      data-node-id={id}
      className={`${scopeId} imported-block cursor-pointer`}
      style={{ display: "inline-block", minWidth: 1, minHeight: 1 }}
    >
      {scopedCss && <style dangerouslySetInnerHTML={{ __html: scopedCss }} />}
      <div dangerouslySetInnerHTML={{ __html: blockHtml }} />
    </div>
  );
};

ImportedBlock.craft = {
  displayName: "ImportedBlock",
  props: {
    blockName: "Imported",
    blockCss: "",
    blockHtml: "<div>Empty</div>",
  },
};
