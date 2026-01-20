import React from 'react';
import { useLocation } from 'react-router-dom';
import { SurveyModal } from './SurveyModal';
import { useSurveySession } from './useSurveySession';
import { watchSurveyConfig } from './db';
import {
  ensureSessionScope,
  loadSurveyLocalState,
  loadSurveyConfig,
  saveSurveyConfig,
  SURVEY_CONFIG_EVENT,
  markAutoOpenedThisSession,
  markRemindedThisSession,
  resetSessionFlags,
  saveSurveyLocalState,
} from './storage';

const getRandomDelay = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const SurveyLauncher: React.FC = () => {
  const location = useLocation();
  const {
    isReady,
    status,
    currentStep,
    totalSteps,
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
    continueLater,
    skipSurvey,
    completeSurvey,
    isStepValid,
  } = useSurveySession();

  const [isOpen, setIsOpen] = React.useState(false);
  const [showReminder, setShowReminder] = React.useState(false);
  const [showThanks, setShowThanks] = React.useState(false);
  const [routeChanges, setRouteChanges] = React.useState(0);
  const [config, setConfig] = React.useState(() => loadSurveyConfig());

  React.useEffect(() => {
    const isNewSession = ensureSessionScope();
    if (isNewSession) resetSessionFlags();
  }, []);

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
    if (!config.enabled) {
      setIsOpen(false);
      setShowReminder(false);
    }
  }, [config.enabled]);

  React.useEffect(() => {
    if (!isReady) return;
    if (!config.enabled) return;
    if (status === 'completed') return;

    const local = loadSurveyLocalState();
    const now = Date.now();
    const cooldownUntil = local.cooldownUntil ?? 0;

    if (status === 'skipped' && cooldownUntil && now < cooldownUntil) return;
    if (local.autoOpenedThisSession) return;

    const triggerOpen = () => {
      const latest = loadSurveyLocalState();
      if (latest.autoOpenedThisSession) return;
      if (status === 'skipped' && latest.cooldownUntil && Date.now() < latest.cooldownUntil) return;
      setIsOpen(true);
      markAutoOpenedThisSession();
      saveSurveyLocalState({ lastAutoOpenAt: Date.now(), autoOpenedThisSession: true });
    };

    const timer = window.setTimeout(triggerOpen, getRandomDelay(config.autoOpenMinMs, config.autoOpenMaxMs));
    const onScroll = () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
      triggerOpen();
    };

    window.addEventListener('scroll', onScroll, { once: true, passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [config.autoOpenMaxMs, config.autoOpenMinMs, config.enabled, isReady, status]);

  React.useEffect(() => {
    setRouteChanges((prev) => prev + 1);
  }, [location.key]);

  React.useEffect(() => {
    if (!isReady) return;
    if (!config.enabled) return;
    if (status === 'completed') return;

    const local = loadSurveyLocalState();
    if (local.remindedThisSession) return;

    const shouldRemind = status === 'in_progress' || status === 'skipped';
    if (!shouldRemind) return;

    if (routeChanges >= 3) {
      setShowReminder(true);
      markRemindedThisSession();
      return;
    }

    const timer = window.setTimeout(() => {
      const latest = loadSurveyLocalState();
      if (latest.remindedThisSession) return;
      setShowReminder(true);
      markRemindedThisSession();
    }, getRandomDelay(config.reminderMinMs, config.reminderMaxMs));

    return () => clearTimeout(timer);
  }, [config.enabled, config.reminderMaxMs, config.reminderMinMs, isReady, routeChanges, status]);

  const handleClose = () => setIsOpen(false);

  const handleContinueLater = () => {
    continueLater();
    setIsOpen(false);
  };

  const handleSkip = async () => {
    await skipSurvey();
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    await completeSurvey();
    setShowThanks(true);
    // Don't close immediately - let the thank-you screen show for a few seconds
    window.setTimeout(() => {
      setIsOpen(false);
      window.setTimeout(() => setShowThanks(false), 2500);
    }, 3500);
  };

  const showResume = config.enabled && status === 'in_progress' && !isOpen;

  return (
    <>
      {showThanks ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 text-white px-4 py-3 shadow-lg">
          <div className="text-sm font-semibold">شكراً لمشاركتك!</div>
          <div className="text-xs text-emerald-100">تم حفظ إجاباتك وإغلاق الاستبيان.</div>
        </div>
      ) : null}

      {showResume ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-blue-700"
        >
          Continue 1-minute survey
        </button>
      ) : null}

      {showReminder && !isOpen ? (
        <div className="fixed bottom-20 right-6 z-40 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <div className="font-medium">Help us improve Khuyoot</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Your feedback takes about a minute.</div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setShowReminder(false);
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Open survey
            </button>
            <button
              type="button"
              onClick={() => setShowReminder(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <SurveyModal
        isOpen={isOpen}
        questionId={currentQuestion?.questionId ?? null}
        currentStep={currentStep}
        totalSteps={totalSteps}
        answers={answers}
        needsGovernorateSelect={needsGovernorateSelect}
        shouldShowOtherPain={shouldShowOtherPain}
        shouldShowOtherBlockers={shouldShowOtherBlockers}
        isStepValid={isStepValid}
        onClose={handleClose}
        onSkip={handleSkip}
        onContinueLater={handleContinueLater}
        onNext={goNext}
        onBack={goBack}
        goToStep={goToStep}
        onSubmit={handleSubmit}
        updateAnswer={updateAnswer}
        toggleMultiAnswer={toggleMultiAnswer}
      />
    </>
  );
};
