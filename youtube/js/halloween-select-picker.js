/* Halloween-only desktop picker sizing. Preserve native widths; leave mobile filters and other seasons alone. */
(() => {
  'use strict';
  if (!window.CSS || !CSS.supports('appearance','base-select') || !CSS.supports('selector(::picker(select))')) return;
  const root = document.documentElement;
  const desktop = matchMedia('(min-width:901px) and (min-height:501px) and (pointer:fine)');
  const selector = '.toolbar select, #siteLanguageSelect';
  const marker = 'data-ml-halloween-picker';
  const width = '--ml-halloween-picker-width', height = '--ml-halloween-picker-height';
  let queued = false, pending = false;
  const controls = () => Array.from(document.querySelectorAll(selector));
  const clear = el => {el.removeAttribute(marker);el.style.removeProperty(width);el.style.removeProperty(height);};
  function refresh() {
    queued = false;
    const selects = controls();
    if (!desktop.matches || root.dataset.seasonalTheme !== 'halloween') {
      selects.filter(el => el.hasAttribute(marker)).forEach(clear); pending = false; return;
    }
    // Do not close a picker while its visitor is choosing an option.
    if (selects.some(el => el.hasAttribute(marker) && el.matches(':open'))) { pending = true; return; }
    pending = false;
    // Remove all opt-ins together, so the native flex layout is measured as a whole.
    selects.filter(el => el.hasAttribute(marker)).forEach(clear);
    const sizes = selects.map(el => [el, el.getBoundingClientRect()]);
    for (const [el, rect] of sizes) {
      if (!rect.width || !rect.height || el.multiple || el.size > 1) continue;
      el.style.setProperty(width, `${rect.width}px`);
      el.style.setProperty(height, `${rect.height}px`);
      el.setAttribute(marker, '');
    }
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(refresh); } }
  new MutationObserver(schedule).observe(root, {attributes:true, attributeFilter:['data-seasonal-theme','data-theme','lang']});
  new MutationObserver(records => {
    if (records.some(record => {
      const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      if (target?.closest(selector)) return true;
      return Array.from(record.addedNodes).some(node => node.nodeType === 1 && (node.matches(selector) || node.querySelector(selector)));
    })) schedule();
  }).observe(document.body, {childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['label','disabled','hidden']});
  document.addEventListener('change', e => {if (e.target.matches?.(selector)) schedule();});
  document.addEventListener('focusout', e => {if (pending && e.target.closest?.(selector)) schedule();});
  document.addEventListener('toggle', e => {if (pending && e.target.matches?.(selector)) schedule();}, true);
  // Escape can close a picker without a change or focusout event.
  document.addEventListener('keydown', e => {if (pending && e.key === 'Escape') schedule();});
  addEventListener('resize', schedule);
  if (desktop.addEventListener) desktop.addEventListener('change', schedule);
  document.fonts?.ready.then(schedule);
  schedule();
})();
