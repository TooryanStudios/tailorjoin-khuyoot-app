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

  // Background context
  isBackground?: boolean;
  jobId?: string;
}): Promise<{ 
  jobId: string; 
  fullImageUrl: string; 
  thumbnailUrl: string;
  templateUrl?: string;
  fabricUrl?: string;
}> {
  const jobId = opts.jobId || uuidv4();
  const app = getFirebaseAdminApp();
  const bucketName = app.storage().bucket().name;

  const resultFileName = `${jobId}_result.png`;
  const thumbFileName = `${jobId}_thumb.webp`;
  const templateFileName = opts.templateMimeType ? `${jobId}_template.${opts.templateMimeType.split('/')[1] || 'png'}` : null;
  const fabricFileName = opts.fabricMimeType ? `${jobId}_fabric.${opts.fabricMimeType.split('/')[1] || 'png'}` : null;

  const fullImageUrl = `https://storage.googleapis.com/${bucketName}/generations/${opts.userId}/${resultFileName}`;
  const thumbnailUrl = `https://storage.googleapis.com/${bucketName}/generations/${opts.userId}/${thumbFileName}`;
  const templateUrl = templateFileName ? `https://storage.googleapis.com/${bucketName}/generations/${opts.userId}/${templateFileName}` : undefined;
  const fabricUrl = fabricFileName ? `https://storage.googleapis.com/${bucketName}/generations/${opts.userId}/${fabricFileName}` : undefined;

  const responseUrls = {
    jobId,
    fullImageUrl,
    thumbnailUrl,
    templateUrl,
    fabricUrl,
  };

  const executeWork = async () => {
    try {
      console.log(`[GenerationsService] [${jobId}] Processing storage and database...`);
      
      const imageData = opts.imageBase64.replace(/^data:.*;base64,/, '');
      const imageBuffer = Buffer.from(imageData, 'base64');

      const [metadata, thumbnailBuffer] = await Promise.all([
        sharp(imageBuffer).metadata(),
        sharp(imageBuffer)
          .resize(200, 300, { fit: 'cover', position: 'center' })
          .webp({ quality: 80 })
          .toBuffer()
      ]);

      const uploads = [
        uploadToFirebaseStorage(opts.imageBase64, opts.userId, jobId, resultFileName, 'image/png'),
        uploadToFirebaseStorage(thumbnailBuffer.toString('base64'), opts.userId, jobId, thumbFileName, 'image/webp'),
      ];

      if (opts.templateBase64 && templateFileName) {
        uploads.push(uploadToFirebaseStorage(opts.templateBase64, opts.userId, jobId, templateFileName, opts.templateMimeType!));
      }
      if (opts.fabricBase64 && fabricFileName) {
        uploads.push(uploadToFirebaseStorage(opts.fabricBase64, opts.userId, jobId, fabricFileName, opts.fabricMimeType!));
      }

      await Promise.all(uploads);

      const record: GenerationRecord = {
        userId: opts.userId,
        jobId,
        createdAt: new Date(),
        fullImageUrl,
        thumbnailUrl,
        templateUrl,
        fabricUrl,
        templateId: opts.templateId,
        fabricId: opts.fabricId,
        settings: {
          model: opts.model,
          upscaleEnabled: opts.upscaleEnabled || false,
          refinementPrompt: opts.refinementPrompt,
          outputFit: opts.outputFit,
          preserveFace: opts.preserveFace,
          preservePose: opts.preservePose,
          shouldWatermark: opts.shouldWatermark,
          strength: opts.strength,
        },
        imageDimensions: { width: metadata.width || 0, height: metadata.height || 0 },
        processingTimeMs: opts.processingTimeMs,
        creditsUsed: opts.creditsUsed,
        originalTemplateFilename: opts.originalTemplateFilename,
        originalFabricFilename: opts.originalFabricFilename,
        generationVersion: opts.generationVersion || '2.1',
        userAgent: opts.userAgent,
      };

      await saveGenerationRecord(record);
      console.log(`[GenerationsService] [${jobId}] ✅ Successfully saved.`);
    } catch (err) {
      console.error(`[GenerationsService] [${jobId}] ❌ Background work failed:`, err);
    }
  };

  if (opts.isBackground) {
    executeWork(); // Fire and forget
    return responseUrls;
  } else {
    await executeWork();
    return responseUrls;
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
    generations.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    return generations.slice(0, limit);
  } catch (error) {
    console.error('[GenerationsService] Failed to fetch user generations:', error);
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
