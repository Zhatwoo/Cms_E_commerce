import type { BuilderDocument } from '../_types/schema';
import { serializeCraftToClean } from './serializer';

export function parseContentToCleanDoc(content: unknown): BuilderDocument | null {
  if (content == null) return null;

  try {
    let normalized: unknown = content;

    // Unwrap up to 2 levels of JSON string encoding
    for (let i = 0; i < 2; i += 1) {
      if (typeof normalized !== 'string') break;
      const trimmed = normalized.trim();
      if (!trimmed) return null;
      try {
        normalized = JSON.parse(trimmed);
      } catch {
        break;
      }
    }

    // If it's a plain object with the expected clean doc shape, return it directly.
    // Use a round-trip through JSON to strip any non-serializable values (Firestore Timestamps, etc.)
    if (
      normalized &&
      typeof normalized === 'object' &&
      'version' in normalized &&
      'pages' in normalized &&
      'nodes' in normalized
    ) {
      try {
        return JSON.parse(JSON.stringify(normalized)) as BuilderDocument;
      } catch {
        return normalized as BuilderDocument;
      }
    }

    const raw = typeof normalized === 'string' ? normalized : JSON.stringify(normalized);
    return serializeCraftToClean(raw);
  } catch {
    return null;
  }
}
