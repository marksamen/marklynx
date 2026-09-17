(() => {
  const openBtn = document.getElementById('developerShowcaseBtn');
  const overlay = document.getElementById('developerShowcaseOverlay');
  const closeBtn = document.getElementById('developerShowcaseClose');
  const form = document.getElementById('developerContactForm');
  const sendBtn = document.getElementById('developerSendBtn');
  const status = document.getElementById('developerFormStatus');
  const turnstileMount = document.getElementById('developerTurnstile');
  const formStage = document.getElementById('developerFormStage');
  const successPanel = document.getElementById('developerSuccessPanel');
  if (!openBtn || !overlay || !closeBtn) return;

  const TURNSTILE_SITE_KEY = '0x4AAAAAAE3AJPCXDRsIdRB-';
  const CONTACT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwswb06LQNqNtdDtXZtCDPTJYqIFfWsL-3oGekfpAvUq1QC0neZzBDF1FmksSlW5qcBGw/exec';
  let turnstileToken = '';
  let turnstileWidgetId = null;
  let lastFocus = null;
  let submissionSucceeded = false;

  const setStatus = (message, type = '') => {
    if (!status) return;
    status.textContent = message;
    status.className = `developer-form-status${type ? ` ${type}` : ''}`;
  };

  const loadTurnstile = () => new Promise((resolve, reject) => {
    if (window.turnstile) return resolve();
    const existing = document.querySelector('script[data-marklynx-turnstile]');
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
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
        action: 'developer_contact',
        callback: token => {
          turnstileToken = token;
          setStatus('');
        },
        'expired-callback': () => { turnstileToken = ''; },
        'error-callback': () => {
          turnstileToken = '';
          setStatus('Human verification could not load. Please try again.', 'error');
        }
      });
    } catch (error) {
      console.error('Turnstile failed to load:', error);
      setStatus('Human verification could not load. Please try again.', 'error');
    }
  };

  const resetForNewSubmission = () => {
    if (!submissionSucceeded || !form) return;
    form.reset();
    submissionSucceeded = false;
    turnstileToken = '';
    setStatus('');
    if (formStage) formStage.hidden = false;
    if (successPanel) successPanel.hidden = true;
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send Message';
    }
    if (window.turnstile && turnstileWidgetId !== null) {
      window.turnstile.reset(turnstileWidgetId);
    }
  };

  const open = () => {
    lastFocus = document.activeElement;
    resetForNewSubmission();
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('developer-modal-open');
    closeBtn.focus();
    renderTurnstile();
  };

  const close = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('developer-modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);

  // Keep developer-supported walkthroughs inside the Mark Lynx player.
  // The YouTube href remains as a graceful fallback if site JavaScript fails.
  overlay.querySelectorAll('.developer-card[data-video-id]').forEach(card => {
    card.addEventListener('click', event => {
      if (typeof window.openVideoModal !== 'function') return;
      event.preventDefault();
      const videoId = card.dataset.videoId;
      const title = card.dataset.videoTitle || '';
      // Open the player synchronously inside the original tap/click.
      // Deferring with requestAnimationFrame can lose mobile browser user activation
      // and prevent audible autoplay even though the visitor explicitly tapped.
      close();
      window.openVideoModal(videoId, title);
    });
  });
  overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && overlay.classList.contains('open')) close();
  });

  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      setStatus('');

      if (!form.reportValidity()) return;

      const emailInput = form.querySelector('input[name="email"]');
      const emailValue = emailInput ? emailInput.value.trim() : '';
      const emailLooksComplete = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(emailValue);
      if (!emailLooksComplete) {
        setStatus('Please enter a complete email address (for example, name@example.com).', 'error');
        if (emailInput) emailInput.focus();
        return;
      }

      if (!turnstileToken) {
        setStatus('Please complete the human verification first.', 'error');
        return;
      }

      const data = new FormData(form);
      const payload = {
        name: data.get('name') || '',
        studio: data.get('studio') || '',
        email: data.get('email') || '',
        game: data.get('game') || '',
        platforms: data.get('platforms') || '',
        message: data.get('message') || '',
        website: data.get('website') || '',
        turnstileToken
      };

      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending…';
      setStatus('Sending your message…', 'sending');

      try {
        // text/plain keeps this a simple cross-origin POST and avoids a CORS preflight.
        const response = await fetch(CONTACT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify(payload),
          redirect: 'follow'
        });
        const result = await response.json();
        if (!result.ok) throw new Error(result.message || 'Message could not be sent.');

        submissionSucceeded = true;
        turnstileToken = '';
        setStatus('');
        if (formStage) formStage.hidden = true;
        if (successPanel) successPanel.hidden = false;
        sendBtn.disabled = true;
        sendBtn.textContent = '✓ Message Sent';
      } catch (error) {
        console.error('Developer contact submission failed:', error);
        setStatus(error.message || 'Your message could not be sent. Please try again.', 'error');
        turnstileToken = '';
        if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
      } finally {
        if (!submissionSucceeded) {
          sendBtn.disabled = false;
          sendBtn.textContent = 'Send Message';
        }
      }
    });
  }
})();
