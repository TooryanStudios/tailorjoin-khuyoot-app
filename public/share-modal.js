// Defensive no-op share modal script.
// Some environments/pages may include /share-modal.js; this prevents runtime crashes.

(function () {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function () {
    // Update these selectors if/when a real share modal is implemented.
    var modal = document.getElementById('share-modal');
    if (!modal) return;

    var openBtn = document.querySelector('[data-share-open]');
    var closeBtn = document.querySelector('[data-share-close]');
    var backdrop = document.querySelector('[data-share-backdrop]');

    function open() {
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
    }

    function close() {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    }

    if (openBtn && openBtn.addEventListener) openBtn.addEventListener('click', open);
    if (closeBtn && closeBtn.addEventListener) closeBtn.addEventListener('click', close);
    if (backdrop && backdrop.addEventListener) {
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) close();
      });
    }

    // Escape to close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  });
})();
