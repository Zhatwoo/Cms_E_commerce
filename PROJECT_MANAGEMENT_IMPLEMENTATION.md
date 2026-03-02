# Project Management System - Implementation Summary

## Overview
A comprehensive project management system has been implemented with soft delete, trash functionality, domain validation, and a 30-day retention policy.

## Features Implemented

### 1. **Soft Delete with Trash System**
- Projects are no longer permanently deleted immediately
- Deleted projects are moved to a "trash" section
- 30-day retention period before automatic permanent deletion
- Users can recover projects from trash within 30 days

### 2. **Domain Validation on Delete**
- **Blocked deletion**: If a project has an active/published domain, deletion is prevented
- Error message: "Cannot delete project with active published domain. Please unpublish or deactivate the domain first."
- Users must first unpublish the domain before deleting the project

### 3. **Double Confirmation for Safe Deletion**
- Projects without published domains require double confirmation
- First confirmation: "Move [project] to trash? You can recover it within 30 days."
- Second confirmation: "Are you sure? This project will be moved to trash and permanently deleted after 30 days."

### 4. **Trash Management**
- Dedicated trash section in the web builder dashboard
- Shows number of items in trash
- Lists deleted projects with days remaining before permanent deletion
- Two actions per item: Recover or Permanently Delete

### 5. **Automatic Cleanup Script**
- Runs daily or on-demand to clean up projects older than 30 days
- Permanently deletes projects that have exceeded the retention period
- Also removes associated storage files

## Backend Changes

### Models (`backend/models/Project.js`)
- **New Fields**:
  - `is_deleted` (boolean): Flag indicating if project is in trash
  - `deleted_at` (timestamp): When the project was moved to trash

- **New Functions**:
  - `softDelete(userId, projectId)`: Move project to trash
  - `recover(userId, projectId)`: Restore project from trash
  - `permanentDelete(userId, projectId)`: Permanently delete project
  - `listTrash(userId)`: Get all trashed projects for a user

- **Modified Functions**:
  - `list()`: Now excludes deleted projects (is_deleted == false)
  - `create()`: Initializes is_deleted and deleted_at fields

### Controllers (`backend/controllers/projectController.js`)
- **Updated delete endpoint** (`DELETE /api/projects/:id`):
  - Checks if project has active public domain
  - Returns error if domain is published
  - Performs soft delete instead of permanent delete
  - Returns message: "Website moved to trash. It will be permanently deleted after 30 days."

- **New endpoints**:
  - `GET /api/projects/trash/list`: List all trashed projects
  - `POST /api/projects/:id/recover`: Recover project from trash
  - `DELETE /api/projects/:id/permanent`: Permanently delete project

### Routes (`backend/routes/projectRoutes.js`)
Added routes for:
- `GET /api/projects/trash/list` → `listTrash`
- `POST /api/projects/:id/recover` → `recover`
- `DELETE /api/projects/:id/permanent` → `permanentDelete`

### Cleanup Script (`backend/scripts/cleanupTrashProjects.js`)
Automated script that:
- Queries all deleted projects older than 30 days
- Permanently deletes projects and their storage
- Provides dry-run mode for testing: `DRY_RUN=true node scripts/cleanupTrashProjects.js`
- Logs all operations for audit trail

## Frontend Changes

### API Updates (`frontend/src/lib/api.ts`)
- **Updated Project type**: Added `isDeleted` and `deletedAt` fields
- **Updated deleteProject()**: Now returns message and error code
- **New functions**:
  - `listTrashProjects()`: Get user's trash projects
  - `recoverProject(id)`: Recover project from trash
  - `permanentDeleteProject(id)`: Permanently delete project

### Web Builder UI (`frontend/src/app/m_dashboard/web-builder/page.tsx`)
- **New state**:
  - `trashProjects`: List of deleted projects
  - `showTrash`: Toggle trash section visibility
  - `trashLoading`: Loading state for trash

- **Updated handlers**:
  - `handleProjectDelete()`: Now performs double confirmation and soft delete
  - Catches domain-related errors and displays appropriate message
  - Reloads trash after successful deletion

- **New handlers**:
  - `handleRecoverProject()`: Recover project with confirmation
  - `handlePermanentDelete()`: Permanently delete with double confirmation
  - `loadTrash()`: Load trash projects from API
  - `calculateDaysInTrash()`: Calculate days since deletion
  - `calculateDaysRemaining()`: Calculate days until permanent deletion

- **New UI Section - Trash**:
  - Collapsible trash section below active projects
  - Shows number of items in trash
  - Displays each project with:
    - Project title
    - Days remaining counter (red warning if expiring today)
    - Recover button (green)
    - Permanent Delete button (red)
  - Auto-expands when projects are deleted
  - Empty state when no items in trash

## API Response Examples

### Delete Project (Success)
```json
{
  "success": true,
  "message": "Website moved to trash. It will be permanently deleted after 30 days."
}
```

### Delete Project (Domain Error)
```json
{
  "success": false,
  "message": "Cannot delete project with active published domain. Please unpublish or deactivate the domain first.",
  "error": "ACTIVE_DOMAIN_EXISTS",
  "domain": { /* domain object */ }
}
```

### List Trash
```json
{
  "success": true,
  "projects": [
    {
      "id": "abc123",
      "title": "My Old Site",
      "status": "draft",
      "isDeleted": true,
      "deletedAt": "2026-02-27T10:00:00Z",
      ...
    }
  ]
}
```

## Database Schema Updates

### Firestore: user/roles/client/{userId}/projects/{projectId}
```
{
  title: string,
  status: string,
  template_id: string | null,
  subdomain: string | null,
  thumbnail: string | null,
  created_at: timestamp,
  updated_at: timestamp,
  is_deleted: boolean,          // NEW
  deleted_at: timestamp | null  // NEW
}
```

## Setup Instructions

### 1. Deploy Backend Changes
```bash
# Update Project model
# Update projectController
# Update projectRoutes
# Ensure Domain model is accessible in projectController

# No database migration needed - fields are added on-the-fly in Firestore
```

### 2. Deploy Frontend Changes
```bash
# Update api.ts with new functions
# Update web-builder/page.tsx with UI and handlers
```

### 3. Setup Automatic Cleanup (Recommended)
```bash
# Option A: Google Cloud Scheduler (Cloud Functions)
# Trigger the cleanup script daily

# Option B: Manual cleanup
node backend/scripts/cleanupTrashProjects.js

# Option C: Dry-run to test
DRY_RUN=true node backend/scripts/cleanupTrashProjects.js
```

## Testing Checklist

- [ ] Create a project
- [ ] Publish project to domain
- [ ] Try to delete project → Should show error "Cannot delete with active domain"
- [ ] Unpublish domain
- [ ] Delete project → Should show double confirmation
- [ ] Confirm deletion → Project moved to trash
- [ ] Check trash section → Project appears with days remaining
- [ ] Click Recover → Project returns to active projects
- [ ] Wait 30 seconds, delete again → Confirm both times
- [ ] Let 30 days pass (or manually update deleted_at in Firestore for testing)
- [ ] Run cleanup script → Project permanently deleted
- [ ] Verify storage folder also deleted

## Configuration

### 30-Day Retention Period
Located in `backend/scripts/cleanupTrashProjects.js`:
```javascript
const TRASH_RETENTION_DAYS = 30;
```

Change this value to adjust retention period.

### Cleanup Schedule
Set up a recurring job (daily recommended) to execute:
```bash
node backend/scripts/cleanupTrashProjects.js
```

## Rollback Plan

If issues arise:
1. Restore from backup
2. Stop running cleanup script
3. Update frontend to hide trash section temporarily
4. Manually recover deleted projects if needed:
   - Run: `await Project.recover(userId, projectId)` for each project

## Future Enhancements

- [ ] Bulk actions (select multiple projects to delete/recover)
- [ ] Scheduled deletion (let user set custom deletion dates)
- [ ] Audit log showing who deleted what when
- [ ] Notification before permanent deletion (email at day 28)
- [ ] Admin panel to view all trash across users
- [ ] Archive feature (separate from trash, no auto-delete)

## Support

For issues or questions about this implementation:
1. Check the test checklist above
2. Review error messages in console
3. Check cleanup script logs for permanent deletion issues
4. Verify Firestore permissions allow updates to projects collection
