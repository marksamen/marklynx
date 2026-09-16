(() => {
  const openBtn = document.getElementById('suggestGameBtn');
  const overlay = document.getElementById('suggestGameOverlay');
  const closeBtn = document.getElementById('suggestGameClose');
  const form = document.getElementById('suggestGameForm');
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
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
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
