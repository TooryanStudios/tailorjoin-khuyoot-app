/**
 * Helper utilities for tailor specialization
 * Stores English values in DB, displays Arabic in UI
 */

export type SpecializationKey = 'male' | 'female' | 'kids' | 'general';

export const SPECIALIZATION_MAP: Record<SpecializationKey, string> = {
  male: 'خياطة رجالية',
  female: 'خياطة نسائية',
  kids: 'خياطة أطفال',
  general: 'خياطة عامة',
};

/**
 * Convert specialization key to Arabic label for display
 */
export function getSpecializationLabel(key: string | undefined): string {
  if (!key) return 'غير محدد';
  // Handle legacy plurals
  const normalized = key === 'males' ? 'male' : key === 'females' ? 'female' : key;
  return SPECIALIZATION_MAP[normalized as SpecializationKey] || key;
}

/**
 * Convert tailorGender to specialization key
 */
export function tailorGenderToSpecialization(tailorGender: 'male' | 'female' | undefined): SpecializationKey {
  if (tailorGender === 'male') return 'male';
  if (tailorGender === 'female') return 'female';
  return 'general';
}

/**
 * Get all specialization options for dropdowns
 */
export function getSpecializationOptions(): Array<{ key: SpecializationKey; label: string }> {
  return Object.entries(SPECIALIZATION_MAP).map(([key, label]) => ({
    key: key as SpecializationKey,
    label,
  }));
}
