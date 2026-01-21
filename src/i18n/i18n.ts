import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { SUPPORTED_LANGUAGES, translations, type SupportedLanguage } from './translations';

const STORAGE_KEY = 'khuyoot_lang_v1';

function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Detect user's preferred language based on multiple privacy-friendly signals:
 * 
 * IMPORTANT: Automatic detection ONLY happens on first visit.
 * Once user manually changes language, their choice is saved and NEVER overridden.
 * 
 * Detection priority:
 * 1. Check localStorage (user's explicit choice - HIGHEST PRIORITY, always respected)
 * 2. Detect timezone to infer region (no permissions needed, privacy-friendly)
 * 3. Check browser language preferences
 * 4. Default to Arabic (Oman market)
 */
function getInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'ar';

  // 1. User's explicit choice (saved in localStorage) - ALWAYS respected, never overridden
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isSupportedLanguage(stored)) return stored;
  } catch {
    // ignore
  }

  // 2. Detect timezone to infer likely region (privacy-friendly, no permissions needed)
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Arab countries (Arabic)
    const arabicTimezones = [
      'Asia/Muscat',        // Oman 🇴🇲
      'Asia/Dubai',         // UAE 🇦🇪
      'Asia/Riyadh',        // Saudi Arabia 🇸🇦
      'Asia/Kuwait',        // Kuwait 🇰🇼
      'Asia/Qatar',         // Qatar 🇶🇦
      'Asia/Bahrain',       // Bahrain 🇧🇭
      'Asia/Baghdad',       // Iraq 🇮🇶
      'Asia/Amman',         // Jordan 🇯🇴
      'Asia/Beirut',        // Lebanon 🇱🇧
      'Asia/Damascus',      // Syria 🇸🇾
      'Asia/Jerusalem',     // Palestine 🇵🇸
      'Africa/Cairo',       // Egypt 🇪🇬
      'Africa/Tripoli',     // Libya 🇱🇾
      'Africa/Khartoum',    // Sudan 🇸🇩
    ];

    // French-speaking countries (French)
    const frenchTimezones = [
      'Europe/Paris',       // France 🇫🇷
      'Europe/Brussels',    // Belgium 🇧🇪
      'Europe/Luxembourg',  // Luxembourg 🇱🇺
      'Europe/Monaco',      // Monaco 🇲🇨
      'America/Montreal',   // Quebec, Canada 🇨🇦
      'Europe/Zurich',      // Switzerland 🇨🇭 (multilingual but French-speaking region)
      'Africa/Tunis',       // Tunisia 🇹🇳
      'Africa/Algiers',     // Algeria 🇩🇿
      'Africa/Casablanca',  // Morocco 🇲🇦
      'Africa/Dakar',       // Senegal 🇸🇳
      'Africa/Abidjan',     // Ivory Coast 🇨🇮
    ];

    if (arabicTimezones.includes(timezone)) {
      return 'ar';
    }
    
    if (frenchTimezones.includes(timezone)) {
      return 'fr';
    }
  } catch {
    // ignore timezone detection failures
  }

  // 3. Check browser language preferences (all browsers support this)
  try {
    const browserLangs = navigator.languages || [navigator.language];
    
    for (const lang of browserLangs) {
      const lower = lang.toLowerCase();
      
      // Prefer Arabic for any Arabic locale
      if (lower.startsWith('ar')) return 'ar';
      
      // French for French locales
      if (lower.startsWith('fr')) return 'fr';
      
      // English for English locales
      if (lower.startsWith('en')) return 'en';
    }
  } catch {
    // ignore
  }

  // 4. Default to Arabic (primary market is Oman)
  return 'ar';
}

function applyDocumentDirection(language: SupportedLanguage) {
  if (typeof document === 'undefined') return;
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = language;
}

export function setLanguage(language: SupportedLanguage) {
  i18n.changeLanguage(language);
  applyDocumentDirection(language);
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // ignore
  }
}

// Initialize once (import this module early, e.g. in index.tsx)
const initialLanguage = getInitialLanguage();
applyDocumentDirection(initialLanguage);

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: translations.ar,
      en: translations.en,
      fr: translations.fr,
    },
    lng: initialLanguage,
    fallbackLng: 'ar',
    defaultNS: 'common',
    ns: ['common', 'home', 'product', 'measurements', 'orderSummary', 'designer', 'admin', 'errors'],
    interpolation: { escapeValue: false },
    returnNull: false,
    keySeparator: false, // Disable key separator to prevent 'common.navHome' from being interpreted as nested path
    nsSeparator: ':', // Use colon for namespace separator (e.g., 'home:title')
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[i18n] init failed', err);
  });

// Keep document dir/lang in sync if language changes via i18n directly.
i18n.on('languageChanged', (lng) => {
  if (isSupportedLanguage(lng)) {
    applyDocumentDirection(lng);
  }
});

export default i18n;
