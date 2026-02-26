export type AdminSection =
  | 'dashboard'
  | 'orders'
  | 'approvals'
  | 'users'
  | 'tailors'
  | 'boutiques'
  | 'shops'
  | 'products'
  | 'orphaned-products'
  | 'fabrics'
  | 'measurements'
  | 'family'
  | 'ai'
  | 'store'
  | 'images'
  | 'tryon-templates'
  | 'notifications'
  | 'ads'
  | 'regions'
  | 'financial'
  | 'credits'
  | 'settings'
  | 'debug-tools'
  | 'config'
  | 'logs';

export type AdminConfigSection =
  | 'general'
  | 'homepage'
  | 'landing-page'
  | 'designer'
  | 'texts'
  | 'social'
  | 'seo'
  | 'advanced'
  | 'product-page'
  | 'debug-tools';

export interface AdminAccessConfig {
  mode?: 'full' | 'limited';
  sections?: string[];
  deniedSections?: string[];
  configSections?: string[];
  deniedConfigSections?: string[];
}

export interface AdminAccessPolicy {
  mode: 'full' | 'limited' | 'none';
  allowedSections: Set<string>;
  deniedSections: Set<string>;
  allowedConfigSections: Set<string>;
  deniedConfigSections: Set<string>;
}

const toSet = (value: unknown): Set<string> => {
  if (!Array.isArray(value)) return new Set<string>();
  return new Set(
    value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
};

const readAccessConfig = (user: any): AdminAccessConfig | null => {
  if (!user || typeof user !== 'object') return null;

  const fromAdminAccess = user.adminAccess;
  if (fromAdminAccess && typeof fromAdminAccess === 'object') {
    return fromAdminAccess as AdminAccessConfig;
  }

  const fromAdminPermissions = user.adminPermissions;
  if (fromAdminPermissions && typeof fromAdminPermissions === 'object') {
    return fromAdminPermissions as AdminAccessConfig;
  }

  return null;
};

export function buildAdminAccessPolicy(user: any): AdminAccessPolicy {
  const role = String(user?.role || '').toLowerCase();
  const accessMode = String(user?.adminAccess?.mode || '').toLowerCase();
  const permissionsMode = String(user?.adminPermissions?.mode || '').toLowerCase();
  const hasAdminMode =
    accessMode === 'full' ||
    accessMode === 'unlimited' ||
    accessMode === 'limited' ||
    permissionsMode === 'full' ||
    permissionsMode === 'unlimited' ||
    permissionsMode === 'limited';

  if (role !== 'admin' && !hasAdminMode) {
    return {
      mode: 'none',
      allowedSections: new Set(),
      deniedSections: new Set(),
      allowedConfigSections: new Set(),
      deniedConfigSections: new Set(),
    };
  }

  const config = readAccessConfig(user);

  if (!config) {
    return {
      mode: 'full',
      allowedSections: new Set(['*']),
      deniedSections: new Set(),
      allowedConfigSections: new Set(['*']),
      deniedConfigSections: new Set(),
    };
  }

  const rawMode = String(config.mode || '').toLowerCase();
  const mode = rawMode === 'limited' ? 'limited' : 'full';
  const allowedSections = toSet(config.sections);
  const deniedSections = toSet(config.deniedSections);
  const allowedConfigSections = toSet(config.configSections);
  const deniedConfigSections = toSet(config.deniedConfigSections);

  if (allowedSections.has('*') || mode === 'full') {
    allowedSections.add('*');
  }

  if (allowedConfigSections.has('*') || mode === 'full') {
    allowedConfigSections.add('*');
  }

  if (mode === 'limited') {
    const hasWildcardConfigAccess = allowedConfigSections.has('*');
    const hasAnySpecificConfigAccess = Array.from(allowedConfigSections).some(
      (section) => section !== '*' && !deniedConfigSections.has(section)
    );

    if ((hasWildcardConfigAccess || hasAnySpecificConfigAccess) && !deniedSections.has('config')) {
      allowedSections.add('config');
    }

    if (
      (hasWildcardConfigAccess || allowedConfigSections.has('debug-tools')) &&
      !deniedSections.has('debug-tools') &&
      !deniedConfigSections.has('debug-tools')
    ) {
      allowedSections.add('debug-tools');
    }
  }

  return {
    mode,
    allowedSections,
    deniedSections,
    allowedConfigSections,
    deniedConfigSections,
  };
}

export function canAccessAdminSection(policy: AdminAccessPolicy, section: string): boolean {
  const sectionKey = String(section || '').trim().toLowerCase();
  if (!sectionKey || policy.mode === 'none') return false;
  if (policy.deniedSections.has(sectionKey)) return false;
  if (policy.mode === 'full' || policy.allowedSections.has('*')) return true;
  return policy.allowedSections.has(sectionKey);
}

export function canAccessAdminConfigSection(policy: AdminAccessPolicy, configSection: string): boolean {
  const sectionKey = String(configSection || '').trim().toLowerCase();
  if (!sectionKey || policy.mode === 'none') return false;
  if (policy.deniedConfigSections.has(sectionKey)) return false;
  if (policy.mode === 'full' || policy.allowedConfigSections.has('*')) return true;
  return policy.allowedConfigSections.has(sectionKey);
}

export function getFirstAllowedSection(
  policy: AdminAccessPolicy,
  preferredOrder: ReadonlyArray<AdminSection>
): AdminSection | null {
  for (const section of preferredOrder) {
    if (canAccessAdminSection(policy, section)) {
      return section;
    }
  }
  return null;
}

export function getFirstAllowedConfigSection(
  policy: AdminAccessPolicy,
  preferredOrder: ReadonlyArray<AdminConfigSection>
): AdminConfigSection | null {
  for (const section of preferredOrder) {
    if (canAccessAdminConfigSection(policy, section)) {
      return section;
    }
  }
  return null;
}
