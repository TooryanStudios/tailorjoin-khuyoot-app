import { useState, useCallback, useMemo } from 'react';
import { CardGridSectionProps } from '../components/ui/CardGridSection';

export interface SectionConfig {
  id: string;
  enabled: boolean;
  order: number;
}

export interface UseSectionsOptions {
  sections: Omit<CardGridSectionProps, 'enabled'>[];
  initialConfig?: SectionConfig[];
  storageKey?: string; // For persisting to localStorage
}

export interface UseSectionsReturn {
  /** Sections sorted by order with enabled flag applied */
  orderedSections: CardGridSectionProps[];
  /** Current configuration */
  config: SectionConfig[];
  /** Toggle a section on/off */
  toggleSection: (id: string) => void;
  /** Enable a section */
  enableSection: (id: string) => void;
  /** Disable a section */
  disableSection: (id: string) => void;
  /** Move section to a new position (0-indexed) */
  moveSection: (id: string, newIndex: number) => void;
  /** Swap two sections */
  swapSections: (idA: string, idB: string) => void;
  /** Reset to default configuration */
  resetConfig: () => void;
  /** Check if a section is enabled */
  isSectionEnabled: (id: string) => boolean;
  /** Get section order */
  getSectionOrder: (id: string) => number;
}

export const useSections = ({
  sections,
  initialConfig,
  storageKey,
}: UseSectionsOptions): UseSectionsReturn => {
  // Generate default config from sections array order
  const defaultConfig: SectionConfig[] = sections.map((s, index) => ({
    id: s.id,
    enabled: true,
    order: index,
  }));

  // Try to load from localStorage if storageKey provided
  const loadStoredConfig = (): SectionConfig[] => {
    if (!storageKey) return initialConfig || defaultConfig;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with default to handle new sections
        return defaultConfig.map((def) => {
          const found = parsed.find((p: SectionConfig) => p.id === def.id);
          return found || def;
        });
      }
    } catch (e) {
      console.warn('Failed to load sections config:', e);
    }
    return initialConfig || defaultConfig;
  };

  const [config, setConfig] = useState<SectionConfig[]>(loadStoredConfig);

  // Persist to localStorage when config changes
  const updateConfig = useCallback(
    (newConfig: SectionConfig[]) => {
      setConfig(newConfig);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(newConfig));
        } catch (e) {
          console.warn('Failed to save sections config:', e);
        }
      }
    },
    [storageKey]
  );

  const toggleSection = useCallback(
    (id: string) => {
      updateConfig(
        config.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
      );
    },
    [config, updateConfig]
  );

  const enableSection = useCallback(
    (id: string) => {
      updateConfig(
        config.map((c) => (c.id === id ? { ...c, enabled: true } : c))
      );
    },
    [config, updateConfig]
  );

  const disableSection = useCallback(
    (id: string) => {
      updateConfig(
        config.map((c) => (c.id === id ? { ...c, enabled: false } : c))
      );
    },
    [config, updateConfig]
  );

  const moveSection = useCallback(
    (id: string, newIndex: number) => {
      const sorted = [...config].sort((a, b) => a.order - b.order);
      const currentIndex = sorted.findIndex((c) => c.id === id);
      if (currentIndex === -1 || currentIndex === newIndex) return;

      // Remove and insert at new position
      const [item] = sorted.splice(currentIndex, 1);
      sorted.splice(newIndex, 0, item);

      // Reassign orders
      const newConfig = sorted.map((c, idx) => ({ ...c, order: idx }));
      updateConfig(newConfig);
    },
    [config, updateConfig]
  );

  const swapSections = useCallback(
    (idA: string, idB: string) => {
      const indexA = config.findIndex((c) => c.id === idA);
      const indexB = config.findIndex((c) => c.id === idB);
      if (indexA === -1 || indexB === -1) return;

      const newConfig = [...config];
      const orderA = newConfig[indexA].order;
      newConfig[indexA] = { ...newConfig[indexA], order: newConfig[indexB].order };
      newConfig[indexB] = { ...newConfig[indexB], order: orderA };
      updateConfig(newConfig);
    },
    [config, updateConfig]
  );

  const resetConfig = useCallback(() => {
    updateConfig(defaultConfig);
  }, [defaultConfig, updateConfig]);

  const isSectionEnabled = useCallback(
    (id: string) => config.find((c) => c.id === id)?.enabled ?? false,
    [config]
  );

  const getSectionOrder = useCallback(
    (id: string) => config.find((c) => c.id === id)?.order ?? -1,
    [config]
  );

  // Merge sections with config and sort by order
  const orderedSections = useMemo(() => {
    return sections
      .map((section) => {
        const cfg = config.find((c) => c.id === section.id);
        return {
          ...section,
          enabled: cfg?.enabled ?? true,
          _order: cfg?.order ?? 999,
        };
      })
      .sort((a, b) => a._order - b._order)
      .map(({ _order, ...rest }) => rest as CardGridSectionProps);
  }, [sections, config]);

  return {
    orderedSections,
    config,
    toggleSection,
    enableSection,
    disableSection,
    moveSection,
    swapSections,
    resetConfig,
    isSectionEnabled,
    getSectionOrder,
  };
};

export default useSections;
