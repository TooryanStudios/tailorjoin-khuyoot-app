// Defensive no-op share modal script.
// This file exists to prevent runtime errors if referenced by external scripts or cache.
// It does nothing and will not throw errors.

(function () {
  'use strict';
  
  // Safe no-op implementation
  try {
    // Only run if document is available
    if (typeof document === 'undefined') return;
    
    function ready(fn) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn, { once: true });
      } else {
        fn();
      }
    }

    ready(function () {
      // Safely check for modal elements without throwing errors
      try {
        var modal = document.getElementById('share-modal');
        if (!modal) return;

        var openBtn = document.querySelector('[data-share-open]');
        var closeBtn = document.querySelector('[data-share-close]');
        var backdrop = document.querySelector('[data-share-backdrop]');

        function open() {
          if (modal) {
            modal.classList.remove('hidden');
            modal.setAttribute('aria-hidden', 'false');
          }
        }

        function close() {
          if (modal) {
            modal.classList.add('hidden');
            modal.setAttribute('aria-hidden', 'true');
          }
        }

        if (openBtn && openBtn.addEventListener) {
          openBtn.addEventListener('click', open);
        }
        if (closeBtn && closeBtn.addEventListener) {
          closeBtn.addEventListener('click', close);
        }
        if (backdrop && backdrop.addEventListener) {
          backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) close();
          });
        }

        // Escape to close
        if (document.addEventListener) {
          document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') close();
          });
        }
      } catch (e) {
        // Silently ignore any errors
      }
    });
  } catch (e) {
    // Silently ignore any errors at top level
  }
})();
