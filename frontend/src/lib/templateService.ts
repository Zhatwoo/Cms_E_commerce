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

  // Save template from design editor
  saveTemplate(name: string, category: string, description: string): Template | null {
    if (typeof window === 'undefined') return null;

    // Get current design from sessionStorage
    const rawJson = sessionStorage.getItem('craftjs_preview_json');
    if (!rawJson) return null;

    try {
      // Import the serializer function
      const { serializeCraftToClean } = require('@/app/design/_lib/serializer');
      const cleanData = serializeCraftToClean(rawJson);

      const template: Template = {
        id: `template-${Date.now()}`,
        name,
        title: name,
        category,
        description,
        desc: description,
        thumbnail: '🎨',
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

  // Load template into design editor
  async loadTemplate(templateId: string): Promise<boolean> {
    console.log('Loading template:', templateId);

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
      // Dynamic import for browser compatibility
      const { deserializeCleanToCraft } = await import('@/app/design/_lib/serializer');
      console.log('Serializer imported:', deserializeCleanToCraft);

      const craftJson = deserializeCleanToCraft(template.data);
      console.log('Craft JSON generated:', craftJson);

      // Store in sessionStorage for the editor to pick up
      sessionStorage.setItem('craftjs_preview_json', craftJson);
      console.log('Stored in sessionStorage');

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
