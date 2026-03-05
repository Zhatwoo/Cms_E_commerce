import type { BuilderDocument } from '../_types/schema';
import { serializeCraftToClean } from './serializer';

export function parseContentToCleanDoc(content: unknown): BuilderDocument | null {
  if (content == null) return null;

  try {
    let normalized: unknown = content;

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

    if (
      normalized &&
      typeof normalized === 'object' &&
      'version' in normalized &&
      'pages' in normalized &&
      'nodes' in normalized
    ) {
      return normalized as BuilderDocument;
    }

    const raw = typeof normalized === 'string' ? normalized : JSON.stringify(normalized);
    return serializeCraftToClean(raw);
  } catch {
    return null;
  }
}
