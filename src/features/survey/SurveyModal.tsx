import React from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../../context/AppContext';
import {
  OMAN_GOVERNORATES,
  SURVEY_QUESTIONS,
  type SurveyAnswers,
  type SurveyOption,
  type SurveyQuestion,
} from './config';

// Subtle inner shine animation for CTA
const shineAnimationStyles = `
  @keyframes ctaShine {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .cta-shine {
    background-size: 200% 100%;
    animation: ctaShine 1.8s ease-in-out infinite;
    box-shadow: inset 0 1px 3px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(47, 184, 179, 0.3);
  }
`;

export type SurveyModalProps = {
  isOpen: boolean;
  questionId: string | null;
  currentStep: number;
  totalSteps: number;
  answers: SurveyAnswers;
  needsGovernorateSelect: boolean;
  shouldShowOtherPain: boolean;
  shouldShowOtherBlockers: boolean;
  isStepValid: (questionId: string) => boolean;
  onClose: () => void;
  onSkip: () => void;
  onContinueLater: () => void;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  goToStep: (step: number) => void;
  updateAnswer: (questionId: string, value: SurveyAnswers[string]) => void;
  toggleMultiAnswer: (questionId: string, value: string) => void;
  forceWelcome?: boolean;
  backdropVariant?: 'default' | 'designerV2_1';
};

const isOptionSelected = (value: SurveyAnswers[string], option: string) => {
  if (Array.isArray(value)) return value.includes(option);
  return value === option;
};

// Survey question translations
const SURVEY_TRANSLATIONS: Record<string, any> = {
  ar: {
    back: 'السابق',
    skip: 'تخطي',
    next: 'التالي',
    complete: 'إتمام الاستبيان',
    question: 'سؤال',
    of: 'من',
    countries: {
      oman: 'عُمان',
      tunisia: 'تونس',
      morocco: 'المغرب',
      algeria: 'الجزائر',
      libya: 'ليبيا',
      other: 'أخرى'
    },
    options: {
      // Device type
      mobile: '📲 موبايل',
      desktop: '💻 سطح المكتب / لابتوب',
      both: '📱💻 كلاهما',
      
      // Frequency
      monthly: '🔄 شهرياً',
      every_2_3_months: '⏰ كل 2-3 أشهر',
      '2_4_yearly': '🗓️ 2-4 مرات بالسنة',
      rarely: '🌙 نادراً (مرة بالسنة أو أقل)',
      never: '❌ أبداً',
      
      // Spend ranges (with currency tokens)
      '30_100': '💵 30–100 {{CURRENCY}}',
      '100_200': '💳 100–200 {{CURRENCY}}',
      '200_plus': '💎 200+ {{CURRENCY}}',
      not_sure: '🤷 غير متأكد',
      under_30: '💵 أقل من 30 {{CURRENCY}}',
      '30_60': '💵 30–60 {{CURRENCY}}',
      '60_120': '💳 60–120 {{CURRENCY}}',
      '120_200': '💎 120–200 {{CURRENCY}}',
      
      // Try-on usefulness
      very_useful: '✅ مفيد جداً',
      somewhat_useful: '🤔 مفيد إلى حد ما',
      not_useful: '❌ غير مفيد',
      
      // Try-on where
      at_home: '🏠 في المنزل',
      in_store: '🛍️ في المتجر',
      at_tailor: '✂️ عند الخياط',
      anywhere: '🌍 في أي مكان',
      
      // Pain points
      choosing_fabric: '🧵 اختيار القماش',
      visualizing: '👁️ تصور الشكل النهائي',
      quality: '⭐ الجودة',
      measurement: '📏 مشاكل القياس',
      time: '⏱️ الوقت',
      unclear_price: '💸 سعر غير واضح',
      delivery: '🚚 التوصيل',
      finding_tailor: '🔍 إيجاد خياط',
      other: '💭 أخرى'
    },
    questions: {
      country: 'في أي دولة أنت؟',
      device_type: 'ما الجهاز الذي تستخدمه؟',
      stitch_frequency: '📅 كم مرة تخيط الملابس سنوياً؟',
      stitch_spend_range: 'كم تنفق عادة على الخياطة؟',
      spend_per_outfit: 'كم تنفق لكل طقم؟',
      platform_usefulness: 'ما مدى فائدة منصة تجمع الأقمشة والتجربة الافتراضية والخياطين؟',
      tryon_usefulness: 'هل التجربة الافتراضية مفيدة لك؟',
      tryon_where: 'أين تفضل استخدام التجربة الافتراضية؟',
      pain_points: 'في مجال خياطة الملابس، ما أكبر التحديات لديك؟',
      stitching_location: 'أين تفضل أن تخيط ملابسك؟',
      stitching_motivation: 'ما الذي يحفزك على اختيار الخياطة؟',
      fabric_purchase_preference: 'كيف تفضل شراء الأقمشة؟',
      measurement_method: 'كيف تأخذ المقاسات عادة؟',
      willing_to_pay_tryon: 'هل ستدفع للتجربة الافتراضية؟',
      tryon_fee_range: 'ما النطاق المفضل لرسوم التجربة (اختياري)؟',
      privacy_concern: 'ما رأيك في رفع الصور للتجربة؟',
      open_feedback: 'أي ملاحظات أخرى؟ (اختياري)',
      thank_you: 'شكراً لك'
    }
  },
  en: {
    back: 'Back',
    skip: 'Skip',
    next: 'Next Step',
    complete: 'Complete Survey',
    question: 'Question',
    of: 'of',
    countries: {
      oman: 'Oman',
      tunisia: 'Tunisia',
      morocco: 'Morocco',
      algeria: 'Algeria',
      libya: 'Libya',
      other: 'Other'
    },
    questions: {
      country: 'Which country are you in?',
      device_type: 'Which device are you using?',
      stitch_frequency: 'How often do you get items stitched?',
      stitch_spend_range: 'How much do you usually spend on stitching?',
      spend_per_outfit: 'How much do you spend per outfit?',
      platform_usefulness: 'How useful would a platform with fabrics, virtual try-on, and jobs be?',
      tryon_usefulness: 'Is virtual try-on useful for you?',
      tryon_where: 'Where would you like to use virtual try-on?',
      pain_points: 'What are your biggest pain points today?',
      stitching_location: 'Where do you prefer to stitch?',
      stitching_motivation: 'What motivates you to choose stitching?',
      fabric_purchase_preference: 'How do you prefer to buy fabrics?',
      measurement_method: 'How do you usually take measurements?',
      willing_to_pay_tryon: 'Would you pay for virtual try-on?',
      tryon_fee_range: 'Preferred try-on fee range (optional)',
      privacy_concern: 'How do you feel about uploading photos for try-on?',
      open_feedback: 'Any other thoughts? (optional)',
      thank_you: 'Thank you'
    }
  },
  fr: {
    back: 'Retour',
    skip: 'Passer',
    next: 'Suivant',
    complete: 'Terminer le sondage',
    question: 'Question',
    of: 'sur',
    countries: {
      oman: 'Oman',
      tunisia: 'Tunisie',
      morocco: 'Maroc',
      algeria: 'Algérie',
      libya: 'Libye',
      other: 'Autre'
    },
    questions: {
      country: 'Dans quel pays êtes-vous?',
      device_type: 'Quel appareil utilisez-vous?',
      stitch_frequency: 'À quelle fréquence faites-vous coudre?',
      stitch_spend_range: 'Combien dépensez-vous pour la couture?',
      spend_per_outfit: 'Combien dépensez-vous par tenue?',
      platform_usefulness: 'Utilité d’une plateforme avec tissus, essayage virtuel et emplois?',
      tryon_usefulness: "L'essayage virtuel est-il utile pour vous?",
      tryon_where: "Où aimeriez-vous utiliser l'essayage virtuel?",
      pain_points: 'Quels sont vos principaux points de douleur?',
      stitching_location: 'Où préférez-vous coudre?',
      stitching_motivation: 'Qu’est-ce qui motive votre choix de couture?',
      fabric_purchase_preference: 'Comment préférez-vous acheter des tissus?',
      measurement_method: 'Comment prenez-vous les mesures?',
      willing_to_pay_tryon: "Paieriez-vous pour l'essayage virtuel?",
      tryon_fee_range: "Plage de tarif préférée (optionnel)",
      privacy_concern: "Que pensez-vous du téléversement de photos pour l'essayage?",
      open_feedback: 'Autres commentaires? (optionnel)',
      thank_you: 'Merci'
    }
  }
};

const COUNTRY_FLAGS: Record<string, string> = {
  oman: 'om',
  tunisia: 'tn',
  morocco: 'ma',
  algeria: 'dz',
  libya: 'ly',
  other: '🌍'
};

const renderCountryThumbnails = (
  value: SurveyAnswers[string],
  onSelect: (value: string) => void,
  lang: string,
  themeVariant: 'default' | 'designerV2_1' = 'default'
) => {
  const countries = ['oman', 'tunisia', 'morocco', 'algeria', 'libya', 'other'];
  const t = SURVEY_TRANSLATIONS[lang] || SURVEY_TRANSLATIONS.en;
  const isDesigner = themeVariant === 'designerV2_1';
  
  return (
    <div className="grid grid-cols-3 gap-2">
      {countries.map((country) => {
        const selected = value === country;
        const flagCode = COUNTRY_FLAGS[country];
        const isOther = country === 'other';
        
        return (
          <button
            key={country}
            type="button"
            onClick={() => onSelect(country)}
            className={`relative flex flex-col items-center justify-center p-2.5 rounded-lg border-2 transition-all duration-200 ${
              selected
                ? isDesigner
                  ? 'bg-zinc-950/40 shadow-md scale-105 border-zinc-700'
                  : 'border-blue-500 bg-blue-50 shadow-md shadow-blue-500/20 scale-105 dark:bg-blue-900/40 dark:border-blue-400'
                : isDesigner
                  ? 'border-zinc-800 bg-zinc-950/20 hover:border-zinc-700 hover:bg-zinc-950/30'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600'
            }`}
            style={selected && isDesigner ? { borderColor: '#2fb8b3' } : undefined}
          >
            {isOther ? (
              <div className="text-lg mb-1">🌍</div>
            ) : (
              <div className="relative mb-1 w-8 h-6 rounded overflow-hidden shadow-sm">
                <img 
                  src={`https://flagcdn.com/w40/${flagCode}.png`}
                  srcSet={`https://flagcdn.com/w80/${flagCode}.png 2x`}
                  alt={t.countries[country]}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <span className={`text-[10px] font-medium text-center leading-tight ${
              selected
                ? isDesigner
                  ? 'text-zinc-100'
                  : 'text-blue-700 dark:text-blue-300'
                : isDesigner
                  ? 'text-zinc-300'
                  : 'text-slate-700 dark:text-slate-300'
            }`}>
              {t.countries[country]}
            </span>
            {selected && (
              <div
                className={`absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full text-white shadow-md ${
                  isDesigner ? '' : 'bg-blue-500'
                }`}
                style={isDesigner ? { backgroundColor: '#2fb8b3' } : undefined}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

const getCurrencyForLang = (lang: string) => {
  if (lang === 'ar') return 'OMR';
  if (lang === 'fr') return 'EUR';
  return 'USD';
};

const renderCardOptions = (
  question: SurveyQuestion,
  value: SurveyAnswers[string],
  onSingle: (value: string) => void,
  onToggle: (value: string) => void,
  lang: string,
  themeVariant: 'default' | 'designerV2_1' = 'default'
) => {
  const isMulti = question.type === 'multi';
  const currency = getCurrencyForLang(lang);
  const t = SURVEY_TRANSLATIONS[lang] || SURVEY_TRANSLATIONS.en;
  const isDesigner = themeVariant === 'designerV2_1';
  const gridCols = question.gridColumns || 2;
  const isSmall = question.useSmallCards;
  
  const gridClass = gridCols === 3 ? 'grid-cols-3' : 'grid-cols-2';
  const minHeight = isSmall ? 'min-h-[80px]' : 'min-h-[120px]';
  const iconSize = isSmall ? 'text-2xl' : 'text-3xl';
  const padding = isSmall ? 'p-3' : 'p-4';
  
  return (
    <div className={`grid ${gridClass} gap-3`}>
      {question.options?.map((option) => {
        const selected = isOptionSelected(value, option.value);
        // Use translated label if available, otherwise use config label
        const translatedLabel = t.options?.[option.value] || option.label;
        const displayLabel = translatedLabel.replace('{{CURRENCY}}', currency);
        const icon = option.icon || '';
        
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => (isMulti ? onToggle(option.value) : onSingle(option.value))}
            className={`relative flex flex-col items-center justify-center ${padding} rounded-xl border-2 transition-all duration-200 ${minHeight} ${
              selected
                ? isDesigner
                  ? 'bg-zinc-950/30 shadow-lg border-zinc-700'
                  : 'bg-slate-50 shadow-lg ring-2 dark:bg-slate-800/40 dark:border-slate-600'
                : isDesigner
                  ? 'border-zinc-800 bg-zinc-950/15 hover:bg-zinc-950/25 hover:border-zinc-700 hover:shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600'
            }`}
            style={selected ? { borderColor: '#2fb8b3', borderWidth: '2px', boxShadow: '0 0 0 2px rgba(47, 184, 179, 0.2)' } : {}}
          >
            {selected && (
              <div className="absolute top-2 right-2 flex items-center justify-center h-5 w-5 rounded-full text-white" style={{ backgroundColor: '#2fb8b3' }}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {icon && (
              <div className={iconSize + ' mb-2'}>{icon}</div>
            )}
            <span className={`text-center text-sm font-medium ${
              selected
                ? isDesigner
                  ? 'text-zinc-100'
                  : 'dark:text-slate-100'
                : isDesigner
                  ? 'text-zinc-300'
                  : 'text-slate-700 dark:text-slate-300'
            }`}>
              {displayLabel.replace(icon + ' ', '')}
            </span>
          </button>
        );
      })}
    </div>
  );
};

const renderOptions = (
  question: SurveyQuestion,
  value: SurveyAnswers[string],
  onSingle: (value: string) => void,
  onToggle: (value: string) => void,
  lang: string,
  themeVariant: 'default' | 'designerV2_1' = 'default'
) => {
  if (!question.options) return null;
  const isMulti = question.type === 'multi';
  const currency = getCurrencyForLang(lang);
  const t = SURVEY_TRANSLATIONS[lang] || SURVEY_TRANSLATIONS.en;
  const isDesigner = themeVariant === 'designerV2_1';
  
  const gridClass = question.useTwoColumns ? 'grid grid-cols-2 gap-2' : 'grid gap-2';
  
  return (
    <div className={gridClass}>
      {question.options.map((option: SurveyOption) => {
        const selected = isOptionSelected(value, option.value);
        // Use translated label if available, otherwise use config label
        const translatedLabel = t.options?.[option.value] || option.label;
        const displayLabel = translatedLabel.replace('{{CURRENCY}}', currency);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => (isMulti ? onToggle(option.value) : onSingle(option.value))}
            className={`w-full text-left px-4 py-2.5 rounded-lg border transition-all duration-200 ${
              selected
                ? isDesigner
                  ? 'bg-zinc-950/30 shadow-sm border-zinc-700'
                  : 'bg-slate-50 shadow-sm ring-1 dark:bg-slate-800/40 dark:border-slate-600'
                : isDesigner
                  ? 'border-zinc-800 bg-zinc-950/15 hover:border-zinc-700 hover:bg-zinc-950/25'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-750'
            }`}
            style={selected ? { borderColor: '#2fb8b3', borderWidth: '1px' } : {}}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{displayLabel}</span>
              {selected ? (
                <div className="flex items-center justify-center h-5 w-5 rounded-full text-white" style={{ backgroundColor: '#2fb8b3' }}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
};

const renderScale = (question: SurveyQuestion, value: SurveyAnswers[string], onSelect: (value: number) => void) => {
  const selected = typeof value === 'number' ? value : 0;
  const scaleValues = question.options && question.options.length > 0
    ? question.options.map((opt) => Number(opt.value))
    : [1, 2, 3, 4, 5];
  
  const getScaleColor = (score: number) => {
    if (!question.useColorScale) return '';
    const max = Math.max(...scaleValues);
    const percentage = (score - 1) / (max - 1);
    
    if (percentage <= 0.33) return 'border-red-400 bg-red-50 text-red-700 hover:border-red-500 dark:bg-red-900/30 dark:text-red-300';
    if (percentage <= 0.66) return 'border-yellow-400 bg-yellow-50 text-yellow-700 hover:border-yellow-500 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'border-green-400 bg-green-50 text-green-700 hover:border-green-500 dark:bg-green-900/30 dark:text-green-300';
  };
  
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
      {scaleValues.map((score) => (
        <button
          key={score}
          type="button"
          onClick={() => onSelect(score)}
          className={`h-12 w-12 rounded-full border-2 text-sm font-semibold transition-all duration-200 flex items-center justify-center shadow-sm ${
            selected === score
              ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200 dark:bg-blue-900/60 dark:text-blue-100 dark:ring-blue-900 scale-110'
              : question.useColorScale
              ? getScaleColor(score)
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:scale-110 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {score}
        </button>
      ))}
    </div>
  );
};
const ProgressTimeline: React.FC<{ currentStep: number; totalSteps: number; lang: string; onStepClick: (step: number) => void }> = ({ currentStep, totalSteps, lang, onStepClick }) => {
  const isRTL = lang === 'ar';
  
  return (
    <div className={`flex items-center justify-center mb-6 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 dark:bg-slate-800/30 border" style={{ borderColor: '#2fb8b3' }}>
        <div className="flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-xs" style={{ backgroundColor: '#2fb8b3' }}>
          {currentStep + 1}
        </div>
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{totalSteps}</span>
      </div>
    </div>
  );
};
const renderTextField = (
  value: SurveyAnswers[string],
  placeholder: string,
  onChange: (value: string) => void
) => (
  <textarea
    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 min-h-[100px] resize-none"
    placeholder={placeholder}
    value={typeof value === 'string' ? value : ''}
    onChange={(event) => onChange(event.target.value)}
  />
);

const WelcomeView = ({ onAccept, onLater }: { onAccept: (lang: string) => void; onLater: () => void }) => {
  const [lang, setLang] = React.useState('ar');
  const [showLangMenu, setShowLangMenu] = React.useState(false);
  const langMenuRef = React.useRef<HTMLDivElement>(null);
  const isRTL = lang === 'ar';

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    };

    if (showLangMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLangMenu]);

  const content = {
    ar: {
      headline: "هل أنت مستعد لاستبيان سريع لتطوير خيوط؟",
      body: (
        <>
          نحن حالياً في مرحلة تطوير <span className="font-semibold text-slate-900 dark:text-slate-100">خيوط</span> ونود معرفة رأيك.
          هل يمكنك منحنا بضع دقائق لمشاركتنا أفكارك?
        </>
      ),
      accept: "نعم، لنبدأ",
      later: "ربما لاحقاً",
      footer: "يستغرق أقل من دقيقتين • رأيك يهمنا"
    },
    en: {
      headline: "Ready for a quick survey to develop Khuyoot?",
      body: (
        <>
          We are currently developing <span className="font-semibold text-slate-900 dark:text-slate-100">Khuyoot</span> and would love your input.
          Could you spare a few minutes to share your thoughts?
        </>
      ),
      accept: "Yes, let's do it",
      later: "Maybe later",
      footer: "Takes less than 2 minutes • Your feedback matters"
    },
    fr: {
      headline: "Prêt pour un sondage rapide pour développer Khuyoot?",
      body: (
        <>
          Nous développons actuellement <span className="font-semibold text-slate-900 dark:text-slate-100">Khuyoot</span> et nous aimerions avoir votre avis.
          Pourriez-vous nous accorder quelques minutes ?
        </>
      ),
      accept: "Oui, allons-y",
      later: "Peut-être plus tard",
      footer: "Prend moins de 2 minutes • Votre avis compte"
    }
  };

  const t = content[lang as keyof typeof content];

  const languages = [
    { id: 'ar', label: 'العربية', flag: 'AR' },
    { id: 'en', label: 'English', flag: 'EN' },
    { id: 'fr', label: 'Français', flag: 'FR' }
  ];

  const currentLang = languages.find(l => l.id === lang);

  return (
    <div className="text-center py-4 relative">
      {/* Language Selector - top corner (takes logo spot) */}
      <div className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} z-20`} ref={langMenuRef}>
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="h-9 w-14 rounded-lg text-sm flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="font-bold text-xs">{currentLang?.flag}</span>
          </button>
          
          {showLangMenu && (
            <div
              className={`absolute top-11 ${isRTL ? 'right-0' : 'left-0'} bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[160px]`}
            >
              {languages.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setLang(item.id);
                    setShowLangMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                    lang === item.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="font-bold text-xs w-8">{item.flag}</span>
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto mb-2 flex h-40 w-full items-center justify-center">
         <img src="/logo.png" alt="Khuyoot Logo" className="h-full w-auto object-contain drop-shadow-xl" />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 px-2 text-center">
        {t.headline}
      </h2>
      
      <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-sm mx-auto px-4 text-center">
        {t.body}
      </p>
  
      <div className="space-y-3 px-4">
        <button
          type="button"
          onClick={() => onAccept(lang)}
          className="w-full py-3.5 px-4 text-white font-semibold rounded-xl shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98] cta-shine"
          style={{ backgroundColor: '#2fb8b3', boxShadow: '0 4px 12px rgba(47, 184, 179, 0.2)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27a7a2'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2fb8b3'}
        >
          {t.accept}
        </button>
        
        <button
          type="button"
          onClick={onLater}
          className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-600 font-medium rounded-xl border border-slate-200 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-750"
        >
          {t.later}
        </button>
      </div>
      
      <p className="mt-6 text-sm font-medium text-slate-400 dark:text-slate-500">
        {t.footer}
      </p>
    </div>
  );
};

export const SurveyModal: React.FC<SurveyModalProps> = ({
  isOpen,
  questionId,
  currentStep,
  totalSteps,
  answers,
  needsGovernorateSelect,
  shouldShowOtherPain,
  shouldShowOtherBlockers,
  isStepValid,
  onClose,
  onSkip,
  onContinueLater,
  onNext,
  onBack,
  onSubmit,
  goToStep,
  updateAnswer,
  toggleMultiAnswer,
  forceWelcome = false,
  backdropVariant = 'default',
}) => {
    const { user } = useApp();
    const isAdminMode = user?.role === 'admin';
  
  const isStarted = React.useMemo(() => {
    // Check if user has already accepted or started filling the survey
    return currentStep > 0 || Object.keys(answers).length > 0 || !!answers['language_preference'];
  }, [currentStep, answers]);

  const [view, setView] = React.useState<'welcome' | 'question' | 'thank-you'>(
    isStarted ? 'question' : 'welcome'
  );

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Get selected language from answers, default to 'ar'
  const selectedLang = (answers.language_preference as string) || 'ar';
  const isRTL = selectedLang === 'ar';
  const t = SURVEY_TRANSLATIONS[selectedLang] || SURVEY_TRANSLATIONS.en;
  
  // Check if country is selected for pulse animation
  const isCountryQuestion = questionId === 'country';
  const hasCountryAnswer = !!answers.country;

  // Force welcome screen when requested (e.g., admin preview) on open
  React.useEffect(() => {
    if (forceWelcome && isOpen) {
      setView('welcome');
    }
  }, [forceWelcome, isOpen]);

  // Resume in-progress surveys normally
  React.useEffect(() => {
    if (!forceWelcome && isStarted && view !== 'question') {
      setView('question');
    }
  }, [isStarted, forceWelcome, view]);

  // Reset isSubmitting when view changes away from question (e.g., to thank-you)
  React.useEffect(() => {
    if (view !== 'question') {
      setIsSubmitting(false);
    }
  }, [view]);

  // Prevent global overlay cleanup from removing this modal
  React.useEffect(() => {
    if (isOpen) {
      try { document.body.classList.add('modal-open'); } catch {}
    }
    return () => {
      try { document.body.classList.remove('modal-open'); } catch {}
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // If we are in question view but have no questionId, we can't render questions
  if (view === 'question' && !questionId) return null;

  const question = questionId ? SURVEY_QUESTIONS[questionId] : null;

  const handleWelcomeAccept = (lang: string) => {
    updateAnswer('language_preference', lang);
    setView('question');
  };

  const overlayClassName =
    backdropVariant === 'designerV2_1'
      ? 'fixed inset-0 z-[10000] flex items-center justify-center px-4 backdrop-blur-sm bg-zinc-950/60 transition-opacity'
      : 'fixed inset-0 z-[10000] flex items-center justify-center px-4 backdrop-blur-sm bg-black/40 transition-opacity';

  const clickCatcherClassName =
    backdropVariant === 'designerV2_1' ? 'absolute inset-0 bg-zinc-950/50' : 'absolute inset-0 bg-black/30';

  const modalCardClassName =
    backdropVariant === 'designerV2_1'
      ? 'relative w-full max-w-lg rounded-2xl bg-zinc-900 p-6 shadow-2xl ring-1 ring-zinc-800 overflow-visible transform transition-all animate-in fade-in zoom-in-95 duration-200'
      : 'relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-slate-100/10 overflow-visible transform transition-all animate-in fade-in zoom-in-95 duration-200';

  return createPortal(
    <div data-overlay="khuyoot-modal" className={overlayClassName} dir={isRTL ? 'rtl' : 'ltr'}>
      <style>{shineAnimationStyles}</style>
      <div className={clickCatcherClassName} onClick={onClose} />
      <div className={modalCardClassName}>
        {backdropVariant !== 'designerV2_1' ? (
          <>
            {/* Background blobs for appealing visuals */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          </>
        ) : null}

        {/* Logo - shown only in question view (except final thank-you step which has its own centered logo) */}
        {view === 'question' && questionId !== 'thank_you' ? (
          <div className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} z-10`}>
            <img
              src="/logo.png"
              alt="Khuyoot"
              className="h-10 w-auto object-contain drop-shadow-md"
            />
          </div>
        ) : null}

        {/* Close Button - Always visible, positioned correctly for RTL/LTR */}
        <div className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} z-10`}>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />

                    {/* Admin Testing Mode Banner */}
                    {isAdminMode && (
                      <div className="relative mt-16 mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                              {isRTL ? 'وضع الاختبار للمشرف' : 'Admin Testing Mode'}
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                              {isRTL 
                                ? 'إجاباتك محفوظة محليًا فقط ولن يتم إرسالها إلى قاعدة البيانات لتجنب تلويث البيانات' 
                                : 'Your responses are saved locally only and will not be submitted to the database to prevent data pollution'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
            </svg>
          </button>
        </div>

        <div className="relative z-0">
          {view === 'welcome' && (
            <WelcomeView 
              onAccept={handleWelcomeAccept} 
              onLater={onContinueLater} 
            />
          )}

          {view === 'thank-you' && (
            <div className="text-center py-12">
              <div className="mb-6 animate-bounce">
                <svg className="w-16 h-16 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                {isRTL ? 'شكراً لك!' : 'Thank You!'}
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-lg mb-8">
                {isRTL 
                  ? 'نشكرك على وقتك وتعاونك معنا' 
                  : 'Thank you for your time and feedback'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 text-white font-semibold rounded-xl transition-all hover:scale-105 active:scale-95 cta-shine"
                style={{ backgroundColor: '#2fb8b3', boxShadow: '0 4px 12px rgba(47, 184, 179, 0.2)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27a7a2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2fb8b3'}
              >
                {isRTL ? 'إغلاق' : 'Close'}
              </button>
            </div>
          )}

          {view === 'question' && question && (
            <>
              {/* Progress Timeline */}
              {question.id !== 'thank_you' ? (
                <ProgressTimeline
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  lang={selectedLang}
                  onStepClick={goToStep}
                />
              ) : null}
              
              <div className="mb-6">
                {question.id !== 'thank_you' ? (
                  <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                      {t.question} {currentStep + 1} {t.of} {totalSteps}
                    </span>
                  </div>
                ) : null}

                {question.id !== 'thank_you' ? (
                  <h2 className={`text-xl font-bold text-slate-900 dark:text-white leading-tight ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t.questions[question.id] || question.label}
                  </h2>
                ) : null}

                {question.id !== 'thank_you' && question.description ? (
                  <p className={`mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>
                    {question.description}
                  </p>
                ) : null}
              </div>

              <div className="space-y-4 min-h-[200px]">
                {question.type === 'info' ? (
                  <div className="py-8 text-center">
                    <img
                      src="/logo.png"
                      alt="Khuyoot"
                      className="mx-auto mb-6 h-14 w-auto object-contain"
                    />

                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                      {isRTL ? 'شكراً لك' : 'Thank you'}
                    </h2>

                    <div className="mb-6">
                      <div
                        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: 'rgba(47, 184, 179, 0.12)' }}
                      >
                        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="#2fb8b3">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-base">
                      {question.description ?? (isRTL ? 'نشكرك على وقتك وتعاونك معنا' : 'Thank you for your time and feedback')}
                    </p>
                  </div>
                ) : null}

                {/* Country selection with thumbnails */}
                {question.id === 'country' ? (
                  renderCountryThumbnails(answers[question.id], (selected) => updateAnswer(question.id, selected), selectedLang, backdropVariant)
                ) : null}
                
                {/* Video + Options Side-by-Side Layout */}
                {question.videoUrl && question.videoPosition === 'side' ? (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Options Column */}
                    <div>
                      {question.useCardLayout && question.type === 'single' && question.id !== 'country'
                        ? renderCardOptions(question, answers[question.id], (selected) => updateAnswer(question.id, selected), () => {}, selectedLang, backdropVariant)
                        : null}

                      {question.useCardLayout && question.type === 'multi'
                        ? renderCardOptions(question, answers[question.id], () => {}, (selected) => toggleMultiAnswer(question.id, selected), selectedLang, backdropVariant)
                        : null}

                      {!question.useCardLayout && question.type === 'single' && question.id !== 'country'
                        ? renderOptions(question, answers[question.id], (selected) => updateAnswer(question.id, selected), () => {}, selectedLang, backdropVariant)
                        : null}

                      {!question.useCardLayout && question.type === 'multi' 
                        ? renderOptions(question, answers[question.id], () => {}, (selected) => toggleMultiAnswer(question.id, selected), selectedLang, backdropVariant) 
                        : null}
                    </div>
                    
                    {/* Video Column */}
                    <div className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 h-fit">
                      <video
                        className="w-full h-40 object-cover"
                        src={question.videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls
                      />
                      <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                        {selectedLang === 'ar' ? 'معاينة حية: التجربة الافتراضية قبل/بعد' : selectedLang === 'fr' ? 'Démo: aperçu avant/après essayage virtuel' : 'Demo: before/after virtual try-on preview'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Video preview on top (non-side layout) */}
                    {question.videoUrl && !question.videoPosition ? (
                      <div className="w-full mb-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                        <video
                          className="w-full h-48 object-cover"
                          src={question.videoUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          controls
                        />
                        <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                          {selectedLang === 'ar' ? 'معاينة حية: التجربة الافتراضية قبل/بعد' : selectedLang === 'fr' ? 'Démo: aperçu avant/après essayage virtuel' : 'Demo: before/after virtual try-on preview'}
                        </div>
                      </div>
                    ) : null}

                    {/* Card layout for designated questions */}
                    {question.useCardLayout && question.type === 'single' && question.id !== 'country'
                      ? renderCardOptions(question, answers[question.id], (selected) => updateAnswer(question.id, selected), () => {}, selectedLang, backdropVariant)
                      : null}

                    {question.useCardLayout && question.type === 'multi'
                      ? renderCardOptions(question, answers[question.id], () => {}, (selected) => toggleMultiAnswer(question.id, selected), selectedLang, backdropVariant)
                      : null}

                    {/* Standard list layout for non-card questions */}
                    {!question.useCardLayout && question.type === 'single' && question.id !== 'country'
                      ? renderOptions(question, answers[question.id], (selected) => updateAnswer(question.id, selected), () => {}, selectedLang, backdropVariant)
                      : null}

                    {!question.useCardLayout && question.type === 'multi' 
                      ? renderOptions(question, answers[question.id], () => {}, (selected) => toggleMultiAnswer(question.id, selected), selectedLang, backdropVariant) 
                      : null}
                  </>
                )}

                {question.type === 'scale' ? renderScale(question, answers[question.id], (selected) => updateAnswer(question.id, selected)) : null}

                {question.type === 'text' && (question.id !== 'governorate_or_city' || !needsGovernorateSelect)
                  ? renderTextField(answers[question.id], 'Type your answer...', (text) => updateAnswer(question.id, text))
                  : null}

                {question.id === 'pain_points' && shouldShowOtherPain
                  ? renderTextField(
                      answers.pain_points_other,
                      'Please describe other pain point...',
                      (text) => updateAnswer('pain_points_other', text)
                    )
                  : null}

                {question.id === 'stitching_blockers' && shouldShowOtherBlockers
                  ? renderTextField(
                      answers.stitching_blockers_other,
                      'Please describe other blocker...',
                      (text) => updateAnswer('stitching_blockers_other', text)
                    )
                  : null}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div
                  className={
                    question.type === 'info'
                      ? 'flex items-center justify-center'
                      : `flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`
                  }
                >
                  {/* Footer actions */}
                  {question.type === 'info' ? null : (
                    <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {currentStep > 0 ? (
                        <button
                          type="button"
                          onClick={onBack}
                          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                        >
                          {t.back}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={onNext}
                        className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors dark:hover:text-slate-300 dark:hover:bg-slate-800/50"
                      >
                        {t.skip}
                      </button>
                    </div>
                  )}

                  {currentStep + 1 >= totalSteps ? (
                    question.type === 'info' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSubmitting(true);
                          onSubmit();
                          onClose();
                        }}
                        disabled={isSubmitting}
                        className={`px-6 py-2.5 text-sm font-semibold rounded-xl text-white shadow-lg transition-all ${
                          !isSubmitting ? 'hover:scale-105 active:scale-95 cta-shine' : 'bg-slate-300 cursor-not-allowed shadow-none dark:bg-slate-700 dark:text-slate-500'
                        }`}
                        style={!isSubmitting ? { backgroundColor: '#2fb8b3', boxShadow: '0 4px 12px rgba(47, 184, 179, 0.2)' } : {}}
                        onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#27a7a2')}
                        onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#2fb8b3')}
                      >
                        {isSubmitting ? (isRTL ? 'جاري الإرسال...' : 'Submitting...') : (isRTL ? 'إغلاق' : 'Close')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSubmitting(true);
                          setView('thank-you');
                          // Call onSubmit after a short delay to ensure state updates
                          setTimeout(() => {
                            onSubmit();
                          }, 100);
                        }}
                        disabled={!isStepValid(question.id) || isSubmitting}
                        className={`px-6 py-2.5 text-sm font-semibold rounded-xl text-white shadow-lg transition-all ${
                          isStepValid(question.id) && !isSubmitting
                            ? 'hover:scale-105 active:scale-95 cta-shine'
                            : 'bg-slate-300 cursor-not-allowed shadow-none dark:bg-slate-700 dark:text-slate-500'
                        }`}
                        style={!isSubmitting && isStepValid(question.id) ? { backgroundColor: '#2fb8b3', boxShadow: '0 4px 12px rgba(47, 184, 179, 0.2)' } : {}}
                        onMouseEnter={(e) => !isSubmitting && isStepValid(question.id) && (e.currentTarget.style.backgroundColor = '#27a7a2')}
                        onMouseLeave={(e) => !isSubmitting && isStepValid(question.id) && (e.currentTarget.style.backgroundColor = '#2fb8b3')}
                      >
                        {isSubmitting ? (isRTL ? 'جاري الإرسال...' : 'Submitting...') : t.complete}
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={onNext}
                      disabled={!isStepValid(question.id)}
                      className={`px-6 py-2.5 text-sm font-semibold rounded-xl text-white shadow-lg transition-all ${
                        isStepValid(question.id)
                          ? 'hover:scale-105 active:scale-95 cta-shine'
                          : 'bg-slate-300 cursor-not-allowed shadow-none dark:bg-slate-700 dark:text-slate-500'
                      }`}
                      style={isStepValid(question.id) ? { backgroundColor: '#2fb8b3', boxShadow: '0 4px 12px rgba(47, 184, 179, 0.2)' } : {}}
                      onMouseEnter={(e) => isStepValid(question.id) && (e.currentTarget.style.backgroundColor = '#27a7a2')}
                      onMouseLeave={(e) => isStepValid(question.id) && (e.currentTarget.style.backgroundColor = '#2fb8b3')}
                    >
                      {t.next}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
