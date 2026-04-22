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

function dispatchTemplateProjectRegistryChanged(): void {
  if (!canUseStorage()) return;

  try {
    window.dispatchEvent(new CustomEvent('template-project-registry:changed'));
  } catch {
    // ignore custom event failures
  }
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
    dispatchTemplateProjectRegistryChanged();
  } catch {
    // ignore storage quota failures
  }
}

export function updateTemplateProjectEntry(
  projectId: string,
  patch: Partial<Omit<TemplateProjectRegistryEntry, 'projectId' | 'savedAt'>> & { savedAt?: string }
): void {
  if (!canUseStorage()) return;

  const normalizedProjectId = String(projectId || '').trim();
  if (!normalizedProjectId) return;

  const existing = listTemplateProjectEntries();
  let changed = false;
  const next = existing.map((item) => {
    if (item.projectId !== normalizedProjectId) return item;
    changed = true;
    return {
      ...item,
      name: patch.name !== undefined ? String(patch.name || '').trim() || item.name : item.name,
      category: patch.category !== undefined ? String(patch.category || '').trim() || item.category : item.category,
      description: patch.description !== undefined ? String(patch.description || '').trim() || item.description : item.description,
      savedAt: patch.savedAt !== undefined ? String(patch.savedAt || '').trim() || item.savedAt : item.savedAt,
    };
  });

  if (!changed) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    dispatchTemplateProjectRegistryChanged();
  } catch {
    // ignore storage quota failures
  }
}

export function removeTemplateProjectEntry(projectId: string): void {
  if (!canUseStorage()) return;

  const normalizedProjectId = String(projectId || '').trim();
  if (!normalizedProjectId) return;

  const existing = listTemplateProjectEntries();
  const next = existing.filter((item) => item.projectId !== normalizedProjectId);
  if (next.length === existing.length) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    dispatchTemplateProjectRegistryChanged();
  } catch {
    // ignore storage quota failures
  }
}
