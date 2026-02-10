# Template System Guide

This guide explains how the web builder template system works and how to fetch/display JSON template data.

## Overview

The template system consists of three main parts:

1. **Web Builder** (`/design`) - Creates templates using Craft.js
2. **Template Service** (`/lib/templateService.ts`) - Manages template storage
3. **Web Builder Hub** (`/m_dashboard/web-builder`) - Displays saved templates and provides options to start from scratch or use templates

## How It Works

### 1. Creating Templates

1. Go to `/design` to open the web builder
2. Create your design using the visual editor
3. Click the play button to generate JSON output
4. In the preview page (`/design/preview`), click "Save Template"
5. Fill in the template details (name, category, description)
6. The template is saved to localStorage

### 2. Template Data Flow

```
Web Builder (Craft.js) 
    ↓ (sessionStorage)
Raw JSON 
    ↓ (serializer.ts)
Clean JSON 
    ↓ (templateService)
Template Storage (localStorage)
    ↓
Template Gallery Display
```

### 3. Fetching Template Data

The template service provides these methods:

```typescript
import { templateService } from '@/lib/templateService';

// Get all templates (built-in + user-created)
const templates = templateService.getTemplates();

// Save current design as template
const template = templateService.saveTemplate(
  "My Template",
  "Landing Page", 
  "A beautiful landing page template"
);

// Get specific template by ID
const template = templateService.getTemplate('template-id');

// Delete user template
templateService.deleteTemplate('template-id');
```

### 4. Template Data Structure

Each template contains:

```typescript
interface Template {
  id: string;                    // Unique identifier
  name: string;                  // Template name
  title: string;                 // Display title (same as name)
  category: string;              // Category for filtering
  description: string;            // Full description
  desc: string;                  // Short description (same as description)
  thumbnail: string;              // Emoji or image URL
  imageColor?: string;           // Gradient for UI
  status?: 'New' | 'Popular' | 'Coming Soon'; // Status badge
  data: BuilderDocument;         // Clean JSON structure
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last modified
  isBuiltIn: boolean;            // True for system templates
  username?: string;             // Creator username (user templates)
  domainName?: string;           // Associated domain (user templates)
}
```

### 5. JSON Structure

The clean JSON structure stored in templates:

```typescript
interface BuilderDocument {
  version: number;               // Schema version
  pages: PageNode[];           // Array of pages
  nodes: Record<string, CleanNode>; // All component nodes
}

interface PageNode {
  id: string;
  props: Record<string, any>;   // Page-specific props
  children: string[];          // Child node IDs
}

interface CleanNode {
  type: ComponentType;          // Component type (Text, Container, etc.)
  props: Record<string, any>;   // Component properties
  children: string[];          // Child node IDs
}
```

## File Locations

- **Web Builder**: `/frontend/src/app/design/`
- **Template Service**: `/frontend/src/lib/templateService.ts`
- **Web Builder Hub**: `/frontend/src/app/m_dashboard/web-builder/`
- **Serializer**: `/frontend/src/app/design/_lib/serializer.ts`

## Usage Examples

### Displaying Templates in a Component

```typescript
import { templateService, Template } from '@/lib/templateService';

function MyTemplateGallery() {
  const [templates, setTemplates] = useState<Template[]>([]);
  
  useEffect(() => {
    const loadedTemplates = templateService.getTemplates();
    setTemplates(loadedTemplates);
  }, []);
  
  return (
    <div>
      {templates.map(template => (
        <div key={template.id}>
          <h3>{template.title}</h3>
          <p>{template.desc}</p>
          <span>{template.category}</span>
        </div>
      ))}
    </div>
  );
}
```

### Loading a Template in the Editor

```typescript
// To load a template back into the editor:
const template = templateService.getTemplate('template-id');
if (template) {
  // Use the deserializer to convert back to Craft.js format
  const { deserializeCleanToCraft } = await import('@/app/design/_lib/serializer');
  const craftJson = deserializeCleanToCraft(template.data);
  
  // Load into Craft.js editor
  // (implementation depends on your editor setup)
}
```

## Storage

- **Built-in templates**: Hardcoded in `templateService.ts`
- **User templates**: Stored in browser's `localStorage`
- **Current design**: Stored in `sessionStorage` as `craftjs_preview_json`

## Categories

Supported template categories:
- Landing Page
- E-commerce
- Blog
- Portfolio
- Business
- Dashboard

## Next Steps

To extend the system:

1. **Backend Storage**: Replace localStorage with a database API
2. **Template Sharing**: Add import/export functionality
3. **Preview Images**: Generate actual preview images instead of gradients
4. **Template Versioning**: Add version control for templates
5. **Collaboration**: Allow multiple users to share templates
