import React from "react";
import { useEditor, Element } from "@craftjs/core";
import { Container } from "../../_assets/Container/Container";
import { Text } from "../../_assets/Text/Text";
import { Page } from "../../_assets/Page/Page";
import { Image } from "../../_assets/Image/Image";
import { Button } from "../../_assets/Button/Button";
import { Divider } from "../../_assets/Divider/Divider";

interface ComponentEntry {
  label: string;
  preview: string;
  previewBg?: string;
  element: React.ReactElement;
}

const COMPONENTS: ComponentEntry[] = [
  {
    label: "New Page",
    preview: "Page Preview",
    previewBg: "bg-white",
    element: <Element is={Page} canvas />,
  },
  {
    label: "Container Block",
    preview: "Container Preview",
    previewBg: "bg-brand-medium/20",
    element: <Element is={Container} background="#27272a" padding={20} canvas />,
  },
  {
    label: "Text Block",
    preview: "Text Preview",
    previewBg: "bg-brand-medium/20",
    element: <Text text="New Text" fontSize={16} />,
  },
  {
    label: "Image Block",
    preview: "Image Preview",
    previewBg: "bg-brand-medium/20",
    element: <Image />,
  },
  {
    label: "Button Block",
    preview: "Button Preview",
    previewBg: "bg-brand-medium/20",
    element: <Button label="Click me" />,
  },
  {
    label: "Divider",
    preview: "── Divider ──",
    previewBg: "bg-brand-medium/20",
    element: <Divider />,
  },
];

export const ComponentsPanel = () => {
  const { connectors } = useEditor();

  return (
    <div className="relative">
      <div className="flex flex-col gap-2">
        {COMPONENTS.map((comp) => (
          <div
            key={comp.label}
            ref={(ref) => {
              if (ref) connectors.create(ref, comp.element);
            }}
            className="bg-brand-white/5 p-4 rounded-xl hover:bg-brand-white/10 transition cursor-move border border-brand-medium/30 group"
          >
            <div
              className={`h-20 ${comp.previewBg ?? "bg-brand-medium/20"} rounded-lg mb-2 border border-dashed border-brand-medium/50 flex items-center justify-center text-xs shadow-sm ${comp.previewBg === "bg-white" ? "text-brand-black" : "text-brand-light"
                }`}
            >
              {comp.preview}
            </div>
            <span className="text-sm text-brand-lighter font-medium">{comp.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
