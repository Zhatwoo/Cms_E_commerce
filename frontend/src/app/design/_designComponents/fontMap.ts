const FONT_STACK_MAP: Record<string, string> = {
  "inter": "Inter",
  "roboto": "Roboto",
  "open sans": "Open Sans",
  "poppins": "Poppins",
  "ubuntu": "Ubuntu",
  "lato": "Lato",
  "raleway": "Raleway",
  "playfair display": "Playfair Display",
  "eb garamond": "EB Garamond",
  "merriweather": "Merriweather",
  "lora": "Lora",
  "montserrat": "Montserrat",
  "oswald": "Oswald",
  "pacifico": "Pacifico",
  "jetbrains mono": "JetBrains Mono",
  "fira code": "Fira Code",
  "monospace": "monospace",
};

function toCssVarName(name: string) {
  // Convert "open sans" -> "Open-Sans", "eb garamond" -> "EB-Garamond"
  return name
    .split(/\s+/)
    .map((w) => w.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join("-"))
    .join("-");
}

export function resolveFontFamily(fontFamily?: string): string | undefined {
  if (!fontFamily) return fontFamily;

  const cleaned = fontFamily.trim();
  const normalized = cleaned.toLowerCase();

  // If the font exists in our map, prefer the CSS variable that Next's font loader injects.
  const mapped = FONT_STACK_MAP[normalized];
  if (mapped) {
    const varName = toCssVarName(mapped);
    return `var(--ff-${varName})`;
  }

  // Return early for explicit CSS values or existing var() usages.
  if (cleaned.includes(",") || cleaned.startsWith("var(")) {
    return cleaned;
  }

  // For multi-word unknown fonts, quote them so CSS recognises the family name.
  if (cleaned.includes(" ")) {
    return `'${cleaned}'`;
  }

  return cleaned;
}