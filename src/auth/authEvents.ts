export type AuthPromptReason =
  | 'user_action'
  | 'session_expired'
  | 'unauthorized'
  | 'signed_out'
  | 'credits'
  | 'generation'
  | 'unknown';

const EVENT_NAME = 'khuyoot:auth:requestLogin';

export function requestLoginPrompt(reason: AuthPromptReason = 'unknown'): void {
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { reason } }));
  } catch {
    // ignore
  }
}

export function getAuthPromptEventName(): string {
  return EVENT_NAME;
}
