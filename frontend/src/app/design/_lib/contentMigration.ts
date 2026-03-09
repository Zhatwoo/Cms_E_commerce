/**
 * Migrate old default template text to professional website copy.
 * Applied when loading published site content so existing sites update without re-publish.
 * Uses deep recursive replacement to catch text in any structure (clean format, Craft format, etc).
 */
const MIGRATIONS: Array<[string, string]> = [
  ['Create Beautiful Websites', 'Welcome to Our Website'],
  ['Our visual builder makes it easy to create stunning websites without writing a single line of code.', "We're here to help you discover what you need. Browse our offerings and get in touch."],
  ['Start Building', 'Learn More'],
  // Testimonial placeholders
  ['"Excellent service and support. Highly recommended!"', '"Quality products and great experience. Will definitely be back."'],
  ['John Doe', 'Happy Customer'],
  ['CEO, Company Name', 'Verified Buyer'],
  ['JD', 'HC'], // avatar initials
];

function replaceInString(s: string): string {
  let out = s;
  for (const [oldText, newText] of MIGRATIONS) {
    if (out.includes(oldText)) {
      out = out.split(oldText).join(newText);
    }
  }
  return out;
}

function migrateValue(val: unknown): unknown {
  if (typeof val === 'string') {
    return replaceInString(val);
  }
  if (Array.isArray(val)) {
    return val.map(migrateValue);
  }
  if (val && typeof val === 'object' && val.constructor === Object) {
    const obj = val as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = migrateValue(v);
    }
    return out;
  }
  return val;
}

export function migratePublishedContent(content: unknown): unknown {
  if (!content) return content;
  return migrateValue(content);
}
