import React from 'react';
import { collection, getDocs, limit, orderBy, query, startAfter, where, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useApp } from '../../../../context/AppContext';
import { SURVEY_ID, SURVEY_QUESTIONS, getVisibleSteps } from '../../survey/config';
import { loadSurveyConfig, saveSurveyConfig, type SurveyConfig } from '../../survey/storage';
import { saveSurveyConfigRemote, watchSurveyConfig } from '../../survey/db';
import { SurveyModal } from '../../survey/SurveyModal';
import { computeAggregations, type SurveyResponse } from './aggregations';

const ADMIN_EMAILS = ['admin@khuyoot.app'];
const PAGE_SIZE = 50;

const DATE_RANGE_OPTIONS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 0, label: 'All time' },
];

const formatDate = (value?: Date | null) => (value ? value.toLocaleString() : '—');

const buildCsv = (rows: SurveyResponse[]) => {
  const columns = [
    'createdAt',
    'status',
    'country',
    'region',
    'persona',
    'stitch_frequency',
    'spend_per_outfit',
    'willing_to_pay_tryon',
    'answers_json',
  ];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = rows.map((row) => {
    const answers = row.answers ?? {};
    const values = [
      row.createdAt ? row.createdAt.toISOString() : '',
      row.status ?? '',
      String(answers.country ?? ''),
      String(answers.governorate_or_city ?? ''),
      String(answers.persona ?? ''),
      String(answers.stitch_frequency ?? ''),
      String(answers.spend_per_outfit ?? ''),
      String(answers.willing_to_pay_tryon ?? ''),
      JSON.stringify(answers),
    ];
    return values.map((val) => escape(String(val))).join(',');
  });
  return [columns.join(','), ...lines].join('\n');
};

const downloadBlob = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const SummaryCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
    <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</div>
  </div>
);

const BreakdownList: React.FC<{ title: string; items: [string, number][] }> = ({ title, items }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
    <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
      {items.length === 0 ? <div className="text-xs text-slate-400">No data yet</div> : null}
      {items.map(([label, count]) => (
        <div key={label} className="flex items-center justify-between">
          <span>{label}</span>
          <span className="text-xs font-semibold text-slate-500">{count}</span>
        </div>
      ))}
    </div>
  </div>
);

const DetailsDrawer: React.FC<{ response: SurveyResponse | null; onClose: () => void }> = ({ response, onClose }) => {
  if (!response) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative h-full w-full max-w-lg overflow-auto bg-white p-6 shadow-xl dark:bg-slate-950">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Survey response</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 text-xs text-slate-500">Created: {formatDate(response.createdAt)}</div>
        <pre className="mt-4 rounded-lg bg-slate-100 p-4 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-200">
{JSON.stringify(response.answers, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export const SurveyResponsesPage: React.FC = () => {
  const { user } = useApp();
  const [responses, setResponses] = React.useState<SurveyResponse[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [lastDoc, setLastDoc] = React.useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [selected, setSelected] = React.useState<SurveyResponse | null>(null);
  const [activeTab, setActiveTab] = React.useState<'results' | 'configuration' | 'preview'>('results');
  const [config, setConfig] = React.useState<SurveyConfig>(() => loadSurveyConfig());
  const [indexFallback, setIndexFallback] = React.useState(false);
  const [firestoreTest, setFirestoreTest] = React.useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [firestoreTestMessage, setFirestoreTestMessage] = React.useState<string>('');
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewStep, setPreviewStep] = React.useState(0);
  const [previewAnswers, setPreviewAnswers] = React.useState<Record<string, any>>({});

  const [filterStatus, setFilterStatus] = React.useState('all');
  const [filterCountry, setFilterCountry] = React.useState('all');
  const [filterPersona, setFilterPersona] = React.useState('all');
  const [dateRangeDays, setDateRangeDays] = React.useState(30);

  const isAllowed = user?.role === 'admin' || (!!user?.email && ADMIN_EMAILS.includes(user.email));

  const loadResponses = React.useCallback(
    async (reset: boolean) => {
      setLoading(true);
      try {
        const constraints = [where('surveyId', '==', SURVEY_ID), orderBy('createdAt', 'desc'), limit(PAGE_SIZE)];
        if (!reset && lastDoc) constraints.push(startAfter(lastDoc));
        const q = query(collection(db, 'surveySessions'), ...constraints);
        const snap = await getDocs(q);
        const next = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
          return {
            id: docSnap.id,
            status: data.status ?? null,
            createdAt,
            answers: data.answers ?? {},
          } as SurveyResponse;
        });
        setIndexFallback(false);
        setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
        setResponses((prev) => (reset ? next : [...prev, ...next]));
      } catch (error) {
        console.warn('Failed to load survey responses', error);
        const message = String(error?.message || error || 'Unknown error');
        if (message.toLowerCase().includes('index')) {
          try {
            const fallbackConstraints = [orderBy('createdAt', 'desc'), limit(PAGE_SIZE)];
            if (!reset && lastDoc) fallbackConstraints.push(startAfter(lastDoc));
            const fallbackQuery = query(collection(db, 'surveySessions'), ...fallbackConstraints);
            const snap = await getDocs(fallbackQuery);
            const next = snap.docs
              .map((docSnap) => {
                const data = docSnap.data();
                const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
                return {
                  id: docSnap.id,
                  status: data.status ?? null,
                  createdAt,
                  answers: data.answers ?? {},
                  surveyId: data.surveyId ?? null,
                } as SurveyResponse & { surveyId?: string | null };
              })
              .filter((row) => (row as any).surveyId === SURVEY_ID)
              .map(({ surveyId: _surveyId, ...rest }) => rest as SurveyResponse);
            setIndexFallback(true);
            setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
            setResponses((prev) => (reset ? next : [...prev, ...next]));
          } catch (fallbackError) {
            console.warn('Fallback survey query failed', fallbackError);
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [lastDoc]
  );

  React.useEffect(() => {
    if (!isAllowed) return;
    loadResponses(true);
  }, [isAllowed, loadResponses]);

  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'khuyoot.survey.v1.config') {
        setConfig(loadSurveyConfig());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  React.useEffect(() => {
    const unsubscribe = watchSurveyConfig((remote) => {
      if (!remote) return;
      saveSurveyConfig(remote);
      setConfig(loadSurveyConfig());
    });
    return () => unsubscribe();
  }, []);

  const filteredResponses = React.useMemo(() => {
    const now = Date.now();
    const cutoff = dateRangeDays > 0 ? now - dateRangeDays * 24 * 60 * 60 * 1000 : 0;
    return responses.filter((response) => {
      if (filterStatus !== 'all' && response.status !== filterStatus) return false;
      if (filterCountry !== 'all' && response.answers?.country !== filterCountry) return false;
      if (filterPersona !== 'all' && response.answers?.persona !== filterPersona) return false;
      if (cutoff && response.createdAt && response.createdAt.getTime() < cutoff) return false;
      return true;
    });
  }, [responses, filterStatus, filterCountry, filterPersona, dateRangeDays]);

  const counts = React.useMemo(() => {
    return {
      total: filteredResponses.length,
      completed: filteredResponses.filter((r) => r.status === 'completed').length,
      inProgress: filteredResponses.filter((r) => r.status === 'in_progress').length,
      skipped: filteredResponses.filter((r) => r.status === 'skipped').length,
    };
  }, [filteredResponses]);

  const aggregations = React.useMemo(() => computeAggregations(filteredResponses), [filteredResponses]);

  const handleExportCsv = () => {
    const csv = buildCsv(filteredResponses);
    downloadBlob(csv, 'khuyoot-survey-results.csv', 'text/csv;charset=utf-8;');
  };

  const handleExportJson = () => {
    downloadBlob(JSON.stringify(filteredResponses, null, 2), 'khuyoot-survey-results.json', 'application/json');
  };

  const updateConfig = async (partial: Partial<SurveyConfig>) => {
    const next = { ...config, ...partial };
    setConfig(next);
    saveSurveyConfig(next);
    try {
      await saveSurveyConfigRemote(next);
    } catch (error) {
      console.warn('Failed to save survey config', error);
    }
  };

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

  const handleFirestoreTest = async () => {
    setFirestoreTest('running');
    setFirestoreTestMessage('');
    try {
      await saveSurveyConfigRemote({
        ...config,
        enabled: config.enabled,
      });
      setFirestoreTest('success');
      setFirestoreTestMessage('Firestore write succeeded.');
    } catch (error: any) {
      setFirestoreTest('error');
      setFirestoreTestMessage(String(error?.message || 'Firestore write failed'));
    }
  };

  if (!isAllowed) {
    return (
      <div className="p-6 text-sm text-slate-600 dark:text-slate-300">
        Access denied. Contact admin to enable this page.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Survey management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage the Khuyoot validation survey and review responses.</p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('results')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            activeTab === 'results'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          Results
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('configuration')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            activeTab === 'configuration'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          Configuration
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            activeTab === 'preview'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          Preview
        </button>
      </div>

      {activeTab === 'configuration' ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Survey status</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Enable or disable the survey pop-up.</p>
              </div>
              <button
                type="button"
                onClick={() => updateConfig({ enabled: !config.enabled })}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  config.enabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {config.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleFirestoreTest}
                disabled={firestoreTest === 'running'}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {firestoreTest === 'running' ? 'Testing…' : 'Test Firestore write'}
              </button>
              {firestoreTest !== 'idle' ? (
                <span
                  className={`text-xs ${
                    firestoreTest === 'success'
                      ? 'text-emerald-600'
                      : firestoreTest === 'error'
                      ? 'text-red-500'
                      : 'text-slate-500'
                  }`}
                >
                  {firestoreTestMessage}
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Timing</h3>
              <div className="mt-3 space-y-3 text-sm">
                <label className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 dark:text-slate-300">Auto-open min (ms)</span>
                  <input
                    type="number"
                    min={0}
                    value={config.autoOpenMinMs}
                    onChange={(event) => updateConfig({ autoOpenMinMs: Number(event.target.value) })}
                    className="w-28 rounded-md border border-slate-200 px-2 py-1 text-right dark:border-slate-700 dark:bg-slate-900"
                  />
                </label>
                <label className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 dark:text-slate-300">Auto-open max (ms)</span>
                  <input
                    type="number"
                    min={0}
                    value={config.autoOpenMaxMs}
                    onChange={(event) => updateConfig({ autoOpenMaxMs: Number(event.target.value) })}
                    className="w-28 rounded-md border border-slate-200 px-2 py-1 text-right dark:border-slate-700 dark:bg-slate-900"
                  />
                </label>
                <label className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 dark:text-slate-300">Reminder min (ms)</span>
                  <input
                    type="number"
                    min={0}
                    value={config.reminderMinMs}
                    onChange={(event) => updateConfig({ reminderMinMs: Number(event.target.value) })}
                    className="w-28 rounded-md border border-slate-200 px-2 py-1 text-right dark:border-slate-700 dark:bg-slate-900"
                  />
                </label>
                <label className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 dark:text-slate-300">Reminder max (ms)</span>
                  <input
                    type="number"
                    min={0}
                    value={config.reminderMaxMs}
                    onChange={(event) => updateConfig({ reminderMaxMs: Number(event.target.value) })}
                    className="w-28 rounded-md border border-slate-200 px-2 py-1 text-right dark:border-slate-700 dark:bg-slate-900"
                  />
                </label>
                <label className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 dark:text-slate-300">Cooldown (hours)</span>
                  <input
                    type="number"
                    min={1}
                    value={config.cooldownHours}
                    onChange={(event) => updateConfig({ cooldownHours: Number(event.target.value) })}
                    className="w-28 rounded-md border border-slate-200 px-2 py-1 text-right dark:border-slate-700 dark:bg-slate-900"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Question visibility</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hide questions from the survey flow.</p>
              <div className="mt-3 space-y-2 max-h-72 overflow-auto">
                {Object.values(SURVEY_QUESTIONS).map((question) => {
                  const hidden = config.hiddenQuestionIds.includes(question.id);
                  return (
                    <label key={question.id} className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                      <span>{question.label}</span>
                      <input
                        type="checkbox"
                        checked={!hidden}
                        onChange={() => {
                          const nextHidden = hidden
                            ? config.hiddenQuestionIds.filter((id) => id !== question.id)
                            : [...config.hiddenQuestionIds, question.id];
                          updateConfig({ hiddenQuestionIds: nextHidden });
                        }}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
            Configuration changes are stored locally in your browser for now. Wire them to Firestore when you want shared admin control.
          </div>
        </div>
      ) : null}

      {activeTab === 'preview' ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Survey preview</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Preview the survey flow with current configuration and hidden questions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const url = `/surveys/khuyoot-validation/preview?open=1`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Open preview
                </button>
                <button
                  type="button"
                  onClick={resetPreview}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Steps available: {previewSteps.length}
            </div>
          </div>

          <SurveyModal
            isOpen={previewOpen}
            questionId={previewQuestionId}
            currentStep={previewStep}
            totalSteps={previewSteps.length || 1}
            answers={previewAnswers}
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
      ) : null}

      {activeTab === 'results' ? (
        <>
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Total sessions" value={counts.total} />
        <SummaryCard label="Completed" value={counts.completed} />
        <SummaryCard label="In progress" value={counts.inProgress} />
        <SummaryCard label="Skipped" value={counts.skipped} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <BreakdownList title="By country" items={aggregations.byCountry} />
        <BreakdownList title="By persona" items={aggregations.byPersona} />
        <BreakdownList title="Stitch frequency" items={aggregations.byStitchFrequency} />
        <BreakdownList title="Spend range" items={aggregations.bySpendRange} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BreakdownList title="Willing to pay" items={aggregations.byWillingness} />
        <BreakdownList title="Top pain points" items={aggregations.topPainPoints} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <button
          type="button"
          onClick={handleExportCsv}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Export (CSV for Sheets)
        </button>
        <button
          type="button"
          onClick={handleExportJson}
          className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200"
        >
          Export JSON
        </button>
        <select
          value={dateRangeDays}
          onChange={(event) => setDateRangeDays(Number(event.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          {DATE_RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="all">All statuses</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In progress</option>
          <option value="skipped">Skipped</option>
        </select>
        <select
          value={filterCountry}
          onChange={(event) => setFilterCountry(event.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="all">All countries</option>
          <option value="oman">Oman</option>
          <option value="tunisia">Tunisia</option>
          <option value="morocco">Morocco</option>
          <option value="algeria">Algeria</option>
          <option value="libya">Libya</option>
          <option value="other">Other</option>
        </select>
        <select
          value={filterPersona}
          onChange={(event) => setFilterPersona(event.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="all">All personas</option>
          <option value="self">Self</option>
          <option value="family">Family</option>
          <option value="tailoring_business">Tailoring business</option>
          <option value="exploring">Exploring</option>
        </select>
        <button
          type="button"
          onClick={() => loadResponses(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Refresh
        </button>
        {indexFallback ? (
          <span className="text-xs text-amber-600">
            Using client-side filtering due to missing Firestore index.
          </span>
        ) : null}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-left">Country</th>
              <th className="px-4 py-3 text-left">Persona</th>
              <th className="px-4 py-3 text-left">Frequency</th>
              <th className="px-4 py-3 text-left">Spend</th>
              <th className="px-4 py-3 text-left">Pay for try-on</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {filteredResponses.map((response) => (
              <tr key={response.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3">{formatDate(response.createdAt)}</td>
                <td className="px-4 py-3">{response.answers?.country ?? '—'}</td>
                <td className="px-4 py-3">{response.answers?.persona ?? '—'}</td>
                <td className="px-4 py-3">{response.answers?.stitch_frequency ?? '—'}</td>
                <td className="px-4 py-3">{response.answers?.spend_per_outfit ?? '—'}</td>
                <td className="px-4 py-3">{response.answers?.willing_to_pay_tryon ?? '—'}</td>
                <td className="px-4 py-3">{response.status ?? '—'}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setSelected(response)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 text-xs text-slate-400">
          <span>Showing {filteredResponses.length} results</span>
          <button
            type="button"
            onClick={() => loadResponses(false)}
            disabled={loading}
            className="text-blue-600 hover:text-blue-700 disabled:text-slate-400"
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      </div>

      <DetailsDrawer response={selected} onClose={() => setSelected(null)} />
        </>
      ) : null}
    </div>
  );
};
