import type { SurveyAnswers, SurveyStatus } from './config';

export const STORAGE_VERSION = 1;

export const STORAGE_KEYS = {
  sessionId: 'khuyoot.survey.v1.sessionId',
  status: 'khuyoot.survey.v1.status',
  currentStep: 'khuyoot.survey.v1.currentStep',
  answers: 'khuyoot.survey.v1.answers',
  lastAutoOpenAt: 'khuyoot.survey.v1.lastAutoOpenAt',
  cooldownUntil: 'khuyoot.survey.v1.cooldownUntil',
  remindedThisSession: 'khuyoot.survey.v1.remindedThisSession',
  autoOpenedThisSession: 'khuyoot.survey.v1.autoOpenedThisSession',
  version: 'khuyoot.survey.v1.version',
  config: 'khuyoot.survey.v1.config',
} as const;

const SESSION_SCOPE_KEY = 'khuyoot.survey.v1.sessionScopeId';
export const SURVEY_CONFIG_EVENT = 'khuyoot:survey:config';

export type SurveyLocalState = {
  version: number;
  sessionId: string | null;
  status: SurveyStatus | null;
  currentStep: number;
  answers: SurveyAnswers;
  lastAutoOpenAt: number | null;
  cooldownUntil: number | null;
  remindedThisSession: boolean;
  autoOpenedThisSession: boolean;
};

export type SurveyConfig = {
  enabled: boolean;
  cooldownHours: number;
  autoOpenMinMs: number;
  autoOpenMaxMs: number;
  reminderMinMs: number;
  reminderMaxMs: number;
  hiddenQuestionIds: string[];
};

const DEFAULT_SURVEY_CONFIG: SurveyConfig = {
  enabled: true,
  cooldownHours: 24,
  autoOpenMinMs: 2000,
  autoOpenMaxMs: 5000,
  reminderMinMs: 60000,
  reminderMaxMs: 90000,
  hiddenQuestionIds: [],
};

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const loadSurveyLocalState = (): SurveyLocalState => {
  const version = Number(localStorage.getItem(STORAGE_KEYS.version) || STORAGE_VERSION);
  const sessionId = localStorage.getItem(STORAGE_KEYS.sessionId);
  const status = localStorage.getItem(STORAGE_KEYS.status) as SurveyStatus | null;
  const currentStep = Number(localStorage.getItem(STORAGE_KEYS.currentStep) || 0);
  const answers = safeParse<SurveyAnswers>(localStorage.getItem(STORAGE_KEYS.answers), {});
  const lastAutoOpenAt = Number(localStorage.getItem(STORAGE_KEYS.lastAutoOpenAt) || 0) || null;
  const cooldownUntil = Number(localStorage.getItem(STORAGE_KEYS.cooldownUntil) || 0) || null;
  const remindedThisSession = localStorage.getItem(STORAGE_KEYS.remindedThisSession) === 'true';
  const autoOpenedThisSession = localStorage.getItem(STORAGE_KEYS.autoOpenedThisSession) === 'true';

  return {
    version,
    sessionId,
    status,
    currentStep: Number.isFinite(currentStep) ? currentStep : 0,
    answers: answers || {},
    lastAutoOpenAt,
    cooldownUntil,
    remindedThisSession,
    autoOpenedThisSession,
  };
};

export const saveSurveyLocalState = (partial: Partial<SurveyLocalState>) => {
  if (partial.version !== undefined) localStorage.setItem(STORAGE_KEYS.version, String(partial.version));
  if (partial.sessionId !== undefined && partial.sessionId !== null) localStorage.setItem(STORAGE_KEYS.sessionId, partial.sessionId);
  if (partial.status !== undefined && partial.status !== null) localStorage.setItem(STORAGE_KEYS.status, partial.status);
  if (partial.currentStep !== undefined) localStorage.setItem(STORAGE_KEYS.currentStep, String(partial.currentStep));
  if (partial.answers !== undefined) localStorage.setItem(STORAGE_KEYS.answers, JSON.stringify(partial.answers));
  if (partial.lastAutoOpenAt !== undefined && partial.lastAutoOpenAt !== null) localStorage.setItem(STORAGE_KEYS.lastAutoOpenAt, String(partial.lastAutoOpenAt));
  if (partial.cooldownUntil !== undefined && partial.cooldownUntil !== null) localStorage.setItem(STORAGE_KEYS.cooldownUntil, String(partial.cooldownUntil));
  if (partial.remindedThisSession !== undefined) localStorage.setItem(STORAGE_KEYS.remindedThisSession, String(partial.remindedThisSession));
  if (partial.autoOpenedThisSession !== undefined) localStorage.setItem(STORAGE_KEYS.autoOpenedThisSession, String(partial.autoOpenedThisSession));
};

export const setCooldownUntil = (timestamp: number | null) => {
  if (timestamp) {
    localStorage.setItem(STORAGE_KEYS.cooldownUntil, String(timestamp));
  } else {
    localStorage.removeItem(STORAGE_KEYS.cooldownUntil);
  }
};

export const markAutoOpenedThisSession = () => {
  localStorage.setItem(STORAGE_KEYS.autoOpenedThisSession, 'true');
};

export const markRemindedThisSession = () => {
  localStorage.setItem(STORAGE_KEYS.remindedThisSession, 'true');
};

export const resetSessionFlags = () => {
  localStorage.setItem(STORAGE_KEYS.remindedThisSession, 'false');
  localStorage.setItem(STORAGE_KEYS.autoOpenedThisSession, 'false');
};

export const ensureSessionScope = (): boolean => {
  if (typeof sessionStorage === 'undefined') return false;
  const existing = sessionStorage.getItem(SESSION_SCOPE_KEY);
  if (existing) return false;
  const scopeId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now());
  sessionStorage.setItem(SESSION_SCOPE_KEY, scopeId);
  return true;
};

export const loadSurveyConfig = (): SurveyConfig => {
  const raw = localStorage.getItem(STORAGE_KEYS.config);
  const parsed = safeParse<SurveyConfig | null>(raw, null);
  if (!parsed) return DEFAULT_SURVEY_CONFIG;
  return {
    ...DEFAULT_SURVEY_CONFIG,
    ...parsed,
    hiddenQuestionIds: Array.isArray(parsed.hiddenQuestionIds) ? parsed.hiddenQuestionIds : [],
  };
};

export const saveSurveyConfig = (next: SurveyConfig) => {
  localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(next));
  try {
    window.dispatchEvent(new Event(SURVEY_CONFIG_EVENT));
  } catch {
    // ignore
  }
};
