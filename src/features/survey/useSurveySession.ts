import React from 'react';
import { useApp } from '../../../context/AppContext';
import {
  getVisibleSteps,
  isAnswerEmpty,
  isOmanSelected,
  shouldShowPainPointsOther,
  shouldShowStitchingBlockersOther,
  type SurveyAnswers,
  type SurveyStatus,
} from './config';
import {
  createOrLoadSession,
  linkToUser,
  markCompleted,
  markSkipped,
  saveProgress,
  watchSurveyConfig,
} from './db';
import {
  ensureSessionScope,
  loadSurveyLocalState,
  loadSurveyConfig,
  saveSurveyConfig,
  SURVEY_CONFIG_EVENT,
  saveSurveyLocalState,
  setCooldownUntil,
  STORAGE_VERSION,
} from './storage';

const createSessionId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const getUtm = () => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const source = params.get('utm_source');
  const medium = params.get('utm_medium');
  const campaign = params.get('utm_campaign');
  if (!source && !medium && !campaign) return null;
  return { source, medium, campaign };
};

const getDeviceInfo = () => {
  if (typeof navigator === 'undefined') return null;
  return {
    lang: navigator.language,
    platform: navigator.platform,
    userAgent: navigator.userAgent,
  };
};

// Create a device fingerprint for anonymous user tracking & deduplication
const getDeviceFingerprint = (): string => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return 'unknown';
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
  }
  
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    canvas.toDataURL()
  ];
  
  // Simple hash function
  const str = components.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

const getGeoFromAnswers = (answers: SurveyAnswers) => {
  const country = typeof answers.country === 'string' ? answers.country : null;
  const region = typeof answers.governorate_or_city === 'string' && answers.governorate_or_city.trim().length > 0 ? answers.governorate_or_city : null;
  return {
    country,
    region,
    source: country || region ? 'user_selected' : 'none',
  } as const;
};

export const useSurveySession = () => {
  const { user } = useApp();
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<SurveyStatus>('in_progress');
  const [currentStep, setCurrentStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<SurveyAnswers>({});
  const [isReady, setIsReady] = React.useState(false);
  const [config, setConfig] = React.useState(() => loadSurveyConfig());
  const [isAdmin, setIsAdmin] = React.useState(false);

  const debouncedSave = React.useRef<number | null>(null);
  const linkedUserRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    ensureSessionScope();
    
    // Check if user is admin - admins cannot submit survey data
    if (user?.role === 'admin') {
      setIsAdmin(true);
      console.log('🚫 Survey blocked: Admin users cannot submit survey data to prevent test pollution');
    }
  }, [user]);

  React.useEffect(() => {
    const unsubscribe = watchSurveyConfig((remote) => {
      if (!remote) return;
      saveSurveyConfig(remote);
      setConfig(loadSurveyConfig());
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'khuyoot.survey.v1.config') {
        setConfig(loadSurveyConfig());
      }
    };
    const onConfig = () => setConfig(loadSurveyConfig());
    window.addEventListener('storage', onStorage);
    window.addEventListener(SURVEY_CONFIG_EVENT, onConfig as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(SURVEY_CONFIG_EVENT, onConfig as EventListener);
    };
  }, []);

  React.useEffect(() => {
    let active = true;
    const init = async () => {
            // Block admins from creating sessions in database
            if (user?.role === 'admin') {
              setIsReady(true);
              return;
            }
      
      const local = loadSurveyLocalState();
        const deviceFingerprint = getDeviceFingerprint();
      const nextSessionId = local.sessionId ?? createSessionId();
      const nextStatus = local.status ?? 'in_progress';
      const nextStep = Number.isFinite(local.currentStep) ? local.currentStep : 0;
      const nextAnswers = local.answers ?? {};

      if (!active) return;
      setSessionId(nextSessionId);
      setStatus(nextStatus);
      setCurrentStep(nextStep);
      setAnswers(nextAnswers);

      saveSurveyLocalState({
        version: STORAGE_VERSION,
        sessionId: nextSessionId,
        status: nextStatus,
        currentStep: nextStep,
        answers: nextAnswers,
      });

      try {
        await createOrLoadSession({
          sessionId: nextSessionId,
          status: nextStatus,
          currentStep: nextStep,
          answers: nextAnswers,
          userId: user?.id ?? null,
          anonymousId: user?.id || deviceFingerprint,
          referrer: typeof document !== 'undefined' ? document.referrer || null : null,
          utm: getUtm(),
          device: getDeviceInfo(),
          geo: getGeoFromAnswers(nextAnswers),
                  deviceFingerprint,
                  userRole: user?.role || null,
        });
      } catch (error) {
        console.warn('Survey session init failed', error);
      }

      if (!active) return;
      setIsReady(true);
    };

    init();
    return () => {
      active = false;
    };
  }, [user?.id]);

  React.useEffect(() => {
    if (!sessionId || !user?.id) return;
    if (linkedUserRef.current === user.id) return;
    linkToUser(sessionId, user.id).catch((error) => {
      console.warn('Failed to link survey session to user', error);
    });
    linkedUserRef.current = user.id;
  }, [sessionId, user?.id]);

  React.useEffect(() => {
    if (!sessionId) return;
    
        // Always save to localStorage (including for admins for testing)
        saveSurveyLocalState({
          version: STORAGE_VERSION,
          sessionId,
          status,
          currentStep,
          answers,
        });
    
        // Block admin users from saving to database
        if (user?.role === 'admin') {
          console.log('💾 Survey saved to localStorage only (admin mode - not synced to database)');
          return;
        }
    
    if (debouncedSave.current) window.clearTimeout(debouncedSave.current);
    debouncedSave.current = window.setTimeout(() => {
      const payload = {
        status,
        currentStep,
        answers,
        geo: getGeoFromAnswers(answers),
      };
      saveSurveyLocalState({
        status,
        currentStep,
        answers,
      });
      saveProgress(sessionId, payload).catch((error) => {
        console.warn('Failed to save survey progress', error);
      });
    }, 800);

    return () => {
      if (debouncedSave.current) window.clearTimeout(debouncedSave.current);
    };
  }, [answers, currentStep, sessionId, status]);

  React.useEffect(() => {
    const frequency = answers.stitch_frequency;
    if (frequency === 'never') {
      if ('spend_per_outfit' in answers) {
        const { spend_per_outfit, ...rest } = answers;
        setAnswers(rest);
      }
    } else if (frequency) {
      if ('stitching_blockers' in answers || 'stitching_blockers_other' in answers) {
        const { stitching_blockers, stitching_blockers_other, ...rest } = answers;
        setAnswers(rest);
      }
    }
  }, [answers]);

  const visibleSteps = React.useMemo(() => getVisibleSteps(answers, config.hiddenQuestionIds), [answers, config.hiddenQuestionIds]);

  const currentStepIndex = Math.min(currentStep, Math.max(visibleSteps.length - 1, 0));

  const currentQuestion = visibleSteps[currentStepIndex];

  const updateAnswer = React.useCallback(
    (questionId: string, value: SurveyAnswers[string]) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    },
    []
  );

  const toggleMultiAnswer = React.useCallback(
    (questionId: string, value: string) => {
      setAnswers((prev) => {
        const existing = prev[questionId];
        const list = Array.isArray(existing) ? existing.slice() : [];
        const index = list.indexOf(value);
        if (index >= 0) list.splice(index, 1);
        else list.push(value);
        return { ...prev, [questionId]: list };
      });
    },
    []
  );

  const goNext = React.useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, visibleSteps.length - 1));
  }, [visibleSteps.length]);

  const goBack = React.useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);
  
  const goToStep = React.useCallback((step: number) => {
    if (step >= 0 && step < visibleSteps.length) {
      setCurrentStep(step);
    }
  }, [visibleSteps.length]);

  const continueLater = React.useCallback(() => {
    setStatus('in_progress');
  }, []);

  const skipSurvey = React.useCallback(async () => {
    if (!sessionId) return;
    setStatus('skipped');
    const cooldown = Date.now() + config.cooldownHours * 60 * 60 * 1000;
    setCooldownUntil(cooldown);
    try {
      await markSkipped(sessionId);
    } catch (error) {
      console.warn('Failed to mark survey skipped', error);
    }
  }, [config.cooldownHours, sessionId]);

  const completeSurvey = React.useCallback(async () => {
    if (!sessionId) return;
    setStatus('completed');
    try {
      await markCompleted(sessionId);
    } catch (error) {
      console.warn('Failed to mark survey completed', error);
    }
  }, [sessionId]);

  const isStepValid = React.useCallback(
    (questionId: string): boolean => {
      if (!questionId) return true;
      const value = answers[questionId];
      if (questionId === 'governorate_or_city' || questionId === 'tryon_fee_range') return true;
      if (questionId === 'pain_points_other' && !shouldShowPainPointsOther(answers)) return true;
      if (questionId === 'stitching_blockers_other' && !shouldShowStitchingBlockersOther(answers)) return true;
      return !isAnswerEmpty(value);
    },
    [answers]
  );

  const shouldShowOtherPain = shouldShowPainPointsOther(answers);
  const shouldShowOtherBlockers = shouldShowStitchingBlockersOther(answers);

  const needsGovernorateSelect = isOmanSelected(answers);

  return {
    isReady,
    sessionId,
    status,
    currentStep: currentStepIndex,
    totalSteps: visibleSteps.length,
    visibleSteps,
    currentQuestion,
    answers,
    needsGovernorateSelect,
    shouldShowOtherPain,
    shouldShowOtherBlockers,
    updateAnswer,
    toggleMultiAnswer,
    goNext,
    goBack,
    goToStep,
    setCurrentStep,
    continueLater,
    skipSurvey,
    completeSurvey,
    isStepValid,
  } as const;
};
