import { ReactElement, ReactNode } from "react";

export type TemplateCategory =
  | "header"
  | "hero"
  | "content"
  | "footer"
  | "form"
  | "card"
  | "icon";

export interface TemplateEntry {
  label: string;
  description: string;
  preview: ReactNode;
  element: ReactElement;
  category: TemplateCategory;
}

export * from "./constants";