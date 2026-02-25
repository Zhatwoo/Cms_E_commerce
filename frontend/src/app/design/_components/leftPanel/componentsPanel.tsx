import React from "react";
import { useEditor, Element } from "@craftjs/core";
import { Container } from "../../_designComponents/Container/Container";
import { Text } from "../../_designComponents/Text/Text";
import { Image } from "../../_designComponents/Image/Image";
import { Button } from "../../_designComponents/Button/Button";
import { Divider } from "../../_designComponents/Divider/Divider";
import { Section } from "../../_designComponents/Section/Section";
import { Row } from "../../_designComponents/Row/Row";
import { Column } from "../../_designComponents/Column/Column";
import { Frame } from "../../_designComponents/Frame/Frame";
import { useAddPageToCanvas } from "../useAddPageToCanvas";
import { CRAFT_RESOLVER } from "../craftResolver";

// Dito naman ilalagay yung mga raw components na may default na properties
interface ComponentEntry {
  label: string;
  preview: string;
  previewBg?: string;
  element?: React.ReactElement;
  dragElement?: React.ReactElement;
  category: "page" | "layout" | "basic";
}

const COMPONENTS: ComponentEntry[] = [
  // ─── Page ──────────────────────────────────────────
  {
    label: "New Page",
    preview: "Page Preview",
    previewBg: "bg-brand-light",
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
    previewBg: "bg-brand-medium-dark",
    element: <Element is={Container} background="#27272a" padding={20} canvas />,
    category: "layout",
  },
  {
    label: "Frame",
    preview: "▢ Responsive",
    previewBg: "bg-brand-medium-dark",
    element: <Element is={Frame} referenceWidth={1440} referenceHeight={900} canvas />,
    category: "layout",
  },
  // ─── Basic ─────────────────────────────────────────
  {
    label: "Text",
    preview: "Aa",
    previewBg: "bg-brand-dark",
    element: <Text text="New Text" fontSize={16} />,
    category: "basic",
  },
  {
    label: "Heading",
    preview: "Aa",
    previewBg: "bg-brand-dark",
    element: <Text text="Heading" fontSize={24} fontWeight="600" />,
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
    element: <Element is={Button} canvas label="Click me" />,
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
  const addPageToCanvas = useAddPageToCanvas();
  const pageComponent = CRAFT_RESOLVER.Page ?? Container;

  const components: ComponentEntry[] = COMPONENTS.map((comp) => {
    if (comp.label !== "New Page") return comp;
    return {
      ...comp,
      dragElement: <Element is={pageComponent} canvas />,
    };
  });

  return (
    <div className="relative">
      <div className="flex flex-col gap-4">
        {CATEGORY_ORDER.map((cat) => {
          const items = components.filter((c) => c.category === cat);
          if (items.length === 0) return null;

          return (
            <div key={cat} className="flex flex-col gap-2">
              <span className="text-[10px] font-semibold text-brand-medium uppercase tracking-wider px-1">
                {CATEGORY_LABELS[cat]}
              </span>
              {items.map((comp) => (
                <div
                  key={comp.label}
                  data-component-new-page={comp.label === "New Page" ? "true" : undefined}
                  ref={(ref) => {
                    if (!ref) return;
                    if (comp.label === "New Page") return;
                    const sourceElement = comp.dragElement ?? comp.element;
                    if (!sourceElement) return;
                    connectors.create(ref, sourceElement);
                  }}
                  onClick={() => {
                    if (comp.label === "New Page") addPageToCanvas();
                  }}
                  className={`bg-brand-white/5 p-4 rounded-xl hover:bg-brand-white/10 transition border border-brand-medium/30 group ${
                    (comp.dragElement ?? comp.element) ? "cursor-move" : "cursor-pointer"
                  }`}
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
