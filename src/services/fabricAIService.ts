/**
 * Fabric AI Service - Mock Implementation
 * This service will be replaced with real AI integration later (Gemini Vision, etc.)
 */

import type { CustomizationModel, FabricUpload, AIPreviewResult } from '../types/customization';

/**
 * Mock AI service to generate fabric preview on model
 * @param model - Selected garment model
 * @param fabric - Uploaded fabric image
 * @returns Preview URL and AI tips
 */
export async function generateFabricPreview(
  model: CustomizationModel,
  fabric: FabricUpload
): Promise<AIPreviewResult> {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock preview generation
  // In production, this will call AI API to overlay fabric on model
  const previewUrl = fabric.url; // Placeholder: just return fabric for now

  // Generate mock AI tips based on garment type
  const aiTips = generateMockTips(model.type, model.name);

  return {
    previewUrl,
    aiTips,
    processingTime: 2000
  };
}

/**
 * Generate mock AI tips based on garment type
 */
function generateMockTips(type: string, modelName: string): string[] {
  const baseTips = [
    'القماش المختار يناسب هذا التصميم بشكل ممتاز',
    'يُنصح باستخدام بطانة خفيفة للراحة',
  ];

  const typeTips: Record<string, string[]> = {
    abaya: [
      'يمكن إضافة تطريز ذهبي على الأكمام لمزيد من الأناقة',
      'القصّة الواسعة تناسب هذا النوع من القماش',
      'يفضل استخدام أزرار مخفية للحفاظ على المظهر الأنيق',
    ],
    dress: [
      'هذا القماش مناسب للفساتين الكاجوال',
      'يمكن إضافة حزام عند الخصر لإبراز القوام',
      'الأكمام الطويلة ستكون مريحة مع هذا القماش',
    ],
    thobe: [
      'القماش مناسب للثياب الرسمية',
      'يفضل الياقة المغلقة مع هذا التصميم',
      'يمكن إضافة جيوب داخلية للعملية',
    ],
    jalabia: [
      'هذا القماش خفيف ومناسب للجلابيات الصيفية',
      'يُنصح بقصّة فضفاضة للراحة',
      'يمكن إضافة زخارف على الصدر',
    ],
    shirt: [
      'القماش مناسب للقمصان الكلاسيكية',
      'يفضل استخدام أزرار خشبية أو معدنية',
      'الياقة الإيطالية ستكون أنيقة مع هذا القماش',
    ],
    other: [
      'القماش ذو جودة عالية',
      'يمكن استخدامه لتصاميم متنوعة',
    ]
  };

  const tips = [...baseTips, ...(typeTips[type] || typeTips.other)];
  
  // Return 3-4 random tips
  return tips.slice(0, 4);
}

/**
 * Upload fabric image to storage (mock)
 * In production, this will upload to Firebase Storage
 */
export async function uploadFabricImage(file: File): Promise<string> {
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // For now, create a local data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Validate uploaded fabric image
 */
export function validateFabricImage(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'حجم الصورة يجب أن لا يتجاوز 10 ميجابايت'
    };
  }

  return { valid: true };
}
