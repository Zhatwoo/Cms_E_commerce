# Template Loading Test

## How to Test the Template System

### 1. Create a Template
1. Go to `http://localhost:3001/design`
2. Create a simple design (add some text, containers, etc.)
3. Click the play button → "JSON Output"
4. Click "Save Template" button
5. Fill in:
   - Name: "Test Template"
   - Category: "Landing Page" 
   - Description: "A test template for verification"
6. Click "Save Template"

### 2. Use the Template
1. Go to `http://localhost:3001/m_dashboard/templates`
2. Find your "Test Template" in the gallery
3. Click "Use Template" button
4. Should automatically navigate to `/design` with your template loaded

### 3. Verify Loading
- The design editor should show your saved design
- All components, text, and styling should be preserved
- You can continue editing from where you left off

## Expected Behavior

✅ **Save Flow:**
- Design → Preview → Save Template → Templates Gallery
- Template appears in both gallery and carousel

✅ **Load Flow:**
- Templates Gallery → Use Template → Design Editor
- Template data loaded via sessionStorage
- Craft.js editor deserializes and displays the design

## Troubleshooting

If "Use Template" doesn't work:
1. Check browser console for errors
2. Verify sessionStorage has `craftjs_preview_json`
3. Check templateService.loadTemplate() function
4. Ensure deserializer is working correctly

The system uses:
- **sessionStorage** for temporary design data
- **localStorage** for persistent template storage  
- **serializer.ts** for format conversion
- **templateService.ts** for CRUD operations
