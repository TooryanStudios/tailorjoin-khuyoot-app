# URL-Based Task Management System

## Overview
The Designer V2.1 now supports URL-based task management with shareable links, task persistence, and automatic state synchronization.

## Architecture

### Task Schema
```typescript
{
  taskId: "task-1735718400000-abc123xyz",
  metadata: {
    model: "data:image/jpeg;base64,/9j/4AAQ...",
    modelMimeType: "image/jpeg",
    fabric: "data:image/png;base64,iVBORw0KGgo...",
    fabricMimeType: "image/png",
    sliderPos: 50,
    createdAt: "2026-01-01T12:00:00.000Z",
    selectedModel: "NanoBana",
    refinementPrompt: "natural fabric flow",
    outputFit: "contain"
  },
  results: {
    thumbnail: "https://storage.googleapis.com/.../thumb.webp",
    highRes: "https://storage.googleapis.com/.../result.png",
    jobId: "5aa18581-8918-42dd-a49c-a454a48cf70b",
    templateUrl: "https://storage.googleapis.com/.../template.webp",
    fabricUrl: "https://storage.googleapis.com/.../fabric.jpeg"
  }
}
```

## Features Implemented

### 1. Dynamic Routing
- **Base URL**: `/designer-v2-1`
- **Task URL**: `/designer-v2-1/design/:taskId`
- Each design task has a unique shareable URL

### 2. Task State Management
- **Storage**: LocalStorage with user-scoped namespacing
- **Key**: `khuyoot:designerV2_1:tasks:{userId}`
- **Adapter**: `TaskStorageAdapter` interface for future API integration

### 3. URL Synchronization
- URL parameter changes automatically load the corresponding task
- All UI state (images, slider, settings) updates to match task data
- Skips cache hydration when loading from URL

### 4. Share Functionality
- **Share Button**: Top-right floating toolbar
- **Visual Feedback**: Check icon with green highlight when copied
- **Clipboard**: Copies full task URL to clipboard
- **Disabled State**: Button disabled until first generation completes

### 5. History Integration
- Clicking history thumbnail navigates to associated task URL
- Task lookup by jobId for seamless navigation
- Fallback to direct state loading if no task found

### 6. Task Lifecycle

#### Generation Flow
```
1. User uploads model + fabric
2. User clicks "Generate & Enhance"
3. API processes and returns result
4. New task created with unique ID
5. Task saved to localStorage
6. URL updates to /designer-v2-1/design/{taskId}
7. History strip refreshes
```

#### Loading Flow
```
1. User visits /designer-v2-1/design/{taskId}
2. URL parameter detected
3. Task loaded from localStorage
4. UI state hydrated from task data
5. Images, slider, settings all restored
```

#### Sharing Flow
```
1. User clicks Share button
2. URL copied to clipboard
3. Check icon shows for 2 seconds
4. Recipient visits URL
5. Complete design state loads automatically
```

## API Structure

### TaskStorageAdapter Methods
```typescript
interface TaskStorageAdapter {
  getTask(taskId: string): Promise<DesignTask | null>;
  saveTask(task: DesignTask): Promise<void>;
  listTasks(userId?: string): Promise<DesignTask[]>;
  deleteTask(taskId: string): Promise<void>;
}
```

### Utility Functions
```typescript
// Generate unique task ID
generateTaskId(): string

// Build shareable URL
getTaskUrl(taskId: string): string

// Copy URL to clipboard
copyTaskUrlToClipboard(taskId: string): Promise<boolean>
```

## LocalStorage Structure

### Per-User Tasks
```
Key: khuyoot:designerV2_1:tasks:{userId}
Value: {
  "task-123": { /* DesignTask */ },
  "task-456": { /* DesignTask */ },
  ...
}
```

### Sorting
Tasks sorted by `createdAt` descending (newest first)

## User Flows

### Scenario 1: Create and Share
1. User creates new design
2. Task auto-saved with unique ID
3. URL auto-updates to task-specific path
4. User clicks Share button
5. URL copied to clipboard
6. User shares link with colleague
7. Colleague opens link and sees exact same design state

### Scenario 2: Browse History
1. User sees thumbnail in history strip
2. User clicks thumbnail
3. App navigates to `/designer-v2-1/design/{taskId}`
4. URL updates in browser
5. All state loads from task data
6. User can now share this URL

### Scenario 3: Direct Link Access
1. User receives shared URL
2. User opens link in browser
3. App detects taskId in URL
4. Task loaded from localStorage
5. Complete design state restored
6. User sees exact state creator intended

## Future Enhancements

### Backend Integration
- Replace LocalStorage adapter with API calls
- Store tasks in Firestore `designTasks` collection
- Enable cross-device task access
- Add task permissions (owner, viewer, editor)

### Advanced Features
- Task versioning (save iterations)
- Collaborative editing
- Public gallery of shared tasks
- Task templates and presets

## Files Modified

### New Files
- `src/pages/DesignerV2_1/types/task.ts` - Task schema and adapter interface
- `src/pages/DesignerV2_1/services/taskStorage.ts` - LocalStorage implementation

### Modified Files
- `src/pages/DesignerV2_1/DesignerV2_1.tsx` - Task loading, saving, sharing
- `App.tsx` - Added dynamic route for tasks

## Testing

### Manual Test Cases
1. **Generate → Share → Open**
   - Generate new design
   - Copy share URL
   - Open in incognito/new tab
   - Verify state matches

2. **History → Navigate**
   - Click history thumbnail
   - Verify URL updates
   - Verify state loads correctly

3. **Direct URL Access**
   - Copy task URL
   - Close tab
   - Paste URL in new tab
   - Verify design loads

4. **Delete Task**
   - Delete from history strip
   - Verify task removed from localStorage
   - Verify URL still works (shows empty state)

## Notes
- Tasks stored per-user using Firebase auth UID
- Anonymous users get "anon" namespace
- No server calls yet (fully client-side)
- Ready for backend migration when needed
