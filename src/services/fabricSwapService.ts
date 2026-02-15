import { apiJson } from '../api/apiFetch';

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

/**
 * Check if the API server is reachable before attempting generation
 */
async function checkApiHealth(): Promise<{ ok: boolean; error?: string }> {
  console.log('🔍 [Health Check] Starting API health check...');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn('⏱️ [Health Check] Timeout after 5 seconds, aborting...');
    controller.abort();
  }, 5000); // 5 second timeout

  try {
    console.log('📡 [Health Check] Fetching /api/health...');
    const startTime = Date.now();
    
    const res = await fetch('/api/health', {
      method: 'GET',
      signal: controller.signal,
      credentials: 'omit', // Don't send cookies for health check to avoid header size issues
      cache: 'no-store',
    });
    
    const elapsed = Date.now() - startTime;
    clearTimeout(timeoutId);
    
    console.log(`✅ [Health Check] Response received in ${elapsed}ms, status: ${res.status}`);
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      console.error(`❌ [Health Check] Server returned non-OK status: ${res.status}`, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) return { ok: false, error: `Server Error: ${errorJson.error}` };
      } catch {}
      return { ok: false, error: `Server returned ${res.status}: ${errorText.substring(0, 50)}` };
    }
    
    const data = await res.json().catch(() => {
      console.error('❌ [Health Check] Failed to parse JSON response');
      return null;
    });
    
    console.log('📦 [Health Check] Response data:', data);
    
    if (data?.status === 'ok') {
      console.log('✅ [Health Check] API server is healthy!');
      return { ok: true };
    }
    
    console.error('❌ [Health Check] Invalid response format:', data);
    return { ok: false, error: 'Invalid health check response' };
  } catch (err: any) {
    clearTimeout(timeoutId);
    
    console.error('❌ [Health Check] Error:', {
      name: err.name,
      message: err.message,
      stack: err.stack?.substring(0, 200)
    });
    
    if (err.name === 'AbortError') {
      console.error('⏱️ [Health Check] Server not responding (timeout after 5s)');
      return { ok: false, error: 'Server not responding (timeout)' };
    }
    
    console.error('🔌 [Health Check] Network error:', err.message);
    return { ok: false, error: err.message || 'Network error' };
  }
}

export async function generateFabricSwap(payload: FabricSwapRequest): Promise<FabricSwapResponse> {
  // STEP 1: Check API server health first
  console.log('🚀 [FabricSwap] ═══════════════════════════════════════');
  console.log('🚀 [FabricSwap] Starting generation request');
  console.log('🚀 [FabricSwap] Model:', payload.model);
  console.log('🚀 [FabricSwap] Template size:', Math.round(payload.templateBase64.length / 1024), 'KB');
  console.log('🚀 [FabricSwap] Fabric size:', Math.round(payload.fabricBase64.length / 1024), 'KB');
  console.log('🚀 [FabricSwap] ═══════════════════════════════════════');
  
  const healthCheck = await checkApiHealth();
  if (!healthCheck.ok) {
    console.error('💥 [FabricSwap] FAILED - API server not reachable:', healthCheck.error);
    throw new Error(`API server is not reachable: ${healthCheck.error}. Please check your internet connection or try again later.`);
  }
  console.log('✅ [FabricSwap] API server is healthy, proceeding with generation');

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Add timeout to prevent infinite hanging (90 seconds max)
  const TIMEOUT_MS = 90 * 1000; // 90 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error('⏱️ [FabricSwap] TIMEOUT after 90 seconds - aborting request');
    controller.abort();
  }, TIMEOUT_MS);

  try {
    console.log('📡 [FabricSwap] Sending POST to /api/designer-v2-1/swap...');
    const fetchStartTime = Date.now();

    // Support legacy callers that may still pass extra props at runtime.
    const { authToken: _ignoredAuthToken, ...body } = payload as any;

    const result = await apiJson<FabricSwapResponse>('/api/designer-v2-1/swap', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
      // Auth is optional: authenticated users get saved history; guests can still generate.
      requireAuth: false,
    });

    const fetchElapsed = Date.now() - fetchStartTime;
    clearTimeout(timeoutId);

    console.log(`📬 [FabricSwap] Response received in ${(fetchElapsed / 1000).toFixed(1)}s`);
    console.log('🎉 [FabricSwap] Generation complete! Job ID:', result.jobId);
    console.log('🚀 [FabricSwap] ═══════════════════════════════════════');
    return result;
  } catch (err: any) {
    clearTimeout(timeoutId);
    
    console.error('💥 [FabricSwap] EXCEPTION:', {
      name: err.name,
      message: err.message,
      stack: err.stack?.substring(0, 300)
    });
    
    // Handle timeout/abort
    if (err.name === 'AbortError') {
      console.error('⏱️ [FabricSwap] Request was aborted (timeout)');
      throw new Error('Generation timed out after 90 seconds. The server may be overloaded or the image is too large. Please try again.');
    }
    
    throw err;
  }
}
/**
 * Fetch user's generation history from Firestore
 */
export async function fetchGenerationHistory(limit: number = 12): Promise<GenerationRecord[]> {
  const safeLimit = Math.min(50, Math.max(1, limit));
  const qs = new URLSearchParams({ limit: String(safeLimit) }).toString();
  const data = await apiJson<any>(`/api/designer-v2-1/history?${qs}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    requireAuth: true,
  });

  return (data.generations || (Array.isArray(data) ? data : [])) as GenerationRecord[];
}