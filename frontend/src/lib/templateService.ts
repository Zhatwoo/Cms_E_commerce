import { BuilderDocument } from '@/app/design/_types/schema';

export interface Template {
  id: string;
  name: string;
  title: string; // For backward compatibility
  category: string;
  description: string;
  desc: string; // For backward compatibility  
  thumbnail: string;
  imageColor?: string; // For gradient backgrounds
  status?: 'New' | 'Popular' | 'Coming Soon';
  data: BuilderDocument;
  createdAt: Date;
  updatedAt: Date;
  isBuiltIn: boolean;
  username?: string;
  domainName?: string;
}

class TemplateService {
  private readonly STORAGE_KEY = 'cms_templates';

  // Get all templates
  getTemplates(): Template[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return this.getBuiltInTemplates();

    try {
      const templates = JSON.parse(stored);
      return [...this.getBuiltInTemplates(), ...templates];
    } catch {
      return this.getBuiltInTemplates();
    }
  }

  // Get built-in templates
  private getBuiltInTemplates(): Template[] {
    return [
      {
        id: 'minimal-blog',
        name: 'Minimal Blog',
        title: 'Minimal Blog',
        category: 'Blog',
        description: 'A clean, typography-focused blog template perfect for writers.',
        desc: 'A clean, typography-focused blog template perfect for writers.',
        thumbnail: '📝',
        imageColor: 'from-pink-500 to-rose-500',
        status: 'Popular',
        data: {
          version: 1,
          pages: [
            {
              id: 'page-1',
              props: { width: '1000px', background: '#ffffff' },
              children: ['container-1']
            }
          ],
          nodes: {
            'container-1': {
              type: 'Container',
              props: { padding: 40, background: '#ffffff' },
              children: ['text-1', 'text-2']
            },
            'text-1': {
              type: 'Text',
              props: { text: 'Welcome to My Blog', fontSize: 32 },
              children: []
            },
            'text-2': {
              type: 'Text',
              props: { text: 'A clean space for thoughts and ideas', fontSize: 16 },
              children: []
            }
          }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isBuiltIn: true
      }
      // Add more built-in templates here
    ];
  }

  /**
   * Save template from design editor.
   * @param name - Template name
   * @param category - Template category
   * @param description - Template description
   * @param content - Optional: current design JSON (Craft or clean format). If not provided, falls back to sessionStorage 'craftjs_preview_json'.
   */
  saveTemplate(name: string, category: string, description: string, content?: string | null): Template | null {
    if (typeof window === 'undefined') return null;

    // Use provided content (e.g. from preview page) or fall back to sessionStorage
    const rawJson = content ?? sessionStorage.getItem('craftjs_preview_json');
    if (!rawJson || !rawJson.trim()) return null;

    try {
      let cleanData: BuilderDocument;
      const parsed = JSON.parse(rawJson) as Record<string, unknown>;

      // Already clean format (from API/draft): has version + pages
      if (typeof parsed?.version === 'number' && Array.isArray(parsed?.pages)) {
        cleanData = parsed as unknown as BuilderDocument;
      } else {
        // Craft.js raw format: convert to clean
        const { serializeCraftToClean } = require('@/app/design/_lib/serializer');
        cleanData = serializeCraftToClean(rawJson);
      }

      const template: Template = {
        id: `template-${Date.now()}`,
        name,
        title: name,
        category,
        description,
        desc: description,
        thumbnail: '/api/placeholder/template',
        imageColor: 'from-blue-500 to-cyan-500',
        data: cleanData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isBuiltIn: false
      };

      // Get existing user templates
      const existing = localStorage.getItem(this.STORAGE_KEY);
      const userTemplates = existing ? JSON.parse(existing) : [];

      // Add new template
      userTemplates.push(template);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userTemplates));

      return template;
    } catch (error) {
      console.error('Error saving template:', error);
      return null;
    }
  }

  // Get template by ID
  getTemplate(id: string | number): Template | null {
    const templates = this.getTemplates();
    console.log('All stored templates:', templates);
    console.log('Looking for ID:', id, 'Type:', typeof id);

    const found = templates.find(t => {
      const match = (typeof id === 'string' ? t.id === id : t.id.toString() === id.toString());
      console.log('Comparing:', t.id, 'with', id, 'Match:', match, 'Types:', typeof t.id, typeof id);
      return match;
    });

    console.log('Found template:', found);
    return found || null;
  }

  /** Session key must match editorShell's getStorageKey(projectId) so the design editor finds the template. */
  private getEditorStorageKey(projectId?: string): string {
    return projectId ? `craftjs_preview_json_${projectId}` : 'craftjs_preview_json';
  }

  /**
   * Load template into design editor.
   * @param templateId - Template id to load
   * @param projectId - When opening design for a specific project, pass this so the editor's per-project session key is used. Otherwise the editor won't find the content and the canvas opens empty.
   */
  async loadTemplate(templateId: string, projectId?: string): Promise<boolean> {
    console.log('Loading template:', templateId, projectId ? `for project ${projectId}` : '');

    if (typeof window === 'undefined') {
      console.log('Window is undefined');
      return false;
    }

    const template = this.getTemplate(templateId);
    console.log('Found template:', template);

    if (!template) {
      console.log('Template not found');
      return false;
    }

    try {
      const { deserializeCleanToCraft } = await import('@/app/design/_lib/serializer');
      const craftJson = deserializeCleanToCraft(template.data);

      const key = this.getEditorStorageKey(projectId);
      sessionStorage.setItem(key, craftJson);
      console.log('Stored in sessionStorage under key:', key);

      return true;
    } catch (error) {
      console.error('Error loading template:', error);
      return false;
    }
  }

  // Delete template (only user templates)
  deleteTemplate(id: string): boolean {
    if (typeof window === 'undefined') return false;

    const existing = localStorage.getItem(this.STORAGE_KEY);
    if (!existing) return false;

    try {
      const userTemplates = JSON.parse(existing);
      const filtered = userTemplates.filter((t: Template) => t.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  }
}

export const templateService = new TemplateService();
