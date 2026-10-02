/* Dark / Bright public toggle — REV11
   Stage 3 only: switch the current page theme. Persistence comes later. */
(function () {
  'use strict';

  var root = document.documentElement;

  function syncButton() {
    var button = document.getElementById('themeToggleBtn');
    if (!button) return false;

    var bright = root.getAttribute('data-theme') === 'bright';
    var icon = button.querySelector('.theme-toggle-icon');
    var label = button.querySelector('.theme-toggle-label');

    if (icon) icon.textContent = bright ? '🌙' : '☀';
    if (label) label.textContent = bright ? 'Dark' : 'Bright';
    button.setAttribute('aria-label', bright ? 'Switch to Dark theme' : 'Switch to Bright theme');
    button.setAttribute('aria-pressed', bright ? 'true' : 'false');

    if (!button.dataset.themeToggleBound) {
      button.dataset.themeToggleBound = '1';
      button.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'bright' ? 'dark' : 'bright';
        root.setAttribute('data-theme', next);
        syncButton();
      });
    }
    return true;
  }

  if (!syncButton()) {
    var observer = new MutationObserver(function () {
      if (syncButton()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList:true, subtree:true });
  }
})();
