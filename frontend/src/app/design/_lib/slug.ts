/** Generate URL-safe slug from a display name (e.g. "About Us" -> "about-us"). */
export function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    || "page";
}
