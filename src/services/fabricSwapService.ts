import { firebaseService } from '../../services/firebase';

export type FabricSwapRequest = {
  templateBase64: string;
  templateMimeType: string;
  fabricBase64: string;
  fabricMimeType: string;
  model: 'NanoBana' | 'Pro';
  refinementPrompt?: string;
  preserveFace?: boolean;
  preservePose?: boolean;
  outputFit?: 'contain' | 'cover';
  shouldWatermark?: boolean;
  userId?: string;
  templateId?: string;
  fabricId?: string;
  debug?: boolean;
};

export type FabricSwapResponse = {
  imageDataUrl: string;
  mimeType: string;
  jobId?: string;
  fullImageUrl?: string;
  thumbnailUrl?: string;
  templateUrl?: string;
  fabricUrl?: string;
  debug?: unknown;
};

export type GenerationRecord = {
  // Core Identity
  userId?: string;
  jobId: string;
  createdAt: string;
  updatedAt?: string;
  
  // Image URLs
  templateUrl?: string;              // Original uploaded template
  fabricUrl?: string;                // Original uploaded fabric
  fullImageUrl: string;              // AI result
  thumbnailUrl: string;
  
  // References
  templateId?: string;
  fabricId?: string;
  
  // Settings
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
  
  // File Metadata
  originalTemplateFilename?: string;
  originalFabricFilename?: string;
  imageDimensions?: {
    width: number;
    height: number;
  };
  
  // Performance & Billing
  processingTimeMs?: number;
  creditsUsed?: number;
  
  // Sharing
  isPublic?: boolean;
  shareableSlug?: string;
  shareableLink?: string;
  sharedAt?: string;
  viewCount?: number;
  likeCount?: number;
  
  // User Organization
  isFavorite?: boolean;
  tags?: string[];
  notes?: string;
  folderPath?: string;
  
  // Upscaling Chain
  wasUpscaled?: boolean;
  upscaledJobId?: string;
  parentJobId?: string;
  
  // System
  generationVersion?: string;
  userAgent?: string;
  errorLogs?: string[];
  expiresAt?: string;
  lastViewedAt?: string;
};

export async function generateFabricSwap(payload: FabricSwapRequest): Promise<FabricSwapResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  try {
    const auth = firebaseService.auth;
    const currentUser = auth?.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    // Silently handle auth errors
  }

  const res = await fetch('/api/designer-v2-1/swap', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data: any = await res.json().catch(() => null);
      const message = data && (data.error || data.message) ? (data.error || data.message) : '';
      throw new Error(message || `Fabric swap failed (${res.status})`);
    }

    const text = await res.text().catch(() => '');
    throw new Error(text || `Fabric swap failed (${res.status})`);
  }

  return (await res.json()) as FabricSwapResponse;
}
/**
 * Fetch user's generation history from Firestore
 */
export async function fetchGenerationHistory(limit: number = 12): Promise<GenerationRecord[]> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  try {
    const auth = firebaseService.auth;
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const token = await currentUser.getIdToken();
    headers.Authorization = `Bearer ${token}`;

    const url = new URL('/api/designer-v2-1/history', window.location.origin);
    url.searchParams.append('limit', String(Math.min(50, Math.max(1, limit))));

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const data: any = await res.json().catch(() => ({}));
      throw new Error(data?.error || `Failed to fetch history (${res.status})`);
    }

    const data = await res.json();
    return (data.generations || []) as GenerationRecord[];
  } catch (error) {
    throw error;
  }
}