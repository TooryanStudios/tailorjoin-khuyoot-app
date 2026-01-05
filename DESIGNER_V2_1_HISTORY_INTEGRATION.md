# Designer V2.1 - History Integration

## ✅ Implemented Features

### 1. Data Fetching Logic
- **History Loading**: Fetches 20 most recent generations from Firestore on component mount
- **User Filtering**: Only loads history for authenticated users (`userId` filter)
- **Auto-refresh**: History automatically refreshes after each new generation
- **Loading States**: Skeleton UI shown during initial load when no cached history exists

### 2. Interaction Handling
- **Thumbnail Selection**: Click any history thumbnail to load it into the main viewer
  - Sets `afterImage` to the result URL
  - Sets `beforeUpscaleImage` for potential upscaling
  - Resets slider position to 50% for side-by-side comparison
  - Marks item as active with visual indicator

- **Active Tracking**: `activeHistoryId` state tracks currently selected generation

- **Empty Slots**: 
  - Shows placeholder thumbnails with plus (+) icon for remaining slots (up to 20 total)
  - Clicking empty slot triggers template upload input
  - Maximum 20 history items displayed

### 3. UI/UX Refinements
- **Active Indicator**: 
  - Active thumbnail has purple border (`border-purple-500`)
  - Purple glow effect (`shadow-[0_0_20px_rgba(168,85,247,0.5)]`)
  
- **Delete Functionality**:
  - Hover over thumbnail reveals red X button in top-right corner
  - Confirmation dialog before deletion
  - Removes from local state immediately
  - TODO: Implement backend API endpoint for permanent deletion

- **Visual Polish**:
  - Smooth transitions on hover
  - Dashed border for empty slots
  - Group hover effects for delete button visibility

## ⚠️ Database Schema Enhancement Required

### Current Structure
The `generations` collection currently stores:
```typescript
{
  userId: string;
  jobId: string;
  fullImageUrl: string;      // AI-generated result
  thumbnailUrl: string;       // Thumbnail of result
  templateId?: string;        // ✅ Already stored - Reference to template library
  fabricId?: string;          // ✅ Already stored - Reference to fabric library
  settings: { 
    model: 'NanoBana' | 'Pro';
    upscaleEnabled: boolean;
  };
  createdAt: Date;
}
```

### 🔴 Missing Critical Fields (High Priority)

These fields are essential for proper history functionality and must be added:

```typescript
{
  // === Original Input Images ===
  templateUrl: string;              // URL of uploaded template/model image (for "Before" view)
  fabricUrl: string;                // URL of uploaded fabric/pattern image
  
  // === Generation Parameters ===
  refinementPrompt?: string;        // User's custom instructions
  outputFit: 'contain' | 'cover';   // How output was fitted
  preserveFace?: boolean;           // Face preservation setting
  preservePose?: boolean;           // Pose preservation setting
  
  // === Performance & Billing ===
  processingTimeMs: number;         // Generation time in milliseconds
  creditsUsed?: number;             // Cost in credits/tokens
  
  // === File Metadata ===
  originalTemplateFilename?: string; // User's original template file name
  originalFabricFilename?: string;   // User's original fabric file name
  imageDimensions: {                 // Final result dimensions
    width: number;
    height: number;
  };
}
```

### 💡 Recommended Additional Fields

These enhance usability, sharing, and maintainability:

```typescript
{
  // === Sharing & Collaboration ===
  isPublic: boolean;                 // Whether this can be shared publicly
  shareableSlug?: string;            // URL-friendly ID for public sharing (e.g., "abc123")
  shareableLink?: string;            // Full public URL: khuyoot.com/share/abc123
  sharedAt?: Date;                   // When it was made public
  viewCount?: number;                // Number of times viewed (if public)
  likeCount?: number;                // Number of likes/favorites from other users
  
  // === User Organization ===
  isFavorite: boolean;               // User's starred/favorite items
  tags?: string[];                   // User-added tags ["wedding", "formal", "summer"]
  notes?: string;                    // User's private notes about this design
  folderPath?: string;               // Organizational folder path
  
  // === Upscaling Chain ===
  wasUpscaled: boolean;              // If this was later upscaled
  upscaledJobId?: string;            // Link to the upscaled version
  parentJobId?: string;              // If this IS an upscale, link to original
  
  // === System & Debugging ===
  generationVersion: string;         // API/system version (e.g., "v2.1.0")
  userAgent?: string;                // Browser/device info
  errorLogs?: string[];              // Any warnings during processing
  
  // === Lifecycle Management ===
  expiresAt?: Date;                  // Auto-cleanup date for old/free-tier generations
  lastViewedAt?: Date;               // Last time user viewed this
  updatedAt?: Date;                  // Last modification time
}
```

### 📊 Complete Enhanced Schema

```typescript
export interface GenerationRecord {
  // === Core Identity ===
  userId: string;
  jobId: string;
  createdAt: Date;
  updatedAt?: Date;
  
  // === Image URLs ===
  templateUrl: string;               // Original uploaded template
  fabricUrl: string;                 // Original uploaded fabric
  fullImageUrl: string;              // AI-generated result (full size)
  thumbnailUrl: string;              // Thumbnail of result
  
  // === References ===
  templateId?: string;               // Reference to template in library
  fabricId?: string;                 // Reference to fabric in library
  
  // === Generation Settings ===
  settings: {
    model: 'NanoBana' | 'Pro';
    upscaleEnabled: boolean;
    strength?: number;
    refinementPrompt?: string;
    outputFit: 'contain' | 'cover';
    preserveFace?: boolean;
    preservePose?: boolean;
    shouldWatermark?: boolean;
  };
  
  // === File Metadata ===
  originalTemplateFilename?: string;
  originalFabricFilename?: string;
  imageDimensions: {
    width: number;
    height: number;
  };
  
  // === Performance & Billing ===
  processingTimeMs: number;
  creditsUsed?: number;
  
  // === Sharing & Social ===
  isPublic: boolean;
  shareableSlug?: string;
  shareableLink?: string;
  sharedAt?: Date;
  viewCount?: number;
  likeCount?: number;
  
  // === User Organization ===
  isFavorite: boolean;
  tags?: string[];
  notes?: string;
  folderPath?: string;
  
  // === Upscaling Chain ===
  wasUpscaled: boolean;
  upscaledJobId?: string;
  parentJobId?: string;
  
  // === System ===
  generationVersion: string;
  userAgent?: string;
  errorLogs?: string[];
  expiresAt?: Date;
  lastViewedAt?: Date;
}
```

### Required Migration Steps

#### 1. Update `GenerationRecord` Interface
**File**: `server/services/generationsService.ts`

```typescript
export interface GenerationRecord {
  // === Core Identity ===
  userId: string;
  jobId: string;
  createdAt: Date;
  updatedAt?: Date;
  
  // === Image URLs ===
  templateUrl: string;               // NEW: Original template image
  fabricUrl: string;                 // NEW: Original fabric image
  fullImageUrl: string;
  thumbnailUrl: string;
  
  // === References ===
  templateId?: string;               // Already exists
  fabricId?: string;                 // Already exists
  
  // === Generation Settings ===
  settings: {
    model: 'NanoBana' | 'Pro';
    upscaleEnabled: boolean;
    strength?: number;
    refinementPrompt?: string;       // NEW: Store user's prompt
    outputFit: 'contain' | 'cover';  // NEW: Store fit setting
    preserveFace?: boolean;          // NEW
    preservePose?: boolean;          // NEW
    shouldWatermark?: boolean;       // NEW
  };
  
  // === File Metadata ===
  originalTemplateFilename?: string; // NEW
  originalFabricFilename?: string;   // NEW
  imageDimensions: {                 // NEW
    width: number;
    height: number;
  };
  
  // === Performance & Billing ===
  processingTimeMs: number;          // NEW
  creditsUsed?: number;              // NEW
  
  // === Sharing (Phase 2) ===
  isPublic: boolean;                 // NEW: Enable public sharing
  shareableSlug?: string;            // NEW: URL-friendly share ID
  shareableLink?: string;            // NEW: Full public URL
  sharedAt?: Date;                   // NEW
  viewCount?: number;                // NEW: Track views
  likeCount?: number;                // NEW: Track likes
  
  // === User Organization (Phase 2) ===
  isFavorite: boolean;               // NEW
  tags?: string[];                   // NEW
  notes?: string;                    // NEW
  folderPath?: string;               // NEW
  
  // === Upscaling Chain (Phase 2) ===
  wasUpscaled: boolean;              // NEW
  upscaledJobId?: string;            // NEW
  parentJobId?: string;              // NEW
  
  // === System (Phase 2) ===
  generationVersion: string;         // NEW
  userAgent?: string;                // NEW
  errorLogs?: string[];              // NEW
  expiresAt?: Date;                  // NEW
  lastViewedAt?: Date;               // NEW
}
```

#### 2. Update `saveGeneration` Function
**File**: `server/services/generationsService.ts`

```typescript
export async function saveGeneration(opts: {
  imageBase64: string;
  userId: string;
  model: 'NanoBana' | 'Pro';
  templateBase64: string;            // NEW: Required to upload template
  templateMimeType: string;          // NEW
  fabricBase64: string;              // NEW: Required to upload fabric
  fabricMimeType: string;            // NEW
  refinementPrompt?: string;         // NEW
  outputFit: 'contain' | 'cover';    // NEW
  preserveFace?: boolean;            // NEW
  preservePose?: boolean;            // NEW
  shouldWatermark?: boolean;         // NEW
  templateId?: string;
  fabricId?: string;
  originalTemplateFilename?: string; // NEW
  originalFabricFilename?: string;   // NEW
  upscaleEnabled?: boolean;
  processingTimeMs?: number;         // NEW
  creditsUsed?: number;              // NEW
  userAgent?: string;                // NEW
}): Promise<{ 
  jobId: string; 
  fullImageUrl: string; 
  thumbnailUrl: string;
  templateUrl: string;               // NEW: Return template URL
  fabricUrl: string;                 // NEW: Return fabric URL
}> {
  const jobId = uuidv4();
  const startUpload = Date.now();

  // Generate thumbnail
  const [thumbnailBase64] = await Promise.all([
    generateThumbnail(opts.imageBase64),
  ]);

  // Upload all images to Firebase Storage in parallel
  const [fullImageUrl, thumbnailUrl, templateUrl, fabricUrl] = await Promise.all([
    uploadToFirebaseStorage(
      opts.imageBase64,
      opts.userId,
      jobId,
      `${jobId}_result.png`,
      'image/png'
    ),
    uploadToFirebaseStorage(
      `data:image/webp;base64,${thumbnailBase64}`,
      opts.userId,
      jobId,
      `${jobId}_thumb.webp`,
      'image/webp'
    ),
    uploadToFirebaseStorage(
      opts.templateBase64.startsWith('data:') 
        ? opts.templateBase64 
        : `data:${opts.templateMimeType};base64,${opts.templateBase64}`,
      opts.userId,
      jobId,
      `${jobId}_template.${opts.templateMimeType.split('/')[1] || 'png'}`,
      opts.templateMimeType
    ),
    uploadToFirebaseStorage(
      opts.fabricBase64.startsWith('data:')
        ? opts.fabricBase64
        : `data:${opts.fabricMimeType};base64,${opts.fabricBase64}`,
      opts.userId,
      jobId,
      `${jobId}_fabric.${opts.fabricMimeType.split('/')[1] || 'png'}`,
      opts.fabricMimeType
    ),
  ]);

  // Get result image dimensions
  const imageBuffer = Buffer.from(
    opts.imageBase64.replace(/^data:.*;base64,/, ''),
    'base64'
  );
  const metadata = await sharp(imageBuffer).metadata();

  // Create Firestore record with enhanced fields
  const record: GenerationRecord = {
    userId: opts.userId,
    jobId,
    createdAt: new Date(),
    templateUrl,                     // NEW
    fabricUrl,                       // NEW
    fullImageUrl,
    thumbnailUrl,
    templateId: opts.templateId,
    fabricId: opts.fabricId,
    settings: {
      model: opts.model,
      upscaleEnabled: opts.upscaleEnabled || false,
      refinementPrompt: opts.refinementPrompt,  // NEW
      outputFit: opts.outputFit,                // NEW
      preserveFace: opts.preserveFace,          // NEW
      preservePose: opts.preservePose,          // NEW
      shouldWatermark: opts.shouldWatermark,    // NEW
    },
    originalTemplateFilename: opts.originalTemplateFilename, // NEW
    originalFabricFilename: opts.originalFabricFilename,     // NEW
    imageDimensions: {                                       // NEW
      width: metadata.width || 0,
      height: metadata.height || 0,
    },
    processingTimeMs: opts.processingTimeMs || 0,            // NEW
    creditsUsed: opts.creditsUsed,                          // NEW
    isPublic: false,                                         // NEW: Default private
    isFavorite: false,                                       // NEW
    wasUpscaled: false,                                      // NEW
    generationVersion: 'v2.1.0',                            // NEW
    userAgent: opts.userAgent,                              // NEW
  };

  await saveGenerationRecord(record);

  return {
    jobId,
    fullImageUrl,
    thumbnailUrl,
    templateUrl,
    fabricUrl,
  };
}
```

#### 3. Update Fabric Swap Handler
**File**: `server/fabricSwap/fabricSwapHandler.ts`

```typescript
// In handleFabricSwap function, update the saveGeneration call:
const startTime = Date.now();

// ... existing processing code ...

const processingTimeMs = Date.now() - startTime;

const saved = await saveGeneration({
  imageBase64: finalBase64,
  userId: verified.uid,
  model: body.model,
  templateBase64: body.templateBase64,      // NEW: Pass template
  templateMimeType: body.templateMimeType,  // NEW
  fabricBase64: body.fabricBase64,          // NEW: Pass fabric
  fabricMimeType: body.fabricMimeType,      // NEW
  refinementPrompt: body.refinementPrompt,  // NEW
  outputFit: body.outputFit,                // NEW
  preserveFace: body.preserveFace,          // NEW
  preservePose: body.preservePose,          // NEW
  shouldWatermark: body.shouldWatermark,    // NEW
  templateId: body.templateId,
  fabricId: body.fabricId,
  upscaleEnabled: false,
  processingTimeMs,                         // NEW
  creditsUsed: calculateCredits(body),      // NEW: Implement credit calculation
  userAgent: req.headers['user-agent'],     // NEW
});
```

#### 4. Update Frontend History Display
**File**: `src/pages/DesignerV2_1/DesignerV2_1.tsx`

```typescript
const handleSelectHistory = React.useCallback((item: any) => {
  console.log('[Designer V2.1] Selecting history item:', item.jobId);
  
  // Set the AI-generated result as the "After" image
  setAfterImage(item.fullImageUrl);
  setBeforeUpscaleImage(item.fullImageUrl);
  
  // Use the stored template URL for comparison
  if (item.templateUrl) {
    setSourceForComparison(item.templateUrl);
    setSourcePreviewUrl(item.templateUrl);
  } else {
    // Fallback for old records without templateUrl
    console.warn('[Designer V2.1] No templateUrl found, using fallback');
    setSourceForComparison(item.fullImageUrl);
  }
  
  setSliderPos(50);
  setActiveHistoryId(item.jobId);
}, []);
```

#### 5. Add Sharing API Endpoints (Phase 2)

**File**: `api/designer-v2-1/share.ts` (NEW)

```typescript
// POST /api/designer-v2-1/share - Make a generation public
// GET /api/designer-v2-1/share/:slug - Get public generation details
// DELETE /api/designer-v2-1/share/:jobId - Make generation private again
```

**File**: `api/designer-v2-1/like.ts` (NEW)

```typescript
// POST /api/designer-v2-1/like/:jobId - Like a public generation
// DELETE /api/designer-v2-1/like/:jobId - Unlike
```

## 🔧 Current Workaround

Until the database schema is updated, the history functionality works with these limitations:
- ⚠️ Both "Before" and "After" show the AI-generated result (fullImageUrl)
- ⚠️ `templateUrl` and `fabricUrl` are not stored - only result URL
- ⚠️ `templateId` and `fabricId` are stored but URLs are missing
- ⚠️ Generation parameters (prompt, outputFit, etc.) not saved for history review
- ✅ Users can review generation history
- ✅ Delete functionality works (local state only)
- ✅ Active indicator works correctly

## 📋 Implementation Roadmap

### Phase 1: Core History (✅ COMPLETE)
- [x] History UI and interaction
- [x] Active thumbnail indicator
- [x] Delete button (local state)
- [x] Empty slot placeholders
- [x] Skeleton loading states

### Phase 2: Enhanced Storage (🔴 REQUIRED)
- [ ] Add `templateUrl` and `fabricUrl` fields
- [ ] Store generation parameters (`refinementPrompt`, `outputFit`, etc.)
- [ ] Upload template/fabric images to Firebase Storage
- [ ] Update backend services to handle new fields
- [ ] Implement permanent delete API endpoint
- [ ] Add file metadata storage

### Phase 3: Sharing & Collaboration (💡 RECOMMENDED)
- [ ] Public sharing system
  - [ ] Generate shareable slugs
  - [ ] Public generation view page (`/share/:slug`)
  - [ ] Share API endpoints
- [ ] Social features
  - [ ] Like/favorite public generations
  - [ ] View counter
  - [ ] Popular/trending generations
- [ ] Gallery/Discovery
  - [ ] Public gallery page
  - [ ] Filter by fabric type, model, tags
  - [ ] Search functionality

### Phase 4: Advanced Organization (💡 FUTURE)
- [ ] User organization features
  - [ ] Folders/collections
  - [ ] Tags management
  - [ ] Private notes
  - [ ] Favorites system
- [ ] Upscaling chain tracking
  - [ ] Link upscaled versions to originals
  - [ ] Version history
- [ ] Lifecycle management
  - [ ] Auto-cleanup for old generations
  - [ ] Storage quota management
  - [ ] Export/backup functionality

## 🎨 Visual Design

### Active Thumbnail
- Border: `border-2 border-purple-500`
- Glow: `shadow-[0_0_20px_rgba(168,85,247,0.5)]`
- Smooth transition on selection

### Delete Button
- Positioned top-right with `absolute top-1 right-1`
- Red background: `bg-red-600/90 hover:bg-red-600`
- Appears on group hover: `opacity-0 group-hover:opacity-100`
- Small X icon (3x3 size)

### Empty Slots
- Dashed border: `border-2 border-dashed border-zinc-700`
- Plus icon (8x8 size) in center
- Hover effect: `hover:border-purple-500/60`
- Semi-transparent background: `bg-zinc-900/50`

## 🐛 Known Issues & Considerations

### Current Limitations
1. **Template/Fabric URLs Missing**: Using `fullImageUrl` for both before/after due to schema limitation
2. **Delete Backend Missing**: Delete only removes from local state; needs API endpoint
3. **No Generation Parameters**: Can't review what settings were used for a generation
4. **Storage Costs**: Storing template + fabric + result triples storage needs - consider compression
5. **Privacy**: Need clear UX around public/private toggle before sharing
6. **Quota Management**: Need limits on how many generations to keep per user

### Design Decisions Needed
1. **Storage Strategy**:
   - Store full-res templates/fabrics or compressed versions?
   - Keep originals indefinitely or expire after 30/60/90 days?
   - Different retention for free vs. paid users?

2. **Sharing Features**:
   - Allow sharing without showing original template? (privacy concern)
   - Enable downloading of shared generations?
   - Copyright/watermarking for shared designs?
   - Moderation system for public gallery?

3. **Credit System**:
   - How many credits per generation?
   - Different costs for NanoBana vs. Pro?
   - Upscaling cost?
   - Free tier limits (X generations per day/month)?

4. **Data Retention**:
   - Auto-delete old generations after X days (free users)?
   - Export/backup functionality before deletion?
   - Soft delete vs. hard delete?

### Performance Considerations
- **Upload Time**: Uploading 3 images (template, fabric, result) instead of 1
  - Solution: Parallel uploads (already implemented)
  - Compression before upload
  
- **Download Time**: Loading history thumbnails
  - Solution: Already using WebP thumbnails (200x300)
  - Lazy loading with IntersectionObserver
  
- **Storage Quotas**: Firebase Storage costs
  - Solution: Image compression, cleanup policies, user quotas
  
- **Firestore Reads**: Fetching 20 history items on each page load
  - Solution: Client-side caching, pagination, incremental loading

## 📊 Testing Checklist

### Phase 1 - Core History (Current)
- [ ] History loads on page load for authenticated users
- [ ] History doesn't load for anonymous users  
- [ ] Clicking thumbnail loads it into main viewer
- [ ] Active thumbnail shows purple border and glow
- [ ] Slider resets to 50% on selection
- [ ] Delete button appears on hover
- [ ] Delete confirmation dialog works
- [ ] Deleted item removed from UI
- [ ] Empty slots show up to 20 total items
- [ ] Empty slot click triggers upload
- [ ] New generation refreshes history
- [ ] New generation becomes active automatically
- [ ] Skeleton UI appears during loading
- [ ] Error handling for failed history load

### Phase 2 - Enhanced Storage (Pending)
- [ ] Template image uploads correctly
- [ ] Fabric image uploads correctly
- [ ] Template URL stored in Firestore
- [ ] Fabric URL stored in Firestore
- [ ] Generation parameters saved correctly
- [ ] File metadata captured
- [ ] Processing time tracked accurately
- [ ] Image dimensions stored correctly
- [ ] Before/After comparison shows correct images
- [ ] Old generations still work (backward compatibility)
- [ ] Delete API endpoint removes from Firestore
- [ ] Delete API endpoint removes from Storage
- [ ] Orphaned files cleaned up on delete

### Phase 3 - Sharing (Future)
- [ ] Public toggle works correctly
- [ ] Shareable link generated
- [ ] Public page loads generation
- [ ] Public page shows template + result
- [ ] View counter increments
- [ ] Like functionality works
- [ ] Unlike works correctly
- [ ] Private generations not accessible via share link
- [ ] Public gallery displays correctly
- [ ] Search/filter works
- [ ] Pagination works for large result sets

### Phase 4 - Organization (Future)
- [ ] Folders creation/deletion
- [ ] Tag addition/removal
- [ ] Tag search/filter
- [ ] Favorites toggle
- [ ] Notes saved correctly
- [ ] Upscale links to parent
- [ ] Parent shows upscaled version link
- [ ] Auto-cleanup respects expiry dates
- [ ] Export functionality works
- [ ] Storage quota enforcement

---

**Last Updated**: January 1, 2026  
**Status**: Phase 1 Complete (UI/UX) → Phase 2 Required (Database Schema + Storage) → Phase 3 Recommended (Sharing) → Phase 4 Future (Advanced Features)

**Priority**: 🔴 **CRITICAL** - Phase 2 must be implemented before production deployment to enable proper before/after comparison and preserve user's original inputs.
