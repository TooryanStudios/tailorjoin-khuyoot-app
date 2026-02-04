import type { AuthState, AuthStatus, AuthUser } from './authTypes';

const initialState: AuthState = {
  status: 'loading',
  user: null,
  idToken: null,
};

let snapshot: AuthState = initialState;

export function setAuthStateSnapshot(next: AuthState): void {
  snapshot = next;
}

export function getAuthStateSnapshot(): AuthState {
  return snapshot;
}

export function setAuthTokenSnapshot(params: {
  status?: AuthStatus;
  user?: AuthUser | null;
  idToken?: string | null;
}): void {
  snapshot = {
    status: params.status ?? snapshot.status,
    user: params.user === undefined ? snapshot.user : params.user,
    idToken: params.idToken === undefined ? snapshot.idToken : params.idToken,
  };
}
