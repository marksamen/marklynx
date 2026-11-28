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

  // Christmas display labels only. Do not change the stored theme IDs or click logic.
  // The site language layer exposes the current locale through html.lang.
  var christmasLabels = {
    en: ['Red', 'Green', 'Switch to Red theme', 'Switch to Green theme'],
    de: ['Rot', 'Grün', 'Zum roten Design wechseln', 'Zum grünen Design wechseln'],
    es: ['Rojo', 'Verde', 'Cambiar al tema rojo', 'Cambiar al tema verde'],
    'es-mx': ['Rojo', 'Verde', 'Cambiar al tema rojo', 'Cambiar al tema verde'],
    fr: ['Rouge', 'Vert', 'Passer au thème rouge', 'Passer au thème vert'],
    it: ['Rosso', 'Verde', 'Passa al tema rosso', 'Passa al tema verde'],
    pt: ['Vermelho', 'Verde', 'Mudar para o tema vermelho', 'Mudar para o tema verde'],
    'pt-br': ['Vermelho', 'Verde', 'Mudar para o tema vermelho', 'Mudar para o tema verde']
  };
  // Halloween display labels only; bright remains Orange and dark remains Purple.
  var halloweenLabels = {
    en: ['Orange', 'Purple', 'Switch to Orange theme', 'Switch to Purple theme'],
    de: ['Orange', 'Violett', 'Zum orangefarbenen Design wechseln', 'Zum violetten Design wechseln'],
    es: ['Naranja', 'Morado', 'Cambiar al tema naranja', 'Cambiar al tema morado'],
    'es-mx': ['Naranja', 'Morado', 'Cambiar al tema naranja', 'Cambiar al tema morado'],
    fr: ['Orange', 'Violet', 'Passer au thème orange', 'Passer au thème violet'],
    it: ['Arancione', 'Viola', 'Passa al tema arancione', 'Passa al tema viola'],
    pt: ['Laranja', 'Roxo', 'Mudar para o tema laranja', 'Mudar para o tema roxo'],
    'pt-br': ['Laranja', 'Roxo', 'Mudar para o tema laranja', 'Mudar para o tema roxo']
  };
  function isHalloween() { return root.getAttribute('data-seasonal-theme') === 'halloween'; }
  function isChristmas() { return root.getAttribute('data-seasonal-theme') === 'christmas'; }
  function syncButton() {
    var button = document.getElementById('themeToggleBtn');
    if (!button) return false;

    var bright = root.getAttribute('data-theme') === 'bright';
    var icon = button.querySelector('.theme-toggle-icon');
    var label = button.querySelector('.theme-toggle-label');

    if (isChristmas()) {
      var code = (root.lang || 'en').toLowerCase();
      var words = christmasLabels[code] || christmasLabels[code.split('-')[0]] || christmasLabels.en;
      if (icon) icon.textContent = bright ? '🎄' : '❄';
      if (label) label.textContent = words[bright ? 1 : 0];
      button.setAttribute('aria-label', words[bright ? 3 : 2]);
    } else if (isHalloween()) {
      var halloweenCode = (root.lang || 'en').toLowerCase();
      var halloweenWords = halloweenLabels[halloweenCode] || halloweenLabels[halloweenCode.split('-')[0]] || halloweenLabels.en;
      if (icon) icon.textContent = bright ? '🌙' : '☀';
      if (label) label.textContent = halloweenWords[bright ? 1 : 0];
      button.setAttribute('aria-label', halloweenWords[bright ? 3 : 2]);
    } else {
      if (icon) icon.textContent = bright ? '🌙' : '☀';
      if (label) label.textContent = bright ? 'Dark' : 'Bright';
      button.setAttribute('aria-label', bright ? 'Switch to Dark theme' : 'Switch to Bright theme');
    }
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

  // Refresh seasonal display labels while either seasonal mode is active or on exit.
  // The existing language observer restores the usual localized labels on exit.
  var wasSeasonal = isChristmas() || isHalloween();
  var seasonalObserver = new MutationObserver(function () {
    var active = isChristmas() || isHalloween();
    if (active || wasSeasonal) syncButton();
    wasSeasonal = active;
  });
  seasonalObserver.observe(root, {attributes:true, attributeFilter:['data-seasonal-theme','lang']});

  if (!syncButton()) {
    var observer = new MutationObserver(function () {
      if (syncButton()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList:true, subtree:true });
  }
})();
