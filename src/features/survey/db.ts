import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { SurveyAnswers, SurveyStatus } from './config';
import { SURVEY_ID } from './config';
import type { SurveyConfig } from './storage';

export type SurveySessionPayload = {
  sessionId: string;
  status?: SurveyStatus;
  currentStep?: number;
  answers?: SurveyAnswers;
  userId?: string | null;
  anonymousId?: string | null;
  referrer?: string | null;
  utm?: { source?: string | null; medium?: string | null; campaign?: string | null } | null;
  device?: { lang?: string | null; platform?: string | null; userAgent?: string | null } | null;
  geo?: { country: string | null; region: string | null; source: 'user_selected' | 'none' } | null;
  deviceFingerprint?: string;
  userRole?: string | null;
};

const sessionsCollection = () => collection(db, 'surveySessions');
const configDoc = () => doc(db, 'surveyConfigs', SURVEY_ID);

export const createOrLoadSession = async (payload: SurveySessionPayload) => {
  const ref = doc(sessionsCollection(), payload.sessionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      surveyId: SURVEY_ID,
      status: payload.status ?? 'in_progress',
      currentStep: payload.currentStep ?? 0,
      answers: payload.answers ?? {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      completedAt: null,
      skippedAt: null,
      userId: payload.userId ?? null,
      anonymousId: payload.anonymousId ?? payload.sessionId,
      linkedToUserAt: payload.userId ? serverTimestamp() : null,
      referrer: payload.referrer ?? null,
      utm: payload.utm ?? null,
      device: payload.device ?? null,
      geo: payload.geo ?? { country: null, region: null, source: 'none' },
      deviceFingerprint: payload.deviceFingerprint ?? null,
      userRole: payload.userRole ?? null,
    });
    return { exists: false, data: null } as const;
  }
  return { exists: true, data: snap.data() } as const;
};

export const saveProgress = async (
  sessionId: string,
  payload: { status?: SurveyStatus; currentStep?: number; answers?: SurveyAnswers; geo?: { country: string | null; region: string | null; source: 'user_selected' | 'none' } }
) => {
  const ref = doc(sessionsCollection(), sessionId);
  await setDoc(
    ref,
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const markSkipped = async (sessionId: string) => {
  const ref = doc(sessionsCollection(), sessionId);
  await updateDoc(ref, {
    status: 'skipped',
    skippedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const markCompleted = async (sessionId: string) => {
  const ref = doc(sessionsCollection(), sessionId);
  await updateDoc(ref, {
    status: 'completed',
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const linkToUser = async (sessionId: string, uid: string) => {
  const ref = doc(sessionsCollection(), sessionId);
  await updateDoc(ref, {
    userId: uid,
    linkedToUserAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getSurveyConfig = async (): Promise<SurveyConfig | null> => {
  const snap = await getDoc(configDoc());
  if (!snap.exists()) return null;
  return snap.data() as SurveyConfig;
};

export const saveSurveyConfigRemote = async (config: SurveyConfig) => {
  await setDoc(
    configDoc(),
    {
      ...config,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const watchSurveyConfig = (onChange: (config: SurveyConfig | null) => void) => {
  return onSnapshot(configDoc(), (snap) => {
    if (!snap.exists()) {
      onChange(null);
      return;
    }
    onChange(snap.data() as SurveyConfig);
  });
};
