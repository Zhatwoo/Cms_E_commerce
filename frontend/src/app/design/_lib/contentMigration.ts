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
  // Broken Unsplash URLs (invalid photo ID or unsupported text param)
  ['https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=700&q=80&text=Accessories', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=700&q=80'],
  ['photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=700&q=80&text=', 'photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=700&q=80'],
];

// Match full Unsplash URL with broken photo ID (catches all param variations)
const BROKEN_UNSPLASH_PATTERN = /https:\/\/images\.unsplash\.com\/photo-1581093458791-9f3c3900df4b[^"'\s]*/g;
const FIXED_UNSPLASH = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=700&q=80';

function replaceInString(s: string): string {
  let out = s;
  for (const [oldText, newText] of MIGRATIONS) {
    if (out.includes(oldText)) {
      out = out.split(oldText).join(newText);
    }
  }
  out = out.replace(BROKEN_UNSPLASH_PATTERN, FIXED_UNSPLASH);
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
