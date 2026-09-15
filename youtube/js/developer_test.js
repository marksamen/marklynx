(() => {
  const openBtn = document.getElementById('developerShowcaseBtn');
  const overlay = document.getElementById('developerShowcaseOverlay');
  const closeBtn = document.getElementById('developerShowcaseClose');
  if (!openBtn || !overlay || !closeBtn) return;

  let lastFocus = null;
  const open = () => {
    lastFocus = document.activeElement;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('developer-modal-open');
    closeBtn.focus();
  };
  const close = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('developer-modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && overlay.classList.contains('open')) close();
  });
})();
