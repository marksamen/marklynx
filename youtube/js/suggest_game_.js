(() => {
  const openBtn = document.getElementById('suggestGameBtn');
  const overlay = document.getElementById('suggestGameOverlay');
  const closeBtn = document.getElementById('suggestGameClose');
  const form = document.getElementById('suggestGameForm');
  const panel = overlay ? overlay.querySelector('.suggest-panel') : null;
  const sendBtn = document.getElementById('suggestGameSendBtn');
  const status = document.getElementById('suggestGameFormStatus');
  const turnstileMount = document.getElementById('suggestGameTurnstile');
  const frame = document.getElementById('suggestGameSubmitFrame');
  const formStage = document.getElementById('suggestGameFormStage');
  const successPanel = document.getElementById('suggestGameSuccessPanel');
  if (!openBtn || !overlay || !closeBtn || !form) return;

  const TURNSTILE_SITE_KEY = '0x4AAAAAAE3AJPCXDRsIdRB-';
  let turnstileToken = '';
  let turnstileWidgetId = null;
  let lastFocus = null;
  let submitting = false;
  let submissionSucceeded = false;

  const setStatus = (message = '', type = '') => {
    status.textContent = message;
    status.className = `suggest-form-status${type ? ` ${type}` : ''}`;
  };

  const loadTurnstile = () => new Promise((resolve, reject) => {
    if (window.turnstile) return resolve();
    const existing = document.querySelector('script[data-marklynx-turnstile]');
    if (existing) {
      existing.addEventListener('load', resolve, { once:true });
      existing.addEventListener('error', reject, { once:true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.marklynxTurnstile = '1';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  const renderTurnstile = async () => {
    if (!turnstileMount || turnstileWidgetId !== null) return;
    try {
      await loadTurnstile();
      turnstileWidgetId = window.turnstile.render(turnstileMount, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'dark',
        action: 'suggest_game',
        callback: token => { turnstileToken = token; setStatus(''); },
        'expired-callback': () => { turnstileToken = ''; },
        'error-callback': () => { turnstileToken = ''; setStatus('Human verification could not load. Please try again.', 'error'); }
      });
    } catch (error) {
      console.error('Suggest A Game Turnstile failed to load:', error);
      setStatus('Human verification could not load. Please try again.', 'error');
    }
  };

  const reset = () => {
    if (!submissionSucceeded) return;
    form.reset();
    submissionSucceeded = false;
    submitting = false;
    turnstileToken = '';
    setStatus('');
    formStage.hidden = false;
    successPanel.hidden = true;
    sendBtn.disabled = false;
    sendBtn.textContent = 'Submit Suggestion';
    if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
  };

  const open = () => {
    lastFocus = document.activeElement;
    reset();
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden','false');
    document.body.classList.add('suggest-modal-open');
    closeBtn.focus();
    requestAnimationFrame(syncCloseToVisualViewport);
    renderTurnstile();
  };
  const close = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
    document.body.classList.remove('suggest-modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);

  // TEST REV18: Keep Suggest X inside the panel corner while following the visible viewport.
  const syncCloseToVisualViewport = () => {
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const vv = window.visualViewport;
    const viewportTop = vv ? vv.offsetTop : 0;
    const viewportLeft = vv ? vv.offsetLeft : 0;
    const viewportWidth = vv ? vv.width : window.innerWidth;
    const buttonWidth = closeBtn.offsetWidth || 38;
    const inset = 16;
    const left = Math.min(
      rect.right - buttonWidth - inset,
      viewportLeft + viewportWidth - buttonWidth - inset
    );
    closeBtn.style.left = `${Math.round(left)}px`;
    closeBtn.style.right = 'auto';
    closeBtn.style.top = `${Math.round(Math.max(rect.top + inset, viewportTop + inset))}px`;
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncCloseToVisualViewport);
    window.visualViewport.addEventListener('scroll', syncCloseToVisualViewport);
  }
  window.addEventListener('resize', syncCloseToVisualViewport);
  overlay.addEventListener('focusin', syncCloseToVisualViewport);
  overlay.addEventListener('focusout', () => requestAnimationFrame(syncCloseToVisualViewport));

  // Block any legacy backdrop-click close path before it can fire.
  overlay.addEventListener('click', event => {
    if (event.target === overlay) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  // Suggest closes deliberately via the persistent X (or Escape).
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) close(); });

  form.addEventListener('submit', event => {
    if (!form.reportValidity()) { event.preventDefault(); return; }

    const emailInput = form.querySelector('input[name="entry.677551953"]');
    const emailValue = emailInput ? emailInput.value.trim() : '';
    const emailLooksComplete = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(emailValue);
    if (!emailLooksComplete) {
      event.preventDefault();
      setStatus('Please enter a complete email address (for example, name@example.com).', 'error');
      if (emailInput) emailInput.focus();
      return;
    }
    if (!form.querySelector('input[name="entry.1676898685"]:checked')) {
      event.preventDefault();
      setStatus('Please select at least one platform.', 'error');
      return;
    }
    if (!turnstileToken) {
      event.preventDefault();
      setStatus('Please complete the human verification first.', 'error');
      return;
    }
    submitting = true;
    sendBtn.disabled = true;
    sendBtn.textContent = 'Submitting…';
    setStatus('Submitting your suggestion…', 'sending');
  });

  frame.addEventListener('load', () => {
    if (!submitting) return;
    submitting = false;
    submissionSucceeded = true;
    turnstileToken = '';
    setStatus('');
    formStage.hidden = true;
    successPanel.hidden = false;
    sendBtn.textContent = '✓ Submitted';
  });
})();
