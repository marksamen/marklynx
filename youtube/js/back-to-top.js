/* SEASONAL-CHRISTMAS-REFINEMENT PROD REV01: isolated global back-to-top control. */
(() => {
  'use strict';
  const button = document.getElementById('mlBackToTop');
  if (!button) return;
  const root = document.documentElement;
  const labels = {
    en: 'Back to top', de: 'Nach oben', es: 'Volver arriba',
    fr: 'Retour en haut', it: 'Torna in alto', pt: 'Voltar ao topo'
  };
  const syncLabel = () => {
    const label = labels[(root.lang || 'en').toLowerCase().split('-')[0]] || labels.en;
    button.setAttribute('aria-label', label);
    button.title = label;
  };
  let pending = false;
  const sync = () => {
    pending = false;
    // One viewport, bounded so the control is usable even on long mobile lists.
    const threshold = Math.min(600, Math.max(240, window.innerHeight * 0.75));
    const hidden = window.scrollY < threshold;
    if (button.hidden !== hidden) button.hidden = hidden;
  };
  const schedule = () => {
    if (!pending) { pending = true; requestAnimationFrame(sync); }
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  new MutationObserver(syncLabel).observe(root, { attributes: true, attributeFilter: ['lang'] });
  button.addEventListener('click', event => {
    // Keyboard and assistive-technology activation return focus to the first top control.
    if (event.detail === 0) document.getElementById('themeToggleBtn')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });
  syncLabel();
  sync();
})();
