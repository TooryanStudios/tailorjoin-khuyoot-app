/**
 * Site Configuration
 * Central place for all site-related constants
 */

export const SITE_CONFIG = {
  // Site Identity
  name: 'خيوط',
  nameEn: 'Khuyoot',
  tagline: 'منصة التفصيل الذكي',
  taglineEn: 'Smart Tailoring Platform',
  
  // URLs
  url: import.meta.env.VITE_SITE_URL || 'https://www.khuyoot.app',
  domain: 'www.khuyoot.app',
  
  // Open Graph / Social Media
  ogImage: '/og/khuyoot-og.jpg',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  
  // SEO
  description: 'منصة خيوط - الحل الذكي لربط العملاء بالخياطين والمحلات. تصميم وتفصيل وطلب الأزياء التقليدية العمانية بسهولة.',
  descriptionEn: 'Khuyoot Platform - Smart solution connecting customers with tailors and shops. Design, customize, and order traditional Omani clothing with ease.',
  keywords: 'خياطة, تفصيل, دشداشة, عمان, أزياء عمانية, خياطين, تصميم أزياء',
  
  // Social Media
  twitter: '@khuyoot_app',
  
  // Contact
  email: 'info@khuyoot.app',
  phone: '+968 92988080',
  
  // Localization
  defaultLocale: 'ar',
  locales: ['ar', 'en'],
  
  // Features
  features: {
    auth: true,
    marketplace: true,
    customization: true,
    measurements: true,
    notifications: true,
  }
} as const;

// Helper functions
export const getAbsoluteUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_CONFIG.url}${cleanPath}`;
};

export const getOgImageUrl = (): string => {
  return getAbsoluteUrl(SITE_CONFIG.ogImage);
};

export const getSiteUrl = (): string => {
  return SITE_CONFIG.url;
};
