import { getFirebaseAdminApp } from '../tryon/firebaseAdmin.js';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export interface GenerationRecord {
  // === Core Identity ===
  userId: string;
  jobId: string;
  createdAt: Date;
  updatedAt?: Date;
  
  // === Image URLs ===
  templateUrl?: string;              // Original uploaded template image
  fabricUrl?: string;                // Original uploaded fabric image
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
    outputFit?: 'contain' | 'cover';
    preserveFace?: boolean;
    preservePose?: boolean;
    shouldWatermark?: boolean;
  };
  
  // === File Metadata ===
  originalTemplateFilename?: string;
  originalFabricFilename?: string;
  imageDimensions?: {
    width: number;
    height: number;
  };
  
  // === Performance & Billing ===
  processingTimeMs?: number;
  creditsUsed?: number;
  
  // === Sharing & Social ===
  isPublic?: boolean;
  shareableSlug?: string;
  shareableLink?: string;
  sharedAt?: Date;
  viewCount?: number;
  likeCount?: number;
  
  // === User Organization ===
  isFavorite?: boolean;
  tags?: string[];
  notes?: string;
  folderPath?: string;
  
  // === Upscaling Chain ===
  wasUpscaled?: boolean;
  upscaledJobId?: string;
  parentJobId?: string;
  
  // === System ===
  generationVersion?: string;
  userAgent?: string;
  errorLogs?: string[];
  expiresAt?: Date;
  lastViewedAt?: Date;
}

/**
 * Generate a thumbnail from the final image
 * Returns base64-encoded WebP thumbnail (200x300)
 */
export async function generateThumbnail(imageBase64: string): Promise<string> {
  try {
    const buffer = Buffer.from(imageBase64.replace(/^data:.*;base64,/, ''), 'base64');
    const thumbnail = await sharp(buffer, { failOnError: false })
      .resize(200, 300, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 })
      .toBuffer();
    
    return thumbnail.toString('base64');
  } catch (error) {
    console.error('[GenerationsService] Thumbnail generation failed:', error);
    throw new Error('Failed to generate thumbnail');
  }
}

/**
 * Upload image to Firebase Storage and return the public URL
 */
export async function uploadToFirebaseStorage(
  imageBase64: string,
  userId: string,
  jobId: string,
  fileName: string,
  contentType: string = 'image/png'
): Promise<string> {
  try {
    const app = getFirebaseAdminApp();
    const bucket = app.storage().bucket();
    
    const buffer = Buffer.from(imageBase64.replace(/^data:.*;base64,/, ''), 'base64');
    const filePath = `generations/${userId}/${fileName}`;
    
    const file = bucket.file(filePath);
    
    await file.save(buffer, {
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000', // 1 year cache for immutable content
      },
    });

    // Make file public if not already
    await file.makePublic();
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    console.log(`[GenerationsService] Uploaded: ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error('[GenerationsService] Upload to Firebase Storage failed:', error);
    throw new Error('Failed to upload image to storage');
  }
}

/**
 * Create a generation record in Firestore
 */
export async function saveGenerationRecord(record: GenerationRecord): Promise<void> {
  try {
    const app = getFirebaseAdminApp();
    const firestore = app.firestore();
    
    const generationsRef = firestore.collection('generations').doc(record.jobId);
    
    // Firestore rejects `undefined` values anywhere in the document.
    // Normalize optional fields (especially nested `settings`) to null.
    const settings = {
      model: record.settings.model,
      upscaleEnabled: record.settings.upscaleEnabled,
      strength: record.settings.strength ?? null,
      refinementPrompt: record.settings.refinementPrompt ?? null,
      outputFit: record.settings.outputFit ?? null,
      preserveFace: record.settings.preserveFace ?? null,
      preservePose: record.settings.preservePose ?? null,
      shouldWatermark: record.settings.shouldWatermark ?? null,
    };

    // Prepare data object, excluding undefined fields
    const data: any = {
      userId: record.userId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt || null,
      
      // Image URLs
      templateUrl: record.templateUrl || null,
      fabricUrl: record.fabricUrl || null,
      fullImageUrl: record.fullImageUrl,
      thumbnailUrl: record.thumbnailUrl,
      
      // References
      templateId: record.templateId || null,
      fabricId: record.fabricId || null,
      
      // Settings
      settings,
      
      // File Metadata
      originalTemplateFilename: record.originalTemplateFilename || null,
      originalFabricFilename: record.originalFabricFilename || null,
      imageDimensions: record.imageDimensions || null,
      
      // Performance & Billing
      processingTimeMs: record.processingTimeMs || null,
      creditsUsed: record.creditsUsed || null,
      
      // Sharing
      isPublic: record.isPublic || false,
      shareableSlug: record.shareableSlug || null,
      shareableLink: record.shareableLink || null,
      sharedAt: record.sharedAt || null,
      viewCount: record.viewCount || 0,
      likeCount: record.likeCount || 0,
      
      // User Organization
      isFavorite: record.isFavorite || false,
      tags: record.tags || [],
      notes: record.notes || null,
      folderPath: record.folderPath || null,
      
      // Upscaling Chain
      wasUpscaled: record.wasUpscaled || false,
      upscaledJobId: record.upscaledJobId || null,
      parentJobId: record.parentJobId || null,
      
      // System
      generationVersion: record.generationVersion || null,
      userAgent: record.userAgent || null,
      errorLogs: record.errorLogs || [],
      expiresAt: record.expiresAt || null,
      lastViewedAt: record.lastViewedAt || null,
    };

    await generationsRef.set(data);

    console.log(`[GenerationsService] Saved generation record: ${record.jobId}`);
  } catch (error) {
    console.error('[GenerationsService] Failed to save generation record:', error);
    throw new Error('Failed to save generation record to Firestore');
  }
}

/**
 * Save generation images and create Firestore record
 * Called from fabricSwapHandler after processing
 */
export async function saveGeneration(opts: {
  imageBase64: string;
  userId: string;
  model: 'NanoBana' | 'Pro';
  
  // Template and Fabric Images
  templateBase64?: string;
  templateMimeType?: string;
  fabricBase64?: string;
  fabricMimeType?: string;
  
  // References
  templateId?: string;
  fabricId?: string;
  
  // Settings
  upscaleEnabled?: boolean;
  refinementPrompt?: string;
  outputFit?: 'contain' | 'cover';
  preserveFace?: boolean;
  preservePose?: boolean;
  shouldWatermark?: boolean;
  strength?: number;
  
  // Metadata
  originalTemplateFilename?: string;
  originalFabricFilename?: string;
  processingTimeMs?: number;
  creditsUsed?: number;
  userAgent?: string;
  generationVersion?: string;
}): Promise<{ 
  jobId: string; 
  fullImageUrl: string; 
  thumbnailUrl: string;
  templateUrl?: string;
  fabricUrl?: string;
}> {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[DEBUG] [GenerationsService] saveGeneration() called');
    console.log('[DEBUG] [GenerationsService] userId:', opts.userId);
    console.log('[DEBUG] [GenerationsService] model:', opts.model);
    console.log('[DEBUG] [GenerationsService] Has imageBase64:', !!opts.imageBase64, '(', opts.imageBase64?.length, 'chars)');
    console.log('[DEBUG] [GenerationsService] Has templateBase64:', !!opts.templateBase64);
    console.log('[DEBUG] [GenerationsService] Has fabricBase64:', !!opts.fabricBase64);
    
    // Generate unique jobId
    const jobId = uuidv4();

    console.log(`[DEBUG] [GenerationsService] Generated jobId: ${jobId}`);

    // Generate thumbnail in parallel with full image upload
    const [thumbnailBase64] = await Promise.all([
      generateThumbnail(opts.imageBase64),
    ]);

    console.log(`[GenerationsService] Thumbnail generated, uploading to storage...`);

    // Upload result and thumbnail, plus optional template and fabric images
    const uploadPromises: Promise<string>[] = [
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
    ];

    // Upload template if provided (non-blocking for speed)
    if (opts.templateBase64 && opts.templateMimeType) {
      const templateData = opts.templateBase64.startsWith('data:')
        ? opts.templateBase64
        : `data:${opts.templateMimeType};base64,${opts.templateBase64}`;
      const templateExt = opts.templateMimeType.split('/')[1] || 'png';
      uploadPromises.push(
        uploadToFirebaseStorage(
          templateData,
          opts.userId,
          jobId,
          `${jobId}_template.${templateExt}`,
          opts.templateMimeType
        )
      );
    }

    // Upload fabric if provided
    if (opts.fabricBase64 && opts.fabricMimeType) {
      const fabricData = opts.fabricBase64.startsWith('data:')
        ? opts.fabricBase64
        : `data:${opts.fabricMimeType};base64,${opts.fabricBase64}`;
      const fabricExt = opts.fabricMimeType.split('/')[1] || 'png';
      uploadPromises.push(
        uploadToFirebaseStorage(
          fabricData,
          opts.userId,
          jobId,
          `${jobId}_fabric.${fabricExt}`,
          opts.fabricMimeType
        )
      );
    }

    const uploadResults = await Promise.all(uploadPromises);
    const fullImageUrl = uploadResults[0];
    const thumbnailUrl = uploadResults[1];
    const templateUrl = uploadResults[2]; // Will be undefined if not uploaded
    const fabricUrl = uploadResults[3];   // Will be undefined if not uploaded

    console.log(`[GenerationsService] Images uploaded, extracting metadata...`);

    // Get result image dimensions
    const imageBuffer = Buffer.from(
      opts.imageBase64.replace(/^data:.*;base64,/, ''),
      'base64'
    );
    const metadata = await sharp(imageBuffer).metadata();

    console.log(`[GenerationsService] Images uploaded, saving to Firestore...`);

    // Create Firestore record with all metadata
    const record: GenerationRecord = {
      userId: opts.userId,
      jobId,
      createdAt: new Date(),
      
      // Image URLs
      templateUrl,
      fabricUrl,
      fullImageUrl,
      thumbnailUrl,
      
      // References
      templateId: opts.templateId,
      fabricId: opts.fabricId,
      
      // Settings
      settings: {
        model: opts.model,
        upscaleEnabled: opts.upscaleEnabled || false,
        strength: opts.strength,
        refinementPrompt: opts.refinementPrompt,
        outputFit: opts.outputFit,
        preserveFace: opts.preserveFace,
        preservePose: opts.preservePose,
        shouldWatermark: opts.shouldWatermark,
      },
      
      // File Metadata
      originalTemplateFilename: opts.originalTemplateFilename,
      originalFabricFilename: opts.originalFabricFilename,
      imageDimensions: {
        width: metadata.width || 0,
        height: metadata.height || 0,
      },
      
      // Performance & Billing
      processingTimeMs: opts.processingTimeMs,
      creditsUsed: opts.creditsUsed,
      
      // Defaults for sharing and organization
      isPublic: false,
      isFavorite: false,
      wasUpscaled: false,
      viewCount: 0,
      likeCount: 0,
      tags: [],
      
      // System
      generationVersion: opts.generationVersion || 'v2.1.0',
      userAgent: opts.userAgent,
    };

    console.log('[DEBUG] [GenerationsService] Saving record to Firestore...');
    await saveGenerationRecord(record);
    console.log('[DEBUG] [GenerationsService] ✅ Record saved to Firestore');

    console.log('[DEBUG] [GenerationsService] Generation complete:', jobId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      jobId,
      fullImageUrl,
      thumbnailUrl,
      templateUrl,
      fabricUrl,
    };
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('[DEBUG] [GenerationsService] ❌ ERROR in saveGeneration()');
    console.error('[DEBUG] [GenerationsService] Error:', error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    throw error;
  }
}

/**
 * Fetch user's generation history from Firestore
 */
export async function getUserGenerations(userId: string, limit: number = 12): Promise<GenerationRecord[]> {
  try {
    const app = getFirebaseAdminApp();
    const firestore = app.firestore();
    const snapshot = await firestore
      .collection('generations')
      .where('userId', '==', userId).get();

    const generations: GenerationRecord[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      generations.push({
        userId: data.userId,
        jobId: doc.id,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,

        // Image URLs
        templateUrl: data.templateUrl || undefined,
        fabricUrl: data.fabricUrl || undefined,
        fullImageUrl: data.fullImageUrl,
        thumbnailUrl: data.thumbnailUrl,

        // References
        templateId: data.templateId || undefined,
        fabricId: data.fabricId || undefined,

        // Settings
        settings: data.settings || { model: 'NanoBana', upscaleEnabled: false },

        // File Metadata
        originalTemplateFilename: data.originalTemplateFilename || undefined,
        originalFabricFilename: data.originalFabricFilename || undefined,
        imageDimensions: data.imageDimensions || undefined,

        // Performance & Billing
        processingTimeMs: data.processingTimeMs || undefined,
        creditsUsed: data.creditsUsed || undefined,

        // Sharing
        isPublic: data.isPublic || false,
        shareableSlug: data.shareableSlug || undefined,
        shareableLink: data.shareableLink || undefined,
        sharedAt: data.sharedAt ? data.sharedAt.toDate() : undefined,
        viewCount: data.viewCount || 0,
        likeCount: data.likeCount || 0,

        // User Organization
        isFavorite: data.isFavorite || false,
        tags: data.tags || [],
        notes: data.notes || undefined,
        folderPath: data.folderPath || undefined,

        // Upscaling Chain
        wasUpscaled: data.wasUpscaled || false,
        upscaledJobId: data.upscaledJobId || undefined,
        parentJobId: data.parentJobId || undefined,

        // System
        generationVersion: data.generationVersion || undefined,
        userAgent: data.userAgent || undefined,
        errorLogs: data.errorLogs || [],
        expiresAt: data.expiresAt ? data.expiresAt.toDate() : undefined,
        lastViewedAt: data.lastViewedAt ? data.lastViewedAt.toDate() : undefined,
      });
    });

    // Sort in memory to avoid requiring a composite index in the Firestore emulator/local dev
    generations.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)); return generations.slice(0, limit);  } catch (error) {    console.error('[GenerationsService] Failed to fetch user generations:', error);
    throw new Error('Failed to fetch generation history');
  }
}

/**
 * Delete a generation by jobId, enforcing ownership
 */
export async function deleteUserGeneration(userId: string, jobId: string): Promise<void> {
  try {
    const app = getFirebaseAdminApp();
    const firestore = app.firestore();

    const docRef = firestore.collection('generations').doc(jobId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      throw Object.assign(new Error('Generation not found'), { statusCode: 404 });
    }

    const data = snapshot.data();
    if (!data || data.userId !== userId) {
      throw Object.assign(new Error('Unauthorized to delete this generation'), { statusCode: 403 });
    }

    await docRef.delete();
  } catch (error: any) {
    const status = error?.statusCode || 500;
    const message = error?.message || 'Failed to delete generation';
    console.error('[GenerationsService] Delete failed:', error);
    throw Object.assign(new Error(message), { statusCode: status });
  }
}
