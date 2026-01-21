import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { getVisibleSteps } from './config';
import { SurveyModal } from './SurveyModal';
import { loadSurveyConfig, type SurveyConfig } from './storage';
import { watchSurveyConfig } from './db';

const PREVIEW_SLUG = 'khuyoot-validation';

const mergeConfig = (base: SurveyConfig, remote: SurveyConfig): SurveyConfig => {
  return {
    ...base,
    ...remote,
    hiddenQuestionIds: Array.isArray(remote.hiddenQuestionIds) ? remote.hiddenQuestionIds : base.hiddenQuestionIds,
  };
};

export const PublicSurveyPreviewPage: React.FC = () => {
  const location = useLocation();

  // Safety: only allow the known survey preview slug for now.
  // If you later add more surveys, convert this to a :slug param + mapping.
  if (location.pathname !== `/surveys/${PREVIEW_SLUG}/preview`) {
    return <Navigate to={`/surveys/${PREVIEW_SLUG}/preview`} replace />;
  }

  const [config, setConfig] = React.useState<SurveyConfig>(() => loadSurveyConfig());
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewStep, setPreviewStep] = React.useState(0);
  const [previewAnswers, setPreviewAnswers] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    const unsub = watchSurveyConfig((remote) => {
      if (!remote) return;
      setConfig((prev) => mergeConfig(prev, remote));
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpen = params.get('open') === '1';
    if (shouldOpen) {
      setPreviewOpen(true);
    }
  }, [location.search]);

  const previewSteps = React.useMemo(
    () => getVisibleSteps(previewAnswers, config.hiddenQuestionIds),
    [previewAnswers, config.hiddenQuestionIds]
  );

  const previewQuestionId = previewSteps[previewStep]?.questionId ?? null;

  const updatePreviewAnswer = (questionId: string, value: any) => {
    setPreviewAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const togglePreviewMulti = (questionId: string, value: string) => {
    setPreviewAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? [...prev[questionId]] : [];
      const index = current.indexOf(value);
      if (index >= 0) current.splice(index, 1);
      else current.push(value);
      return { ...prev, [questionId]: current };
    });
  };

  const resetPreview = () => {
    setPreviewAnswers({});
    setPreviewStep(0);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10 dark:bg-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-xl items-center justify-center">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Khuyoot survey preview</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              No login required. Responses are not saved.
            </p>
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">Steps available: {previewSteps.length}</div>
          </div>

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => {
                resetPreview();
                setPreviewOpen(true);
              }}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Open preview
            </button>
          </div>
        </div>

        <SurveyModal
          isOpen={previewOpen}
          questionId={previewQuestionId}
          currentStep={previewStep}
          totalSteps={previewSteps.length || 1}
          answers={previewAnswers}
          backdropVariant="designerV2_1"
          needsGovernorateSelect={previewAnswers.country === 'oman'}
          shouldShowOtherPain={Array.isArray(previewAnswers.pain_points) && previewAnswers.pain_points.includes('other')}
          shouldShowOtherBlockers={Array.isArray(previewAnswers.stitching_blockers) && previewAnswers.stitching_blockers.includes('other')}
          isStepValid={() => true}
          onClose={() => setPreviewOpen(false)}
          onSkip={() => setPreviewOpen(false)}
          onContinueLater={() => setPreviewOpen(false)}
          onNext={() => setPreviewStep((prev) => Math.min(prev + 1, Math.max(previewSteps.length - 1, 0)))}
          onBack={() => setPreviewStep((prev) => Math.max(prev - 1, 0))}
          onSubmit={() => setPreviewOpen(false)}
          updateAnswer={updatePreviewAnswer}
          toggleMultiAnswer={togglePreviewMulti}
          forceWelcome
        />
      </div>
    </div>
  );
};
