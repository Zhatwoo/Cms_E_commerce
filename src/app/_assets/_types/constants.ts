import { TemplateCategory } from ".";

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  header: "Headers",
  hero: "Hero Sections",
  content: "Content Sections",
  landing: "Landing Pages",
  footer: "Footers",
  form: "Forms",
  card: "Cards",
  icon: "Icons",
};

export const CATEGORY_ORDER: TemplateCategory[] = ["header", "hero", "content", "landing", "form", "card", "footer", "icon"];