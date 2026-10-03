/* Dark / Bright public toggle — REV29
   Stage 4: persist the visitor's explicit theme choice in this browser. */
(function () {
  'use strict';

  var root = document.documentElement;
  var storageKey = 'marklynx-theme';

  function readSavedTheme() {
    try {
      var saved = localStorage.getItem(storageKey);
      return saved === 'dark' || saved === 'bright' ? saved : null;
    } catch (e) {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(storageKey, theme);
    } catch (e) {
      // If browser storage is unavailable, the toggle still works for this page.
    }
  }

  var savedTheme = readSavedTheme();
  if (savedTheme) root.setAttribute('data-theme', savedTheme);

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
        saveTheme(next);
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
