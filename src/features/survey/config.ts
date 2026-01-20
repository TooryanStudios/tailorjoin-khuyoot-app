export type SurveyStatus = 'in_progress' | 'completed' | 'skipped';

export type SurveyQuestionType = 'single' | 'multi' | 'scale' | 'text';

export type SurveyAnswer = string | number | string[] | null;

export type SurveyAnswers = Record<string, SurveyAnswer>;

export type SurveyOption = {
  value: string;
  label: string;
  icon?: string;
};

export type SurveyQuestion = {
  id: string;
  type: SurveyQuestionType;
  label: string;
  description?: string;
  options?: SurveyOption[];
  optional?: boolean;
  useCardLayout?: boolean;
  useTwoColumns?: boolean;
  useSmallCards?: boolean;
  useColorScale?: boolean;
  gridColumns?: number;
  videoUrl?: string;
  videoPosition?: 'top' | 'side';
};

export type SurveyStep = {
  id: string;
  questionId: string;
  showIf?: (answers: SurveyAnswers) => boolean;
};

export const SURVEY_ID = 'khuyoot_validation_v1';

export const OMAN_GOVERNORATES: SurveyOption[] = [
  { value: 'muscat', label: 'Muscat' },
  { value: 'dhofar', label: 'Dhofar' },
  { value: 'north_al_batinah', label: 'North Al Batinah' },
  { value: 'south_al_batinah', label: 'South Al Batinah' },
  { value: 'north_al_sharqiyah', label: 'North Al Sharqiyah' },
  { value: 'south_al_sharqiyah', label: 'South Al Sharqiyah' },
  { value: 'al_buraimi', label: 'Al Buraimi' },
  { value: 'ad_dakhiliyah', label: 'Ad Dakhiliyah' },
  { value: 'ad_dhahirah', label: 'Ad Dhahirah' },
  { value: 'al_wusta', label: 'Al Wusta' },
  { value: 'musandam', label: 'Musandam' },
];

export const SURVEY_QUESTIONS: Record<string, SurveyQuestion> = {
  country: {
    id: 'country',
    type: 'single',
    label: 'Which country are you in?',
    options: [
      { value: 'oman', label: 'Oman' },
      { value: 'tunisia', label: 'Tunisia' },
      { value: 'morocco', label: 'Morocco' },
      { value: 'algeria', label: 'Algeria' },
      { value: 'libya', label: 'Libya' },
      { value: 'other', label: 'Other' },
    ],
  },
  device_type: {
    id: 'device_type',
    type: 'single',
    label: '📱 Which device are you using?',
    useCardLayout: true,
    gridColumns: 3,
    options: [
      { value: 'mobile', label: '📲 Mobile', icon: '📲' },
      { value: 'desktop', label: '💻 Desktop', icon: '💻' },
      { value: 'ipad', label: '📱 iPad', icon: '📱' },
    ],
  },
  stitch_frequency: {
    id: 'stitch_frequency',
    type: 'single',
    label: '📅 How frequently do you stitch clothes per year?',
    useTwoColumns: true,
    options: [
      { value: 'monthly', label: '🔄 Monthly' },
      { value: 'every_2_3_months', label: '⏰ Every 2–3 months' },
      { value: '2_4_yearly', label: '🗓️ 2–4 times per year' },
      { value: 'rarely', label: '🌙 Rarely' },
      { value: 'never', label: '❌ Never' },
    ],
  },
  stitch_spend_range: {
    id: 'stitch_spend_range',
    type: 'single',
    label: '💰 How much do you usually spend on stitching?',
    useCardLayout: true,
    options: [
      { value: '30_100', label: '💵 30–100 {{CURRENCY}}', icon: '💵' },
      { value: '100_200', label: '💳 100–200 {{CURRENCY}}', icon: '💳' },
      { value: '200_plus', label: '💎 200+ {{CURRENCY}}', icon: '💎' },
      { value: 'not_sure', label: '🤷 Not sure', icon: '🤷' },
    ],
  },
  spend_per_outfit: {
    id: 'spend_per_outfit',
    type: 'single',
    label: '👔 How much do you spend per outfit?',
    options: [
      { value: 'under_30', label: '💵 Under 30 {{CURRENCY}}' },
      { value: '30_60', label: '💵 30–60 {{CURRENCY}}' },
      { value: '60_120', label: '💳 60–120 {{CURRENCY}}' },
      { value: '120_200', label: '💎 120–200 {{CURRENCY}}' },
      { value: '200_plus', label: '💎 200+ {{CURRENCY}}' },
      { value: 'not_sure', label: '🤷 Not sure' },
    ],
  },
  platform_usefulness: {
    id: 'platform_usefulness',
    type: 'scale',
    label: '⭐ How useful would a platform combining fabrics, virtual try-on, and tailors be?',
    description: '1 = Not useful, 5 = Extremely useful',
    useColorScale: true,
    options: Array.from({ length: 5 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
  },
  tryon_usefulness: {
    id: 'tryon_usefulness',
    type: 'single',
    label: '🪞 Is virtual try-on useful for you?',
    useCardLayout: true,
    gridColumns: 3,
    videoUrl: '/videos/designer/Comparison_01.mp4',
    videoPosition: 'top',
    options: [
      { value: 'very_useful', label: '✅ Very useful' },
      { value: 'somewhat_useful', label: '🤔 Somewhat useful' },
      { value: 'not_useful', label: '❌ Not useful' },
    ],
  },
  tryon_where: {
    id: 'tryon_where',
    type: 'multi',
    label: '📍 Where would you like to use virtual try-on?',
    useTwoColumns: true,
    useCardLayout: true,
    gridColumns: 2,
    options: [
      { value: 'at_home', label: '🏠 At home' },
      { value: 'in_store', label: '🛍️ In store' },
      { value: 'at_tailor', label: '✂️ At tailor' },
      { value: 'anywhere', label: '🌍 Anywhere' },
    ],
  },
  pain_points: {
    id: 'pain_points',
    type: 'multi',
    label: '❗ What are your biggest challenges in clothing tailoring?',
    useTwoColumns: true,
    useCardLayout: false,
    gridColumns: 2,
    options: [
      { value: 'choosing_fabric', label: '🧵 Choosing fabric' },
      { value: 'visualizing', label: '👁️ Visualizing the final look' },
      { value: 'quality', label: '⭐ Quality' },
      { value: 'measurement', label: '📏 Measurement issues' },
      { value: 'time', label: '⏱️ Time' },
      { value: 'unclear_price', label: '💸 Unclear price' },
      { value: 'delivery', label: '🚚 Delivery' },
      { value: 'finding_tailor', label: '🔍 Finding a tailor' },
      { value: 'other', label: '💭 Other' },
    ],
  },
  pain_points_other: {
    id: 'pain_points_other',
    type: 'text',
    label: 'Tell us more (optional)',
    optional: true,
  },
  stitching_location: {
    id: 'stitching_location',
    type: 'single',
    label: '📍 Where do you prefer to stitch?',
    useCardLayout: true,
    gridColumns: 3,
    options: [
      { value: 'nearby', label: '🏘️ Nearby shops', icon: '🏘️' },
      { value: 'trusted', label: '⭐ Trusted familiar shop', icon: '⭐' },
      { value: 'anywhere', label: '🌍 Anywhere convenient', icon: '🌍' },
    ],
  },
  stitching_motivation: {
    id: 'stitching_motivation',
    type: 'multi',
    label: '💡 What motivates you to choose stitching?',
    useCardLayout: true,
    gridColumns: 3,
    options: [
      { value: 'recommendations', label: '👥 Recommendations', icon: '👥' },
      { value: 'trending', label: '🔥 Trends', icon: '🔥' },
      { value: 'own_experience', label: '✨ Own experience', icon: '✨' },
      { value: 'price', label: '💰 Price', icon: '💰' },
    ],
  },
  fabric_purchase_preference: {
    id: 'fabric_purchase_preference',
    type: 'single',
    label: '🛒 How do you prefer to buy fabrics?',
    useCardLayout: true,
    gridColumns: 3,
    options: [
      { value: 'online', label: '💻 Online', icon: '💻' },
      { value: 'in_person', label: '🤝 In person', icon: '🤝' },
      { value: 'both', label: '🔄 Both', icon: '🔄' },
    ],
  },
  measurement_method: {
    id: 'measurement_method',
    type: 'single',
    label: '📏 How do you usually take measurements?',
    useCardLayout: true,
    gridColumns: 3,
    options: [
      { value: 'self', label: '🙋 Self-measured', icon: '🙋' },
      { value: 'family', label: '👨‍👩‍👧 Family/friend', icon: '👨‍👩‍👧' },
      { value: 'expert', label: '✂️ Tailor/expert', icon: '✂️' },
    ],
  },
  willing_to_pay_tryon: {
    id: 'willing_to_pay_tryon',
    type: 'single',
    label: '💳 Would you pay for virtual try-on?',
    useCardLayout: true,
    gridColumns: 3,
    options: [
      { value: 'yes', label: '✅ Yes', icon: '✅' },
      { value: 'maybe', label: '🤔 Maybe', icon: '🤔' },
      { value: 'no', label: '❌ No', icon: '❌' },
    ],
  },
  tryon_fee_range: {
    id: 'tryon_fee_range',
    type: 'single',
    label: 'Preferred try-on fee range (optional)',
    optional: true,
    options: [
      { value: 'free_only', label: 'Free only' },
      { value: 'low', label: '1–3 {{CURRENCY}}' },
      { value: 'mid', label: '3–6 {{CURRENCY}}' },
      { value: 'high', label: '6+ {{CURRENCY}}' },
      { value: 'included', label: 'Included with purchase' },
    ],
  },
  privacy_concern: {
    id: 'privacy_concern',
    type: 'single',
    label: '🔒 Do you mind uploading your personal photo if we provide face removal?',
    videoUrl: '/videos/designer/Comparison_01.mp4',
    useCardLayout: true,
    gridColumns: 3,
    options: [
      { value: 'comfortable', label: '✅ No problem', icon: '✅' },
      { value: 'hesitant', label: '🤔 Unsure', icon: '🤔' },
      { value: 'not_comfortable', label: '❌ Prefer not', icon: '❌' },
    ],
  },
  open_feedback: {
    id: 'open_feedback',
    type: 'text',
    label: 'Any other thoughts? (optional)',
    optional: true,
  },
};

export const isAnswerEmpty = (value: SurveyAnswer): boolean => {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'string') return value.trim().length === 0;
  return false;
};

export const isOmanSelected = (answers: SurveyAnswers): boolean => answers.country === 'oman';

export const shouldShowPainPointsOther = (answers: SurveyAnswers): boolean => {
  const painPoints = answers.pain_points;
  return Array.isArray(painPoints) && painPoints.includes('other');
};

export const shouldShowStitchingBlockersOther = (answers: SurveyAnswers): boolean => {
  const blockers = answers.stitching_blockers;
  return Array.isArray(blockers) && blockers.includes('other');
};

export const SURVEY_STEPS: SurveyStep[] = [
  { id: 'country', questionId: 'country' },
  { id: 'device_type', questionId: 'device_type' },
  { id: 'stitch_frequency', questionId: 'stitch_frequency' },
  { id: 'stitch_spend_range', questionId: 'stitch_spend_range' },
  { id: 'spend_per_outfit', questionId: 'spend_per_outfit' },
  { id: 'platform_usefulness', questionId: 'platform_usefulness' },
  { id: 'tryon_usefulness', questionId: 'tryon_usefulness' },
  { id: 'tryon_where', questionId: 'tryon_where' },
  { id: 'pain_points', questionId: 'pain_points' },
  { id: 'pain_points_other', questionId: 'pain_points_other', showIf: shouldShowPainPointsOther },
  { id: 'stitching_location', questionId: 'stitching_location' },
  { id: 'stitching_motivation', questionId: 'stitching_motivation' },
  { id: 'fabric_purchase_preference', questionId: 'fabric_purchase_preference' },
  { id: 'measurement_method', questionId: 'measurement_method' },
  { id: 'willing_to_pay_tryon', questionId: 'willing_to_pay_tryon' },
  {
    id: 'tryon_fee_range',
    questionId: 'tryon_fee_range',
    showIf: (answers) => answers.willing_to_pay_tryon === 'yes' || answers.willing_to_pay_tryon === 'maybe',
  },
  { id: 'privacy_concern', questionId: 'privacy_concern' },
  { id: 'open_feedback', questionId: 'open_feedback' },
];

export const getVisibleSteps = (answers: SurveyAnswers, hiddenQuestionIds: string[] = []): SurveyStep[] =>
  SURVEY_STEPS.filter((step) => !hiddenQuestionIds.includes(step.questionId))
    .filter((step) => (step.showIf ? step.showIf(answers) : true));


