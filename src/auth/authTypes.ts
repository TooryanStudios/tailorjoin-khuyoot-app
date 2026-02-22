/**
 * src/auth/authTypes.ts
 */

export type UserRole = 'customer' | 'tailor' | 'fabric_shop' | 'admin';
export type AccountTier = 'free' | 'pro' | 'enterprise';

export interface BillingInfo {
  credits: number;
  tier: AccountTier;
  nextBillingDate?: string; // ISO string
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'none';
}

export interface UserProfileMetadata {
  bio?: string;
  location?: string;
  specialty?: string[]; // e.g., ["Silk", "Embroidery"] for tailors
  completedOrders: number;
  rating?: number;
}

// The Unified User Object used across the UI
export interface AuthUser {
  // Core Identity (from 'users' collection)
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  _isDefaultRole?: boolean; // Marker for temporary placeholder state

  // Enriched Data (from 'user_profiles' collection)
  billing: BillingInfo;
  metadata: UserProfileMetadata;

  adminAccess?: {
    mode?: 'full' | 'limited';
    sections?: string[];
    deniedSections?: string[];
    configSections?: string[];
    deniedConfigSections?: string[];
  };
  adminPermissions?: {
    mode?: 'full' | 'limited';
    sections?: string[];
    deniedSections?: string[];
    configSections?: string[];
    deniedConfigSections?: string[];
  };

  // Helpers for legacy field mapping
  fullName?: string; // Maps to displayName
  avatar?: string;   // Maps to photoURL
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  idToken: string | null;
  isVerifying?: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  status: AuthStatus;
  idToken: string | null;
  login: (email: string, pass: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  requireAuth: () => AuthUser;
  refreshProfile: () => Promise<void>;
}