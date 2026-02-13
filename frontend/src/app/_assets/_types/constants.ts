import { TemplateCategory } from ".";

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  header: "Headers",
  hero: "Hero Sections",
  content: "Content Sections",
  footer: "Footers",
  form: "Forms",
  card: "Cards",
};

export const CATEGORY_ORDER: TemplateCategory[] = ["header", "hero", "content", "form", "card", "footer"];