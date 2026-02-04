// IMPORTANT: This module must re-export the *main app* Firebase singleton.
// Pointing at tailorjoin creates a second Firebase app/auth instance, which causes
// auth/session restoration bugs (e.g., Designer history thinks you're logged out).
export { firebaseService, db, storage } from '../../services/firebase';
// HMR trigger
