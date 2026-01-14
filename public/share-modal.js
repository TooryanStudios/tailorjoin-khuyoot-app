// Defensive no-op share modal script.
// This file exists to prevent runtime errors if something references `/share-modal.js`.
// Wrapped in try-catch and checks DOM elements exist before adding listeners.

(function () {
  'use strict';
  
  try {
    // If someone is trying to reference DOM elements, check they exist first
    if (typeof document !== 'undefined') {
      const checkAndAttach = () => {
        // Common share modal element IDs that might be referenced
        const elementIds = ['share-modal', 'share-btn', 'share-close', 'share-overlay'];
        
        elementIds.forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            // Element exists, safe to attach (but we do nothing)
          }
        });
      };
      
      // Run after DOM loads if we're loaded early
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndAttach);
      } else {
        checkAndAttach();
      }
    }
  } catch (e) {
    // Silently fail - this is intentional
  }
})();
