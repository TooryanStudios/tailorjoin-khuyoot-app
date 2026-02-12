import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { PlayCircle, Save, ArrowLeft, Ruler, Check, ChevronLeft, Loader2, Trash2 } from 'lucide-react';
import DebugPanel from '../components/DebugPanel';
import { useApp } from '../context/AppContext';
import { firebaseService } from '../services/firebase';
import { MeasurementProfile, MeasurementTemplate } from '../types';

// ==================== TYPES ====================
interface Measurements {
  neck: string;
  chest: string;
  shoulder: string;
  sleeve: string;
  length: string;
  waist: string;
  thigh: string;
  shoe: string;
}

type MeasurementPayload = MeasurementProfile & { measurements?: Record<string, any> };

interface LocationState {
  customizationId?: string;
  customizationData?: any;
  measurementId?: string;
  measurementData?: MeasurementPayload;
  measurementSaved?: boolean;
  productId?: string;
  from?: string;
}

// ==================== CONSTANTS ====================
// Measurement fields by garment type
const MEASUREMENT_FIELDS_BY_TYPE: Record<string, Array<{ key: string; label: string; icon: string }>> = {
  abaya: [
    { key: 'length', label: 'الطول الكلي', icon: '📍' },
    { key: 'shoulder', label: 'الكتف', icon: '📍' },
    { key: 'chest', label: 'الصدر', icon: '📍' },
    { key: 'waist', label: 'الخصر', icon: '📍' },
    { key: 'sleeve', label: 'طول الكم', icon: '📍' },
    { key: 'armhole', label: 'حجر الإبط', icon: '📍' }
  ],
  dress: [
    { key: 'length', label: 'الطول', icon: '📍' },
    { key: 'chest', label: 'الصدر', icon: '📍' },
    { key: 'waist', label: 'الخصر', icon: '📍' },
    { key: 'hips', label: 'الأرداف', icon: '📍' },
    { key: 'shoulder', label: 'الكتف', icon: '📍' },
    { key: 'sleeve', label: 'طول الكم', icon: '📍' }
  ],
  thobe: [
    { key: 'length', label: 'الطول', icon: '📍' },
    { key: 'shoulder', label: 'الكتف', icon: '📍' },
    { key: 'chest', label: 'الصدر', icon: '📍' },
    { key: 'waist', label: 'الخصر', icon: '📍' },
    { key: 'sleeve', label: 'كم اليد', icon: '📍' },
    { key: 'neck', label: 'الرقبة', icon: '📍' }
  ],
  jalabia: [
    { key: 'length', label: 'الطول', icon: '📍' },
    { key: 'shoulder', label: 'الكتف', icon: '📍' },
    { key: 'chest', label: 'الصدر', icon: '📍' },
    { key: 'waist', label: 'الخصر', icon: '📍' },
    { key: 'sleeve', label: 'الكم', icon: '📍' }
  ],
  shirt: [
    { key: 'neck', label: 'الرقبة', icon: '📍' },
    { key: 'chest', label: 'الصدر', icon: '📍' },
    { key: 'waist', label: 'الخصر', icon: '📍' },
    { key: 'sleeve', label: 'طول الكم', icon: '📍' },
    { key: 'shoulder', label: 'الكتف', icon: '📍' },
    { key: 'length', label: 'الطول', icon: '📍' }
  ],
  other: [
    { key: 'neck', label: 'الرقبة', icon: '🔹' },
    { key: 'shoulder', label: 'الكتف', icon: '🔹' },
    { key: 'chest', label: 'الصدر', icon: '🔹' },
    { key: 'waist', label: 'الخصر', icon: '🔹' },
    { key: 'sleeve', label: 'الكم', icon: '🔹' },
    { key: 'length', label: 'الطول', icon: '🔹' },
    { key: 'thigh', label: 'الفخذ', icon: '🔹' },
    { key: 'shoe', label: 'المقاس (الحذاء)', icon: '🔹' }
  ]
};

// Map model IDs to garment types
const MODEL_TO_GARMENT_TYPE: Record<string, string> = {
  'abaya-classic': 'abaya',
  'abaya-modern': 'abaya',
  'dress-elegant': 'dress',
  'dress-casual': 'dress',
  'thobe-formal': 'thobe',
  'jalabia-gulf': 'jalabia',
  'shirt-casual': 'shirt'
};

const MEASUREMENT_FIELDS = [
  { key: 'neck', label: 'الرقبة', icon: '🔹' },
  { key: 'shoulder', label: 'الكتف', icon: '🔹' },
  { key: 'chest', label: 'الصدر', icon: '🔹' },
  { key: 'waist', label: 'الخصر', icon: '🔹' },
  { key: 'sleeve', label: 'الكم', icon: '🔹' },
  { key: 'length', label: 'الطول', icon: '🔹' },
  { key: 'thigh', label: 'الفخذ', icon: '🔹' },
  { key: 'shoe', label: 'المقاس (الحذاء)', icon: '🔹' }
] as const;

const MEASUREMENT_MARKERS = [
  { key: 'neck', label: 'الرقبة', top: '12%', left: '50%', number: 1 },
  { key: 'shoulder', label: 'الكتف', top: '20%', left: '30%', number: 2 },
  { key: 'chest', label: 'الصدر', top: '28%', left: '72%', number: 3 },
  { key: 'waist', label: 'الخصر', top: '42%', left: '52%', number: 4 },
  { key: 'sleeve', label: 'الكم', top: '34%', left: '20%', number: 5 },
  { key: 'length', label: 'الطول', top: '68%', left: '55%', number: 6 },
  { key: 'thigh', label: 'الفخذ', top: '62%', left: '78%', number: 7 },
  { key: 'shoe', label: 'المقاس', top: '88%', left: '40%', number: 8 },
] as const;

const DEFAULT_HELP_VIDEO_URL = 'https://www.youtube.com/watch?v=6eZtn5Du8O4';

// ==================== MAIN COMPONENT ====================
export const ClientMeasurements = () => {
  const { user, appSettings } = useApp();

  // Debug: Log appSettings to verify it's loaded
  useEffect(() => {
    console.log('[ClientMeasurements] appSettings loaded:', appSettings);
    console.log('[ClientMeasurements] helpVideo config:', appSettings?.helpVideo);
  }, [appSettings]);

  // Normalize help video URL to an embeddable format (e.g., YouTube)
  const getEmbedUrl = (rawUrl?: string) => {
    if (!rawUrl) return '';
    try {
      const u = new URL(rawUrl);
      // Handle youtu.be short links
      if (u.hostname.includes('youtu.be')) {
        const videoId = u.pathname.replace('/', '');
        if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}`;
      }
      // Handle youtube watch links
      if (u.hostname.includes('youtube.com')) {
        if (u.pathname === '/watch') {
          const v = u.searchParams.get('v');
          if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
        }
        // Already an embed
        if (u.pathname.startsWith('/embed/')) {
          // Switch to nocookie domain for better embed compatibility
          const parts = u.pathname.split('/');
          const id = parts[2] || '';
          if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
          return rawUrl;
        }
      }
      // Otherwise, return as-is
      return rawUrl;
    } catch {
      return '';
    }
  };

  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const { productId } = useParams<{ productId?: string }>();

  // State
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [savedMeasurements, setSavedMeasurements] = useState<MeasurementProfile[]>([]);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [activeMeasurement, setActiveMeasurement] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [garmentType, setGarmentType] = useState<string>('other');
  const [measurementFields, setMeasurementFields] = useState(MEASUREMENT_FIELDS);
  const [productData, setProductData] = useState<any>(null);
  const [relevantMeasurements, setRelevantMeasurements] = useState<MeasurementProfile[]>([]);
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);
  const [matchedTemplate, setMatchedTemplate] = useState<MeasurementTemplate | null>(null);
  const [dynamicMeasurementFields, setDynamicMeasurementFields] = useState<Array<{ key: string; label: string; icon: string }>>(MEASUREMENT_FIELDS);
  const [showInputModal, setShowInputModal] = useState(false);
  const [modalPointKey, setModalPointKey] = useState<string>('');
  const [modalPointLabel, setModalPointLabel] = useState<string>('');
  const [modalInputValue, setModalInputValue] = useState<string>('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [savePromptName, setSavePromptName] = useState('');
  const [pendingProfile, setPendingProfile] = useState<MeasurementProfile | null>(null);
  const [hasManualChanges, setHasManualChanges] = useState(false);
  const [savePromptContext, setSavePromptContext] = useState<'saveOnly' | 'continue' | null>(null);
  const [savePromptMode, setSavePromptMode] = useState<'new' | 'update'>('new');
  const [pendingUpdateTargetId, setPendingUpdateTargetId] = useState<string | null>(null);
  const [isTemplateSaving, setIsTemplateSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [allowPromptUpdate, setAllowPromptUpdate] = useState(true);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [isHelpVideoVisible, setIsHelpVideoVisible] = useState(false);

  const measurementRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const appliedMeasurementRef = useRef<string | null>(null);
  const draftKey = useMemo(() => {
    const uid = user?.id || 'guest';
    const pid = productId || state?.customizationId || 'global';
    return `cm_draft_${uid}_${pid}`;
  }, [user?.id, productId, state?.customizationId]);
  const selectedProfile = useMemo(
    () => savedMeasurements.find(profile => profile.id === selectedProfileId) || null,
    [savedMeasurements, selectedProfileId]
  );
  const helpVideoRawUrl = appSettings?.helpVideo?.url || DEFAULT_HELP_VIDEO_URL;
  const matchingVideoEmbedUrl = useMemo(() => {
    const templateVideo = (matchedTemplate as any)?.matchingVideoUrl || (matchedTemplate as any)?.videoUrl || (matchedTemplate as any)?.tutorialVideoUrl;
    const productVideo = (productData as any)?.measurementVideoUrl || (productData as any)?.tutorialVideoUrl || (productData as any)?.videoUrl;
    const settingsVideo = appSettings?.matchingMeasurementsVideoUrl;
    const rawUrl = templateVideo || productVideo || settingsVideo || '';
    if (!rawUrl) return '';
    return getEmbedUrl(rawUrl);
  }, [matchedTemplate, productData, appSettings]);
  const pendingMetricsEntries = useMemo(
    () => {
      if (!pendingProfile) return [] as Array<[string, number]>;
      return Object.entries(pendingProfile.metrics || {})
        .filter(([, value]) => typeof value === 'number' && value > 0) as Array<[string, number]>;
    },
    [pendingProfile]
  );
  const helpVideoEmbedUrl = useMemo(() => getEmbedUrl(helpVideoRawUrl), [helpVideoRawUrl]);
  const canUpdateExisting = allowPromptUpdate && Boolean(pendingUpdateTargetId);
  const effectiveVideoUrl = (matchingVideoEmbedUrl || helpVideoEmbedUrl) || '';

  // Persist drafts whenever measurements or selection changes
  useEffect(() => {
    try {
      const payload = {
        measurements,
        selectedProfileId,
      };
      localStorage.setItem(draftKey, JSON.stringify(payload));
    } catch {}
  }, [draftKey, measurements, selectedProfileId]);

  // ==================== EFFECTS ====================
  // Load product data if productId exists
  useEffect(() => {
    const loadProductData = async () => {
      if (!productId) {
        console.log('[DEBUG] No productId, skipping product load');
        return;
      }
      
      console.log('[DEBUG] Loading product data for productId:', productId);
      try {
        const product = await firebaseService.getProduct(productId);
        if (product) {
          console.log('[DEBUG] Product loaded:', product);
          setProductData(product);
          
          // Determine garment type from product
          const type = product.category?.toLowerCase() || 'other';
          console.log('[DEBUG] Setting garment type from product:', type);
          setGarmentType(type);
          
          // Set measurement fields based on product type
          const fields = MEASUREMENT_FIELDS_BY_TYPE[type] || MEASUREMENT_FIELDS;
          console.log('[DEBUG] Setting measurement fields for type:', type, fields);
          setMeasurementFields(fields as any);
        } else {
          console.log('[DEBUG] Product not found');
        }
      } catch (error) {
        console.error('[DEBUG] Error loading product:', error);
      }
    };
    
    loadProductData();
  }, [productId]);

  // Load measurement templates once
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsTemplatesLoading(true);
        const data = await firebaseService.getMeasurementTemplates();
        setTemplates(data || []);
        console.log('[DEBUG] ClientMeasurements templates loaded:', data?.length || 0);
      } catch (e) {
        console.warn('[DEBUG] Failed to load measurement templates:', e);
      } finally {
        setIsTemplatesLoading(false);
      }
    };
    loadTemplates();
  }, []);

  // Match template by strict rule: Template.id === Product.categoryId
  useEffect(() => {
    const categoryId = productData?.categoryId;
    if (!categoryId || templates.length === 0) {
      setMatchedTemplate(null);
      return;
    }
    const match = templates.find(t => t.id === categoryId) || null;
    setMatchedTemplate(match);
    if (match) console.log('[DEBUG] Matched template for categoryId', categoryId, '=>', match.id);

    // Update measurement fields based on matched template points
    if (match && match.points && match.points.length > 0) {
      const templateFields = match.points.map((point, index) => ({
        key: point.name || `point_${index}`,
        label: point.label || point.name || `نقطة ${index + 1}`,
        icon: '📍'
      }));
      setDynamicMeasurementFields(templateFields);
      console.log('[DEBUG] Updated measurement fields from template:', templateFields.length, 'points');
      
      // Initialize measurements state with empty values for all template points
      const newMeasurements: any = {};
      templateFields.forEach(field => {
        newMeasurements[field.key] = '';
      });
      setMeasurements(prev => ({ ...prev, ...newMeasurements }));
    } else {
      setDynamicMeasurementFields(MEASUREMENT_FIELDS);
    }
  }, [productData?.categoryId, templates]);

  useEffect(() => {
    console.log('[DEBUG] useEffect [user] triggered:', user ? user.id : 'no user');
    if (user) {
      loadSavedMeasurements();
    }
  }, [user]);

  // Filter measurements that match the current garment type
  useEffect(() => {
    if (savedMeasurements.length > 0 && garmentType !== 'other') {
      const matching = savedMeasurements.filter(m => m.type === garmentType);
      console.log('[DEBUG] Filtering measurements for garmentType:', garmentType);
      console.log('[DEBUG] Found matching measurements:', matching.length);
      setRelevantMeasurements(matching);
    } else {
      setRelevantMeasurements(savedMeasurements);
    }
  }, [savedMeasurements, garmentType]);

  // Derive garment type from customizationData and set fields (fallback if no productId)
  useEffect(() => {
    // Skip if we already have productData (from productId)
    if (productData) {
      console.log('[DEBUG] Skipping customizationData check, using productData');
      return;
    }
    
    const modelId = state?.customizationData?.modelId;
    console.log('[DEBUG] Route state:', state);
    console.log('[DEBUG] customizationData.modelId:', modelId);
    const derivedType = modelId ? (MODEL_TO_GARMENT_TYPE[modelId] || 'other') : 'other';
    console.log('[DEBUG] Derived garmentType from modelId:', derivedType);
    setGarmentType(derivedType);
    const fields = MEASUREMENT_FIELDS_BY_TYPE[derivedType] || MEASUREMENT_FIELDS;
    console.log('[DEBUG] Applying measurement fields:', fields.map(f => f.key));
    setMeasurementFields(fields as any);
  }, [state?.customizationData?.modelId, productData]);

  useEffect(() => {
    console.log('[DEBUG] Component mounted with state:', state);
    console.log('[DEBUG] CustomizationId:', state?.customizationId);
    console.log('[DEBUG] CustomizationData:', state?.customizationData);
    
    // Determine garment type from customization data
    if (state?.customizationData?.modelId) {
      const modelId = state.customizationData.modelId;
      const type = MODEL_TO_GARMENT_TYPE[modelId] || 'other';
      console.log('[DEBUG] Detected garment type:', type, 'from model:', modelId);
      setGarmentType(type);
      
      // Set appropriate measurement fields
      const fields = MEASUREMENT_FIELDS_BY_TYPE[type] || MEASUREMENT_FIELDS;
      console.log('[DEBUG] Using measurement fields:', fields);
      setMeasurementFields(fields);
    }
  }, []);

  // ==================== FUNCTIONS ====================
  const loadSavedMeasurements = async () => {
    if (!user) {
      console.log('[DEBUG] loadSavedMeasurements: No user found');
      return;
    }
    
    console.log('[DEBUG] loadSavedMeasurements: Starting...', { userId: user.id });
    setIsLoading(true);
    try {
      // Try Firebase first
      console.log('[DEBUG] Fetching from Firebase...');
      const profiles = await firebaseService.getMeasurements(user.id);
      console.log('[DEBUG] Firebase returned:', profiles.length, 'measurements');
      
      // Remove duplicates by ID
      const uniqueProfiles = Array.from(
        new Map(profiles.map(item => [item.id, item])).values()
      );
      console.log('[DEBUG] After removing duplicates:', uniqueProfiles.length, 'unique measurements');
      
      if (uniqueProfiles.length > 0) {
        console.log('[DEBUG] Setting measurements from Firebase:', uniqueProfiles);
        setSavedMeasurements(uniqueProfiles);
        // Sync to localStorage as backup
        localStorage.setItem(`measurements_${user.id}`, JSON.stringify(uniqueProfiles));
        console.log('[DEBUG] Synced to localStorage');
      } else {
        // Fallback to localStorage
        console.log('[DEBUG] No Firebase data, checking localStorage...');
        const localData = localStorage.getItem(`measurements_${user.id}`);
        if (localData) {
          const parsed = JSON.parse(localData);
          // Remove duplicates from localStorage too
          const uniqueParsed = Array.from(
            new Map(parsed.map((item: any) => [item.id, item])).values()
          );
          console.log('[DEBUG] Found in localStorage:', parsed.length, 'measurements');
          console.log('[DEBUG] After deduplication:', uniqueParsed.length, 'unique measurements');
          setSavedMeasurements(uniqueParsed);
          // Save cleaned data back
          if (parsed.length !== uniqueParsed.length) {
            localStorage.setItem(`measurements_${user.id}`, JSON.stringify(uniqueParsed));
            console.log('[DEBUG] Cleaned localStorage duplicates');
          }
        } else {
          console.log('[DEBUG] No measurements found anywhere');
        }
      }
    } catch (error) {
      console.error('[DEBUG] ❌ Error loading measurements from Firebase:', error);
      // Try localStorage on error
      try {
        console.log('[DEBUG] Attempting localStorage fallback...');
        const localData = localStorage.getItem(`measurements_${user.id}`);
        if (localData) {
          const parsed = JSON.parse(localData);
          console.log('[DEBUG] ✅ Loaded from localStorage:', parsed.length, 'measurements');
          setSavedMeasurements(parsed);
        } else {
          console.log('[DEBUG] No localStorage data found');
        }
      } catch (e) {
        console.error('[DEBUG] ❌ Error loading from localStorage:', e);
      }
    } finally {
      console.log('[DEBUG] loadSavedMeasurements: Complete');
      setIsLoading(false);
    }
  };

  const handleMeasurementChange = (field: string, value: string) => {
    console.log('[DEBUG] handleMeasurementChange:', { field, value });
    setMeasurements(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      console.log('[DEBUG] Updated measurements:', updated);
      return updated;
    });
    if (selectedProfileId && !hasManualChanges) {
      setHasManualChanges(true);
    }
    if (saveFeedback) {
      setSaveFeedback(null);
    }
  };

  const handlePointClick = (pointKey: string, pointLabel: string) => {
    setModalPointKey(pointKey);
    setModalPointLabel(pointLabel);
    setModalInputValue(measurements[pointKey] || '');
    setShowInputModal(true);
  };

  const handleModalSave = () => {
    handleMeasurementChange(modalPointKey, modalInputValue);
    setShowInputModal(false);
    setModalInputValue('');
  };

  const handleUseSavedMeasurements = (profile: MeasurementProfile) => {
    console.log('[DEBUG] Using saved measurement:', profile);
    const newMeasurements: Record<string, string> = {};
    
    // Map saved metrics to current dynamic fields
    dynamicMeasurementFields.forEach(field => {
      const metricValue = (profile.metrics as any)[field.key];
      newMeasurements[field.key] = metricValue?.toString() || '';
    });
    
    console.log('[DEBUG] Converted to form measurements:', newMeasurements);
    setMeasurements(newMeasurements);
    setSelectedProfileId(profile.id || null);
    setPendingUpdateTargetId(profile.id || null);
    setHasManualChanges(false);
    setSaveFeedback(null);
    setShowMeasurementsModal(false);
  };

  const collectCurrentMetrics = useCallback(() => {
    const metrics: Record<string, number> = {};
    dynamicMeasurementFields.forEach(field => {
      const numericValue = parseFloat(measurements[field.key]);
      metrics[field.key] = Number.isNaN(numericValue) ? 0 : numericValue;
    });
    return metrics;
  }, [dynamicMeasurementFields, measurements]);

  const buildMeasurementProfile = (
    metrics: Record<string, number>,
    overrides?: Partial<MeasurementProfile>
  ): MeasurementProfile => {
    const baseName = overrides?.name || productData?.name || state?.customizationData?.modelName || `مقاس ${garmentType}`;
    const defaultName = baseName || `مقاس ${new Date().toLocaleDateString('ar-SA')}`;
    const now = new Date().toISOString();

    return {
      id: overrides?.id ?? '',
      userId: user?.id || overrides?.userId || 'guest',
      name: overrides?.name || defaultName,
      type: (overrides?.type as MeasurementProfile['type']) || (garmentType as any),
      metrics: metrics as any,
      notes: overrides?.notes ?? (state?.customizationId ? `من التخصيص: ${state.customizationId}` : ''),
      createdAt: overrides?.createdAt || now,
      updatedAt: now
    };
  };

  const openSavePrompt = (
    context: 'saveOnly' | 'continue',
    options?: { initialMode?: 'new' | 'update'; allowUpdate?: boolean }
  ) => {
    const metrics = collectCurrentMetrics();
    const hasData = Object.values(metrics).some(value => (value as number) > 0);
    if (!hasData) {
      alert('يرجى إدخال المقاسات قبل الحفظ.');
      return false;
    }

    const overrides = selectedProfile
      ? {
          id: selectedProfile.id,
          name: selectedProfile.name,
          createdAt: selectedProfile.createdAt,
          userId: selectedProfile.userId,
          notes: selectedProfile.notes,
          type: selectedProfile.type
        }
      : undefined;

    const allowUpdate = options?.allowUpdate ?? Boolean(overrides?.id);
    const initialMode: 'new' | 'update' = options?.initialMode
      ? options.initialMode
      : allowUpdate && overrides?.id
        ? 'update'
        : 'new';

    const profileOverrides = overrides
      ? {
          name: overrides.name,
          type: overrides.type,
          notes: overrides.notes,
          userId: overrides.userId,
          ...(allowUpdate && initialMode === 'update' && overrides.id
            ? { id: overrides.id, createdAt: overrides.createdAt }
            : {})
        }
      : undefined;

    const profile = buildMeasurementProfile(metrics, profileOverrides);
    setPendingProfile(profile);
    setSavePromptName(profile.name || '');
    setSavePromptContext(context);
    setAllowPromptUpdate(allowUpdate);
    setPendingUpdateTargetId(allowUpdate && initialMode === 'update' ? overrides?.id || null : null);
    setSavePromptMode(initialMode);
    setSaveFeedback(null);
    setShowSavePrompt(true);
    return true;
  };

  const saveTemplate = async (
    profile: MeasurementProfile,
    mode: 'new' | 'update',
    targetId: string | null,
    context: 'saveOnly' | 'continue'
  ) => {
    console.log('[DEBUG] saveTemplate called:', { mode, targetId, profile });
    setIsTemplateSaving(true);
    const now = new Date().toISOString();
    const effectiveTargetId = mode === 'update' && targetId ? targetId : null;
    const existingProfile = effectiveTargetId
      ? savedMeasurements.find(item => item.id === effectiveTargetId)
      : null;

    let finalProfile: MeasurementProfile = {
      ...(existingProfile || {}),
      ...profile,
      id: effectiveTargetId || profile.id || '',
      userId: user?.id || existingProfile?.userId || profile.userId || 'guest',
      type: (profile.type as MeasurementProfile['type']) || existingProfile?.type || (garmentType as any),
      createdAt: existingProfile?.createdAt || profile.createdAt || now,
      updatedAt: now,
      metrics: profile.metrics,
      name: profile.name
    };

    try {
      if (user?.id) {
        if (mode === 'update' && effectiveTargetId) {
          finalProfile = { ...finalProfile, id: effectiveTargetId };
          await firebaseService.saveMeasurement(finalProfile);
        } else {
          const savedId = await firebaseService.saveMeasurement({ ...finalProfile, id: '' });
          finalProfile = { ...finalProfile, id: savedId };
        }

        setSavedMeasurements(prev => {
          const filtered = prev.filter(item => item.id !== finalProfile.id);
          const updated = [...filtered, finalProfile];
          localStorage.setItem(`measurements_${user.id}`, JSON.stringify(updated));
          return updated;
        });
      } else {
        const guestKey = 'guest_measurements';
        const existingGuest = JSON.parse(localStorage.getItem(guestKey) || '[]');
        if (!finalProfile.id) {
          finalProfile = { ...finalProfile, id: `guest_${Date.now()}` };
        }
        const filteredGuest = existingGuest.filter((item: MeasurementProfile) => item.id !== finalProfile.id);
        localStorage.setItem(guestKey, JSON.stringify([...filteredGuest, finalProfile]));
        setSavedMeasurements(prev => {
          const filtered = prev.filter(item => item.id !== finalProfile.id);
          return [...filtered, finalProfile];
        });
      }

      setSelectedProfileId(finalProfile.id || null);
      setPendingUpdateTargetId(finalProfile.id || null);
      setHasManualChanges(false);

      const successMessage = mode === 'update'
        ? `تم تحديث القالب "${finalProfile.name}" بنجاح.`
        : `تم إنشاء قالب جديد "${finalProfile.name}" بنجاح.`;
      setSaveFeedback(
        context === 'continue'
          ? `${successMessage} يمكنك الآن مراجعة القياسات قبل المتابعة.`
          : successMessage
      );

      return finalProfile;
    } catch (error) {
      console.error('[DEBUG] ❌ Error saving template:', error);
      const fallbackId = effectiveTargetId || finalProfile.id || `local_${Date.now()}`;
      const fallbackProfile = { ...finalProfile, id: fallbackId };

      try {
        if (user?.id) {
          const localKey = `measurements_${user.id}`;
          const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
          const filtered = existing.filter((item: MeasurementProfile) => item.id !== fallbackProfile.id);
          localStorage.setItem(localKey, JSON.stringify([...filtered, fallbackProfile]));
        } else {
          const guestKey = 'guest_measurements';
          const existingGuest = JSON.parse(localStorage.getItem(guestKey) || '[]');
          const filteredGuest = existingGuest.filter((item: MeasurementProfile) => item.id !== fallbackProfile.id);
          localStorage.setItem(guestKey, JSON.stringify([...filteredGuest, fallbackProfile]));
        }

        setSavedMeasurements(prev => {
          const filtered = prev.filter(item => item.id !== fallbackProfile.id);
          return [...filtered, fallbackProfile];
        });

        setSelectedProfileId(fallbackProfile.id || null);
        setPendingUpdateTargetId(fallbackProfile.id || null);
        setHasManualChanges(false);

        const fallbackMessage = 'تعذر حفظ القالب على الخادم، تم حفظه محلياً مؤقتاً.';
        setSaveFeedback(
          context === 'continue'
            ? `${fallbackMessage} راجع القياسات قبل المتابعة.`
            : fallbackMessage
        );
        alert('تعذر حفظ القالب على الخادم، تم حفظه محلياً مؤقتاً.');
        return fallbackProfile;
      } catch (localError) {
        console.error('[DEBUG] ❌ Failed to store template locally:', localError);
        alert('حدث خطأ أثناء حفظ القالب. يرجى المحاولة مرة أخرى.');
        throw localError;
      }
    } finally {
      setIsTemplateSaving(false);
    }
  };

  const continueToSummary = (
    profile: MeasurementProfile,
    options?: { measurementId?: string; measurementSaved?: boolean }
  ) => {
    setIsSaving(true);
    const measurementId = options?.measurementId || profile.id || `temp_${Date.now()}`;
    const finalProfile = { ...profile, id: measurementId };

    navigate('/order-summary', {
      state: {
        measurementId,
        measurementData: finalProfile,
        customizationId: state?.customizationId,
        customizationData: state?.customizationData,
        productId,
        from: 'measurements',
        measurementSaved: options?.measurementSaved ?? false
      }
    });
  };

  const resetSavePromptState = () => {
    setShowSavePrompt(false);
    setPendingProfile(null);
    setPendingUpdateTargetId(null);
    setSavePromptContext(null);
    setSavePromptMode('new');
    setAllowPromptUpdate(true);
  };

  const handleSavePromptChoice = async (decision: 'save-new' | 'save-update' | 'skip') => {
    if (!pendingProfile) {
      console.warn('[DEBUG] handleSavePromptChoice called without pending profile');
      resetSavePromptState();
      return;
    }

    const trimmedName = (savePromptName || pendingProfile.name || '').trim();
    const profileToPersist: MeasurementProfile = {
      ...pendingProfile,
      name: trimmedName || pendingProfile.name,
      updatedAt: new Date().toISOString()
    };

    if (decision === 'skip') {
      if (savePromptContext === 'continue') {
        const profileForNavigation = { ...profileToPersist };
        resetSavePromptState();
        await continueToSummary(profileForNavigation, { measurementSaved: false });
      } else {
        resetSavePromptState();
      }
      return;
    }

    const allowUpdateNow = decision === 'save-update' && canUpdateExisting;
    const mode: 'new' | 'update' = allowUpdateNow ? 'update' : 'new';
    const targetId = allowUpdateNow ? (pendingUpdateTargetId || selectedProfileId) : null;

    try {
      await saveTemplate(profileToPersist, mode, targetId || null, savePromptContext || 'saveOnly');
      resetSavePromptState();
    } catch (error) {
      console.error('[DEBUG] ❌ handleSavePromptChoice error:', error);
      // Keep the prompt open so the user can retry
    }
  };

  const handleCancelSavePrompt = () => {
    if (isTemplateSaving) return;
    resetSavePromptState();
  };

  const handleQuickUpdate = async () => {
    if (!selectedProfile) {
      openSavePrompt('saveOnly');
      return;
    }

    const metrics = collectCurrentMetrics();
    const hasData = Object.values(metrics).some(value => (value as number) > 0);
    if (!hasData) {
      alert('يرجى إدخال المقاسات قبل التحديث.');
      return;
    }

    const overrides = {
      id: selectedProfile.id,
      name: selectedProfile.name,
      createdAt: selectedProfile.createdAt,
      userId: selectedProfile.userId,
      notes: selectedProfile.notes,
      type: selectedProfile.type
    };
    const profile = buildMeasurementProfile(metrics, overrides);

    try {
      await saveTemplate(profile, 'update', selectedProfile.id || null, 'saveOnly');
    } catch (error) {
      console.error('[DEBUG] ❌ handleQuickUpdate error:', error);
      alert('حدث خطأ أثناء تحديث القالب، يرجى المحاولة مرة أخرى.');
    }
  };

  const handleSaveAsNewTemplate = () => {
    openSavePrompt('saveOnly', { initialMode: 'new', allowUpdate: false });
  };

  const handleDeleteTemplate = async (profile: MeasurementProfile) => {
    if (!profile.id) return;
    const confirmed = window.confirm(`هل أنت متأكد من حذف القالب "${profile.name}"؟`);
    if (!confirmed) return;

    setDeletingTemplateId(profile.id);
    try {
      const parseStoredProfiles = (raw: string | null) => {
        if (!raw) return [] as MeasurementProfile[];
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? (parsed as MeasurementProfile[]) : [];
        } catch (error) {
          console.warn('[DEBUG] Failed to parse stored measurements for deletion:', error);
          return [] as MeasurementProfile[];
        }
      };

      if (user?.id) {
        try {
          await firebaseService.deleteMeasurement(profile.id);
        } catch (error) {
          console.error('[DEBUG] ❌ Error deleting measurement from Firebase:', error);
          throw error;
        }
        const storageKey = `measurements_${user.id}`;
        const existing = parseStoredProfiles(localStorage.getItem(storageKey));
        const filtered = existing.filter(item => item.id !== profile.id);
        localStorage.setItem(storageKey, JSON.stringify(filtered));
      } else {
        const guestKey = 'guest_measurements';
        const existingGuest = parseStoredProfiles(localStorage.getItem(guestKey));
        const filteredGuest = existingGuest.filter(item => item.id !== profile.id);
        localStorage.setItem(guestKey, JSON.stringify(filteredGuest));
      }

      setSavedMeasurements(prev => prev.filter(item => item.id !== profile.id));
      if (selectedProfileId === profile.id) {
        setSelectedProfileId(null);
        setPendingUpdateTargetId(null);
        setHasManualChanges(true);
        setSavePromptMode('new');
        setAllowPromptUpdate(true);
      }
      setSaveFeedback(`تم حذف القالب "${profile.name}" بنجاح.`);
    } catch (error) {
      console.error('[DEBUG] ❌ handleDeleteTemplate error:', error);
      alert('حدث خطأ أثناء حذف القالب. يرجى المحاولة مرة أخرى.');
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const handleSaveAndContinue = async () => {
    console.log('[DEBUG] ========== SAVE AND CONTINUE START ==========');
    console.log('[DEBUG] Current measurements:', measurements);
    console.log('[DEBUG] State from navigation:', state);
    console.log('[DEBUG] User:', user ? user.id : 'Not logged in');

    // Validate at least some measurements are entered
    const hasAnyMeasurement = Object.values(measurements).some((v: string) => v && parseFloat(v) > 0);
    console.log('[DEBUG] Has any measurement:', hasAnyMeasurement);
    if (!hasAnyMeasurement) {
      console.log('[DEBUG] ❌ Validation failed: No measurements entered');
      alert('يرجى إدخال المقاسات');
      return;
    }
    if (selectedProfileId && !hasManualChanges) {
      console.log('[DEBUG] Using existing saved measurement without modifications:', selectedProfileId);
      if (selectedProfile) {
        continueToSummary(selectedProfile, { measurementId: selectedProfileId, measurementSaved: true });
      } else {
        const metrics = collectCurrentMetrics();
        const fallbackProfile = buildMeasurementProfile(metrics, { id: selectedProfileId, name: selectedProfileId });
        continueToSummary(fallbackProfile, { measurementId: selectedProfileId, measurementSaved: true });
      }
      return;
    }

    const promptOpened = openSavePrompt('continue');
    if (!promptOpened) {
      console.log('[DEBUG] Save prompt did not open due to validation issues.');
    }
  };

  // ==================== RENDER ====================
  // Removed login requirement - users can view measurements without login
  
  return (
    <div className="h-screen flex flex-col bg-zinc-950 overflow-hidden">
      {/* DEBUG PANEL (hidden unless debug enabled) */}
      <DebugPanel title="Debug Info - ClientMeasurements.tsx" enabled={false}>
          <div className="grid gap-2 text-sm font-mono">
            <div className="flex gap-2">
              <span className="text-yellow-700 dark:text-yellow-300 font-bold">User:</span>
              <span className="text-yellow-900 dark:text-yellow-100">
                {user ? `${user.name} (${user.id})` : 'No user'}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-700 dark:text-yellow-300 font-bold">Route State:</span>
              <span className="text-yellow-900 dark:text-yellow-100">
                {state ? JSON.stringify(state, null, 2) : 'No state'}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-700 dark:text-yellow-300 font-bold">Product ID:</span>
              <span className="text-yellow-900 dark:text-yellow-100">
                {productId || (state as any)?.productId || 'None'}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-700 dark:text-yellow-300 font-bold">Product Category:</span>
              <span className="text-yellow-900 dark:text-yellow-100">
                {productData?.categoryId || 'Not loaded'}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-700 dark:text-yellow-300 font-bold">Templates Loaded:</span>
              <span className="text-yellow-900 dark:text-yellow-100">{isTemplatesLoading ? 'loading…' : templates.length}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-700 dark:text-yellow-300 font-bold">Template IDs:</span>
              <span className="text-yellow-900 dark:text-yellow-100 truncate">{templates.map(t => t.id).join(', ') || 'None'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-700 dark:text-yellow-300 font-bold">Rule:</span>
              <span className="text-yellow-900 dark:text-yellow-100">Template.id === Product.categoryId</span>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-700 dark:text-yellow-300 font-bold">Matched Template ID:</span>
              <span className="text-yellow-900 dark:text-yellow-100">{matchedTemplate?.id || 'None'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-700 dark:text-yellow-300 font-bold">Comparison:</span>
              <span className="text-yellow-900 dark:text-yellow-100">T.id = {matchedTemplate?.id || '—'} | P.categoryId = {productData?.categoryId || '—'}{matchedTemplate ? ' ✅' : ' ❌'}</span>
            </div>
            {matchedTemplate && (
              <>
                <div className="flex gap-2">
                  <span className="text-yellow-700 dark:text-yellow-300 font-bold">Matched Template Name:</span>
                  <span className="text-yellow-900 dark:text-yellow-100">{matchedTemplate.name}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-yellow-700 dark:text-yellow-300 font-bold">Points Count:</span>
                  <span className="text-yellow-900 dark:text-yellow-100">{matchedTemplate.points?.length || 0}</span>
                </div>
                <div className="flex flex-col gap-2 mt-3">
                  <span className="text-yellow-700 dark:text-yellow-300 font-bold">Template Points Details:</span>
                  <div className="bg-yellow-100/50 dark:bg-yellow-900/30 rounded p-2 max-h-64 overflow-auto">
                    {matchedTemplate.points && matchedTemplate.points.length > 0 ? (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-yellow-700 dark:text-yellow-300">
                            <th className="text-left p-1">#</th>
                            <th className="text-left p-1">Name</th>
                            <th className="text-left p-1">Label</th>
                            <th className="text-left p-1">X</th>
                            <th className="text-left p-1">Y</th>
                          </tr>
                        </thead>
                        <tbody className="text-yellow-900 dark:text-yellow-100">
                          {matchedTemplate.points.map((point, index) => (
                            <tr key={index} className="border-t border-yellow-200 dark:border-yellow-800">
                              <td className="p-1">{index + 1}</td>
                              <td className="p-1 font-mono">{point.name || '—'}</td>
                              <td className="p-1 font-semibold">{point.label || '—'}</td>
                              <td className="p-1 font-mono text-xs">{point.x}</td>
                              <td className="p-1 font-mono text-xs">{point.y}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <span className="text-yellow-900 dark:text-yellow-100">No points</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-yellow-700 dark:text-yellow-300 font-bold">Dynamic Fields Generated:</span>
                  <span className="text-yellow-900 dark:text-yellow-100">{dynamicMeasurementFields.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-yellow-700 dark:text-yellow-300 font-bold">Generated Field Labels:</span>
                  <span className="text-yellow-900 dark:text-yellow-100 text-xs bg-yellow-100/50 dark:bg-yellow-900/30 rounded p-2">
                    {dynamicMeasurementFields.map(f => f.label).join(' • ')}
                  </span>
                </div>
              </>
            )}
            <div className="flex gap-2">
              <span className="text-yellow-700 dark:text-yellow-300 font-bold">Product Name:</span>
              <span className="text-yellow-900 dark:text-yellow-100">
                {productData?.name || 'Not loaded'}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-700 dark:text-yellow-300 font-bold">Model ID:</span>
              <span className="text-yellow-900 dark:text-yellow-100">
                {state?.customizationData?.modelId || 'None'}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-700 dark:text-yellow-300 font-bold">Garment Type:</span>
              <span className="text-yellow-900 dark:text-yellow-100">{garmentType}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-700 dark:text-yellow-300 font-bold">Measurement Fields:</span>
              <span className="text-yellow-900 dark:text-yellow-100">
                {measurementFields.map(f => f.key).join(', ')}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-700 dark:text-yellow-300 font-bold">Saved Measurements:</span>
              <span className="text-yellow-900 dark:text-yellow-100">{savedMeasurements.length}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-700 dark:text-yellow-300 font-bold">Relevant Measurements:</span>
              <span className="text-yellow-900 dark:text-yellow-100">
                {relevantMeasurements.length} (matching {garmentType})
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-700 dark:text-yellow-300 font-bold">Is Loading:</span>
              <span className="text-yellow-900 dark:text-yellow-100">{isLoading ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-700 dark:text-yellow-300 font-bold">Is Saving:</span>
              <span className="text-yellow-900 dark:text-yellow-100">{isSaving ? 'Yes' : 'No'}</span>
            </div>
          </div>
      </DebugPanel>

      {/* Product Info Card */}
      {(state?.customizationData || productData) && (
        <div className="max-w-4xl mx-auto px-3 py-2">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-3 shadow-md">
            <div className="flex flex-row-reverse items-center gap-3">
              {(productData?.imageUrl || state?.customizationData?.fabricUrl) && (
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/30 flex-shrink-0">
                  <img 
                    src={productData?.imageUrl || state?.customizationData?.fabricUrl || ''} 
                    alt="المنتج" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 text-right">
                <p className="text-[11px] text-white/80 mb-0.5">المنتج المراد قياسه</p>
                <h2 className="text-base font-bold text-white leading-tight">
                  {productData?.name || state?.customizationData?.modelName || 'تصميم مخصص'}
                </h2>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-40 bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-zinc-900 rounded-lg transition-colors"
            title="رجوع"
          >
            <ChevronLeft size={24} className="text-zinc-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">
              إدخال المقاسات
            </h1>
            <p className="text-sm text-zinc-400">
              {state?.customizationData?.modelName || 'أدخل مقاساتك للحصول على أفضل نتيجة'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {matchingVideoEmbedUrl && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <PlayCircle size={20} className="text-white" />
              </div>
              <div className="flex-1 text-right">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  دليل المقاسات المطابقة
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  شاهد الفيديو التوضيحي قبل اختيار المقاس المناسب
                </p>
              </div>
            </div>
            <div className="relative w-full rounded-xl overflow-hidden aspect-video bg-black/10 dark:bg-black/40">
              <iframe
                src={matchingVideoEmbedUrl.includes('?') ? `${matchingVideoEmbedUrl}&rel=0` : `${matchingVideoEmbedUrl}?rel=0`}
                title="matching-measurements-video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check size={16} className="text-white" />
            </div>
            <span className="text-sm font-medium text-slate-600">التأكيد</span>
          </div>
          <div className="flex-1 h-1 bg-blue-500 mx-3"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <Ruler size={16} className="text-white" />
            </div>
            <span className="text-sm font-medium text-blue-600">المقاسات</span>
          </div>
          <div className="flex-1 h-1 bg-slate-200 mx-3"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
              <span className="text-sm text-slate-400">3</span>
            </div>
            <span className="text-sm font-medium text-slate-400">التفصيل</span>
          </div>
        </div>

        {/* Video Tutorial */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/60 dark:border-slate-700/60 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
              <PlayCircle size={20} className="text-blue-600 dark:text-blue-300" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">💡شاهد دليل القياس</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">للحصول على مقاسات دقيقة</p>
            </div>
          </div>
          {helpVideoEmbedUrl ? (
            <div className="mt-4 rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 bg-black/5 dark:bg-black/40 aspect-video">
              <iframe
                src={helpVideoEmbedUrl.includes('?') ? `${helpVideoEmbedUrl}&rel=0` : `${helpVideoEmbedUrl}?rel=0`}
                title="help-measurements-video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-600 dark:text-slate-300">
              لم يتم توفير رابط فيديو مساعدة حتى الآن.
            </p>
          )}
          {helpVideoRawUrl && (
            <a
              href={helpVideoRawUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
            >
              فتح الفيديو في نافذة جديدة
            </a>
          )}
        </div>

        {/* Saved Measurements */}
        {savedMeasurements.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-slate-700/50 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Save size={18} className="text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">مقاساتي المحفوظة</h3>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full">
                  {savedMeasurements.length}
                </span>
              </div>
              <button 
                onClick={() => setShowMeasurementsModal(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                عرض الكل
              </button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-700/70 rounded-xl p-4 text-right">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                اختر قالب المقاسات المناسب من القائمة ثم راجع التفاصيل قبل تطبيقه.
              </p>
              <button
                onClick={() => setShowMeasurementsModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                <Save size={16} />
                استعراض القوالب المحفوظة
              </button>
              {selectedProfile && (
                <div
                  className={`mt-3 text-xs ${hasManualChanges ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'}`}
                >
                  القالب الحالي: <span className="font-semibold">{selectedProfile.name}</span>
                  {hasManualChanges ? ' – يوجد تعديلات غير محفوظة.' : ' – جاهز للاستخدام.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions Card */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-4 border-2 border-blue-200/50 dark:border-blue-700/50 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Ruler size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">كيفية إدخال المقاسات:</h3>
              <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 flex-shrink-0">•</span>
                  <span>انقر على الأرقام الموجودة على الرسم لإدخال القياس</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 flex-shrink-0">•</span>
                  <span>استخدم شريط القياس بالسنتيمتر للحصول على مقاسات دقيقة</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 flex-shrink-0">•</span>
                  <span>يمكنك التعديل على أي قياس من القائمة على اليمين</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content: Measurements Grid */}
        <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
          {/* Body Diagram - Mobile First */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-200/50 dark:border-slate-700/50 lg:order-1">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
              دليل المقاسات بالتصوير البصري
            </h3>
            <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/30 dark:to-slate-800/30 rounded-xl p-4 overflow-hidden">
              {/* If matched template exists, show its base image and points. Otherwise show placeholder. */}
              {matchedTemplate?.baseImageUrl ? (
                <img
                  src={matchedTemplate.baseImageUrl}
                  alt={matchedTemplate.name}
                  className="absolute inset-0 w-full h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <svg viewBox="0 0 200 400" className="w-full h-full">
                    <path d="M100 50 L100 150 M80 100 L120 100 M100 150 L80 250 M100 150 L120 250 M80 250 L80 350 M120 250 L120 350"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className="text-slate-400"
                    />
                    <circle cx="100" cy="30" r="20" fill="currentColor" className="text-slate-400" />
                  </svg>
                </div>
              )}

              {/* Arrows from template */}
              {matchedTemplate?.arrows && matchedTemplate.arrows.length > 0 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {matchedTemplate.arrows.map((arrow) => (
                    <line
                      key={arrow.id}
                      x1={arrow.startX * 100}
                      y1={arrow.startY * 100}
                      x2={arrow.endX * 100}
                      y2={arrow.endY * 100}
                      stroke="#2563eb"
                      strokeWidth={0.5}
                      markerEnd="url(#arrowhead-client-measurements)"
                      opacity={matchedTemplate?.baseImageUrl ? 0.9 : 0.5}
                    />
                  ))}
                  <defs>
                    <marker id="arrowhead-client-measurements" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                      <path d="M0,0 L0,6 L6,3 z" fill="#2563eb" />
                    </marker>
                  </defs>
                </svg>
              )}

              {/* Points markers */}
              {matchedTemplate?.points && matchedTemplate.points.length > 0 ? (
                matchedTemplate.points.map((point, idx) => {
                  const n = point.order || idx + 1;
                  const left = `${Math.max(0, Math.min(1, point.x || 0)) * 100}%`;
                  const top = `${Math.max(0, Math.min(1, point.y || 0)) * 100}%`;
                  const pointKey = point.name || `point_${idx}`;
                  const isActive = activeMeasurement === pointKey;
                  const hasValue = measurements[pointKey] && parseFloat(measurements[pointKey]) > 0;
                  const fieldLabel = dynamicMeasurementFields.find(f => f.key === pointKey)?.label || point.label || `نقطة ${n}`;
                  return (
                    <button
                      key={point.id}
                      onClick={() => handlePointClick(pointKey, fieldLabel)}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer hover:scale-110 ${isActive ? 'scale-125 z-10' : ''}`}
                      style={{ left, top }}
                      type="button"
                      title={fieldLabel}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg relative ${
                        hasValue 
                          ? 'bg-emerald-500 text-white ring-2 ring-emerald-300' 
                          : isActive 
                            ? 'bg-blue-500 text-white ring-4 ring-blue-200' 
                            : 'bg-orange-500 text-white hover:bg-orange-600'
                      }`}>
                        {hasValue ? (
                          <Check size={16} className="text-white" />
                        ) : (
                          n
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                MEASUREMENT_MARKERS.map(({ key, top, left, number, label }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveMeasurement(key);
                      measurementRefs.current[key]?.focus();
                    }}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer hover:scale-110 ${
                      activeMeasurement === key ? 'scale-125 z-10' : ''
                    }`}
                    style={{ top, left }}
                    type="button"
                    title={label || `قياس ${number}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${
                      activeMeasurement === key 
                        ? 'bg-blue-500 text-white ring-4 ring-blue-200' 
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}>
                      {number}
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p>• {matchedTemplate?.points?.length || 8} نقاط قياس أساسية</p>
              <p>• انقر على النقطة للانتقال للحقل أو العكس</p>
            </div>
          </div>

          {/* Measurements Input - Mobile Second */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl pl-2 pr-3 py-3 sm:pl-2 sm:pr-4 sm:py-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50 lg:order-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Ruler size={16} className="text-blue-600" />
              المقاسات (سم)
            </h3>
            {selectedProfile && (
              <div
                className={`mb-3 text-xs text-right rounded-xl px-3 py-2 border ${hasManualChanges ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300'}`}
              >
                <span className="font-semibold">القالب الحالي:</span> {selectedProfile.name}
                {hasManualChanges ? ' – تم إجراء تعديلات غير محفوظة.' : ' – جاهز للاستخدام مباشرة.'}
              </div>
            )}
            {saveFeedback && (
              <div className="mb-3 text-xs text-right rounded-xl px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-200">
                {saveFeedback}
              </div>
            )}
            <div className="flex flex-col gap-1">
              {dynamicMeasurementFields.map(({ key, label }) => (
                <div key={key} className="grid grid-cols-[1fr_auto] gap-2 items-center">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 text-right">
                    {label}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    placeholder="0"
                    value={measurements[key] || ''}
                    onChange={(e) => handleMeasurementChange(key, e.target.value)}
                    onFocus={() => setActiveMeasurement(key)}
                    onBlur={() => setActiveMeasurement(null)}
                    className="w-20 px-2 py-1.5 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white text-center text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    ref={(el) => { measurementRefs.current[key] = el; }}
                  />
                </div>
              ))}
            </div>
            {selectedProfile ? (
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={handleQuickUpdate}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  disabled={isTemplateSaving}
                >
                  تحديث القالب الحالي
                </button>
                <button
                  onClick={handleSaveAsNewTemplate}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition"
                  type="button"
                >
                  حفظ كقالب جديد
                </button>
              </div>
            ) : (
              <button
                onClick={handleSaveAsNewTemplate}
                className="mt-4 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition"
                type="button"
              >
                حفظ كقالب جديد
              </button>
            )}
          </div>
        </div>

        {/* Side Rail: Product, Saved, Video, Instructions */}
        <aside className="lg:col-span-1 order-1 lg:order-2 space-y-4 hidden lg:block">
          {(state?.customizationData || productData) && (
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-4 shadow-md border border-white/10">
              <div className="flex flex-row-reverse items-center gap-3">
                {(productData?.imageUrl || state?.customizationData?.fabricUrl) && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/30 flex-shrink-0">
                    <img 
                      src={productData?.imageUrl || state?.customizationData?.fabricUrl || ''} 
                      alt="المنتج" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 text-right">
                  <p className="text-[11px] text-white/80 mb-0.5">المنتج المراد قياسه</p>
                  <h2 className="text-base font-bold text-white leading-tight">
                    {productData?.name || state?.customizationData?.modelName || 'تصميم مخصص'}
                  </h2>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <PlayCircle size={20} className="text-blue-600 dark:text-blue-300" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">💡 شاهد دليل القياس</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">للحصول على مقاسات دقيقة</p>
              </div>
            </div>
            {effectiveVideoUrl ? (
              <div className="mt-4 rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 bg-black/5 dark:bg-black/40 aspect-video">
                <iframe
                  src={effectiveVideoUrl.includes('?') ? `${effectiveVideoUrl}&rel=0` : `${effectiveVideoUrl}?rel=0`}
                  title="measurements-video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-600 dark:text-slate-300">
                لم يتم توفير رابط فيديو مساعدة حتى الآن.
              </p>
            )}
            {helpVideoRawUrl && (
              <a
                href={helpVideoRawUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
              >
                فتح الفيديو في نافذة جديدة
              </a>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Save size={18} className="text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">مقاساتي المحفوظة</h3>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full">
                  {savedMeasurements.length}
                </span>
              </div>
              <button 
                onClick={() => setShowMeasurementsModal(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                عرض الكل
              </button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-700/70 rounded-xl p-4 text-right">
              {savedMeasurements.length > 0 ? (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                    اختر قالب المقاسات المناسب من القائمة ثم راجع التفاصيل قبل تطبيقه.
                  </p>
                  <button
                    onClick={() => setShowMeasurementsModal(true)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    <Save size={16} />
                    استعراض القوالب المحفوظة
                  </button>
                </>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  لا توجد قوالب محفوظة بعد. قم بإدخال المقاسات ثم احفظ كقالب جديد.
                </p>
              )}
              {selectedProfile && (
                <div
                  className={`mt-3 text-xs ${hasManualChanges ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'}`}
                >
                  القالب الحالي: <span className="font-semibold">{selectedProfile.name}</span>
                  {hasManualChanges ? ' – يوجد تعديلات غير محفوظة.' : ' – جاهز للاستخدام.'}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-4 border-2 border-blue-200/50 dark:border-blue-700/50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Ruler size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">كيفية إدخال المقاسات:</h3>
                <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0">•</span>
                    <span>انقر على الأرقام الموجودة على الرسم لإدخال القياس</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0">•</span>
                    <span>استخدم شريط القياس بالسنتيمتر للحصول على مقاسات دقيقة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0">•</span>
                    <span>يمكنك التعديل على أي قياس من القائمة على اليمين</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </aside>
        </div>

      {/* Input Modal for Mobile */}
      {showInputModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
              {modalPointLabel}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 text-center">
              أدخل القياس بالسنتيمتر
            </p>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="0"
              value={modalInputValue}
              onChange={(e) => setModalInputValue(e.target.value)}
              autoFocus
              className="w-full px-4 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white text-center text-2xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowInputModal(false);
                  setModalInputValue('');
                }}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleModalSave}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Measurements Modal */}
      {showMeasurementsModal && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800">
              <div className="text-right">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">القوالب المحفوظة</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">راجع التفاصيل ثم اختر القالب المناسب لتطبيقه على الفور.</p>
              </div>
              <button
                onClick={() => setShowMeasurementsModal(false)}
                className="text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              >
                إغلاق
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {savedMeasurements.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  لا توجد مقاسات محفوظة بعد.
                </div>
              ) : (
                savedMeasurements.map(profile => {
                  const isSelected = selectedProfileId === profile.id;
                  const metricEntries = Object.entries(profile.metrics || {}).filter(([_, value]) => !!value);
                  return (
                    <div
                      key={profile.id}
                      className={`p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 last:border-b-0 ${isSelected ? 'bg-blue-50/60 dark:bg-blue-900/20' : ''}`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-right">
                          <p className="font-semibold text-slate-900 dark:text-white">{profile.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">النوع: {profile.type || 'غير محدد'}</p>
                          {profile.updatedAt && (
                            <p className="text-xs text-slate-400 mt-1">آخر تحديث: {new Date(profile.updatedAt).toLocaleDateString('ar-SA')}</p>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-2">
                          <div className="flex flex-wrap gap-2 justify-end text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                            {metricEntries.slice(0, 6).map(([key, value]) => (
                              <span
                                key={`${profile.id}-${key}`}
                                className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1"
                              >
                                {key}: {value}
                              </span>
                            ))}
                            {metricEntries.length === 0 && (
                              <span className="text-slate-400">لا توجد بيانات مقاسات مسجلة</span>
                            )}
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleUseSavedMeasurements(profile)}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all"
                            >
                              اختيار القالب
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(profile)}
                              disabled={deletingTemplateId === profile.id}
                              className="px-4 py-2 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800/60 dark:text-red-300 dark:hover:bg-red-900/20 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              <Trash2 size={16} />
                              حذف
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Prompt */}
      {showSavePrompt && (
        <div className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200/60 dark:border-slate-700/60 p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-right">حفظ قالب القياسات؟</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 text-right">
              يمكنك حفظ هذه المقاسات كقالب لسرعة الاستخدام مستقبلاً، أو المتابعة بدون حفظ.
            </p>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 text-right">
              اسم القالب
            </label>
            <input
              type="text"
              value={savePromptName}
              onChange={(e) => setSavePromptName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-right mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="مثال: مقاس العباية البيضاء"
            />
            <div className="mb-4 text-right">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                سيتم حفظ القياسات التالية:
              </p>
              {pendingMetricsEntries.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {pendingMetricsEntries.map(([key, value]) => {
                    const label = dynamicMeasurementFields.find(field => field.key === key)?.label || key;
                    const formattedValue = Number(value).toLocaleString('ar-SA', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
                    return (
                      <div key={key} className="flex flex-col items-end rounded-xl bg-slate-100 dark:bg-slate-800/70 px-3 py-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{formattedValue} سم</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl bg-slate-100 dark:bg-slate-800/70 px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                  لم يتم إدخال قياسات قابلة للحفظ بعد.
                </div>
              )}
            </div>
            <div className="mb-4 text-right">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">اختر طريقة الحفظ:</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSavePromptMode('new')}
                  className={`w-full text-right px-3 py-2 rounded-xl border-2 transition ${savePromptMode === 'new' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-200' : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50/40 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-400/70 dark:hover:bg-blue-900/10'}`}
                >
                  <span className="block text-sm font-semibold">حفظ كقالب جديد</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">إنشاء نسخة جديدة باسم مخصص دون التأثير على القوالب السابقة.</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (canUpdateExisting) setSavePromptMode('update');
                  }}
                  disabled={!canUpdateExisting}
                  className={`w-full text-right px-3 py-2 rounded-xl border-2 transition ${savePromptMode === 'update' && canUpdateExisting ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-200' : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50/40 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-400/70 dark:hover:bg-blue-900/10'} ${!canUpdateExisting ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <span className="block text-sm font-semibold">تحديث القالب الحالي</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {canUpdateExisting
                      ? `سيتم تحديث القالب "${pendingProfile?.name || ''}" بالقيم الجديدة.`
                      : 'اختر قالباً محفوظاً أولاً ليتمكن التطبيق من تحديثه.'}
                  </span>
                </button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row-reverse gap-2">
              <button
                onClick={() => handleSavePromptChoice(savePromptMode === 'update' && canUpdateExisting ? 'save-update' : 'save-new')}
                disabled={isTemplateSaving || isSaving || (savePromptMode === 'update' && !canUpdateExisting)}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                حفظ القالب
              </button>
              {savePromptContext === 'continue' && (
                <button
                  onClick={() => handleSavePromptChoice('skip')}
                  disabled={isTemplateSaving || isSaving}
                  className="flex-1 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  المتابعة بدون حفظ
                </button>
              )}
              <button
                onClick={handleCancelSavePrompt}
                disabled={isTemplateSaving}
                className="flex-1 py-3 rounded-xl text-slate-500 dark:text-slate-400 text-sm hover:text-slate-800 dark:hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Button (centered, avoids scrollbar overlap) */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-full px-4 md:px-6">
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-lg">
          <button
            onClick={handleSaveAndContinue}
            disabled={isSaving}
            className="w-full py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <span>حفظ ومتابعة</span>
                <ArrowLeft size={24} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
