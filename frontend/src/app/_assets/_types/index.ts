import { ReactElement } from "react";

export type TemplateCategory = "header" | "hero" | "content" | "footer" | "form" | "card";

export interface TemplateEntry {
  label: string;
  description: string;
  preview: string;
  element: ReactElement;
  category: TemplateCategory;
}

export * from "./constants";