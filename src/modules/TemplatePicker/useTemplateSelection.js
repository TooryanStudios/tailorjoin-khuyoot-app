import { useCallback, useState } from 'react';

/**
 * @typedef {{ premium?: boolean; label?: string; source?: 'studio'|'shop'|'closet' }} TemplateMeta
 * @typedef {{ id: string; name: string; imageUrl: string; thumbnailUrl: string; meta?: TemplateMeta; file?: File }} Template
 */

/**
 * Manages currently selected template. Intended to be imported by any page/sidebar
 * without forcing changes to core app logic.
 *
 * @param {Template | null} initialTemplate
 */
export const useTemplateSelection = (initialTemplate = null) => {
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate);

  /** @param {Template | null} templateData */
  const selectTemplate = useCallback((templateData) => {
    setSelectedTemplate(templateData);

    if (templateData?.id) {
      // eslint-disable-next-line no-console
      console.log('Template updated to:', templateData.id);
    }
  }, []);

  return { selectedTemplate, selectTemplate };
};
