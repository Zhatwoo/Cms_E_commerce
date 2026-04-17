export type TemplateProjectRegistryEntry = {
  projectId: string;
  name: string;
  category: string;
  description: string;
  savedAt: string;
};

const STORAGE_KEY = 'cms_template_projects_v1';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function listTemplateProjectEntries(): TemplateProjectRegistryEntry[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        projectId: String(item.projectId || '').trim(),
        name: String(item.name || '').trim(),
        category: String(item.category || '').trim(),
        description: String(item.description || '').trim(),
        savedAt: String(item.savedAt || '').trim(),
      }))
      .filter((item) => item.projectId.length > 0);
  } catch {
    return [];
  }
}

export function upsertTemplateProjectEntry(
  entry: Omit<TemplateProjectRegistryEntry, 'savedAt'> & { savedAt?: string }
): void {
  if (!canUseStorage()) return;

  const normalized: TemplateProjectRegistryEntry = {
    projectId: String(entry.projectId || '').trim(),
    name: String(entry.name || '').trim() || 'Untitled Template',
    category: String(entry.category || '').trim() || 'General',
    description: String(entry.description || '').trim() || 'No description provided.',
    savedAt: String(entry.savedAt || '').trim() || new Date().toISOString(),
  };

  if (!normalized.projectId) return;

  const existing = listTemplateProjectEntries();
  const next = [
    normalized,
    ...existing.filter((item) => item.projectId !== normalized.projectId),
  ];

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('template-project-registry:changed'));
  } catch {
    // ignore storage quota failures
  }
}
