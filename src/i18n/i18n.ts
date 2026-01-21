import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { SUPPORTED_LANGUAGES, translations, type SupportedLanguage } from './translations';

const STORAGE_KEY = 'khuyoot_lang_v1';

function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

function getInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'ar';

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isSupportedLanguage(stored)) return stored;
  } catch {
    // ignore
  }

  const nav = (typeof navigator !== 'undefined' ? navigator.language : '') || '';
  const lower = nav.toLowerCase();
  if (lower.startsWith('ar')) return 'ar';
  if (lower.startsWith('en')) return 'en';
  if (lower.startsWith('fr')) return 'fr';

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
