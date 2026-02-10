import React from "react";
import { useEditor, Element } from "@craftjs/core";
import { Container } from "../../_designComponents/Container/Container";
import { Text } from "../../_designComponents/Text/Text";
import { Page } from "../../_designComponents/Page/Page";
import { Image } from "../../_designComponents/Image/Image";
import { Button } from "../../_designComponents/Button/Button";
import { Divider } from "../../_designComponents/Divider/Divider";
import { Section } from "../../_designComponents/Section/Section";
import { Row } from "../../_designComponents/Row/Row";
import { Column } from "../../_designComponents/Column/Column";

// Dito naman ilalagay yung mga raw components na may default na properties
interface ComponentEntry {
  label: string;
  preview: string;
  previewBg?: string;
  element: React.ReactElement;
  category: "page" | "layout" | "basic";
}

const COMPONENTS: ComponentEntry[] = [
  // ─── Page ──────────────────────────────────────────
  {
    label: "New Page",
    preview: "Page Preview",
    previewBg: "bg-brand-light",
    element: <Element is={Page} canvas />,
    category: "page",
  },
  // ─── Layout ────────────────────────────────────────
  {
    label: "Section",
    preview: "━━ Section ━━",
    previewBg: "bg-brand-medium-dark",
    element: <Element is={Section} canvas />,
    category: "layout",
  },
  {
    label: "Row",
    preview: "[ ═ ║ ═ ║ ═ ]",
    previewBg: "bg-brand-medium-dark",
    element: <Element is={Row} canvas />,
    category: "layout",
  },
  {
    label: "Column",
    preview: "║ Column ║",
    previewBg: "bg-brand-medium-dark",
    element: <Element is={Column} canvas />,
    category: "layout",
  },
  {
    label: "Container",
    preview: "Container Preview",
    previewBg: "bg-brand-medium",
    element: <Element is={Container} padding={20} canvas />,
    category: "layout",
  },
  // ─── Basic ─────────────────────────────────────────
  {
    label: "Text",
    preview: "Text Preview",
    previewBg: "bg-brand-dark",
    element: <Text text="New Text" fontSize={16} />,
    category: "basic",
  },
  {
    label: "Image",
    preview: "Image Preview",
    previewBg: "bg-red-500/10",
    element: <Image />,
    category: "basic",
  },
  {
    label: "Button",
    preview: "Button Preview",
    previewBg: "bg-blue-500/10",
    element: <Button label="Click me" />,
    category: "basic",
  },
  {
    label: "Divider",
    preview: "── Divider ──",
    previewBg: "bg-brand-darker",
    element: <Divider />,
    category: "basic",
  },
];

const CATEGORY_LABELS: Record<ComponentEntry["category"], string> = {
  page: "Page",
  layout: "Layout",
  basic: "Basic",
};

const CATEGORY_ORDER: ComponentEntry["category"][] = ["page", "layout", "basic"];

export const ComponentsPanel = () => {
  const { connectors } = useEditor();

  return (
    <div className="relative">
      <div className="flex flex-col gap-4">
        {CATEGORY_ORDER.map((cat) => {
          const items = COMPONENTS.filter((c) => c.category === cat);
          if (items.length === 0) return null;

          return (
            <div key={cat} className="flex flex-col gap-2">
              <span className="text-[10px] font-semibold text-brand-medium uppercase tracking-wider px-1">
                {CATEGORY_LABELS[cat]}
              </span>
              {items.map((comp) => (
                <div
                  key={comp.label}
                  ref={(ref) => {
                    if (ref) connectors.create(ref, comp.element);
                  }}
                  className="bg-brand-white/5 p-4 rounded-xl hover:bg-brand-white/10 transition cursor-move border border-brand-medium/30 group"
                >
                  <div
                    className={`h-20 ${comp.previewBg ?? "bg-brand-medium/20"} rounded-lg mb-2 border border-dashed border-brand-medium/50 flex items-center justify-center text-xs shadow-sm ${comp.previewBg === "bg-white"
                      ? "text-brand-black"
                      : "text-brand-lighter"
                      }`}
                  >
                    {comp.preview}
                  </div>
                  <span className="text-sm text-brand-white font-medium">
                    {comp.label}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
