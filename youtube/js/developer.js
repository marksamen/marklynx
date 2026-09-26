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

  // TEST REV23: permanent mobile Developer Showcase indicator ABOVE the card rail.
  // Recalculate when the hidden Developer overlay becomes visible so the bar exists before the first swipe.
  const developerCards = overlay.querySelector('.developer-cards');

  // REV46 TEST: replace the four legacy hard-coded public cards with the sanitized
  // database showcase feed. Preserve any TEST-only injected card already in the rail.
  const showcaseRows = Array.isArray(window.PUBLIC_DEVELOPER_SHOWCASE)
    ? window.PUBLIC_DEVELOPER_SHOWCASE.slice()
    : null;

  if (developerCards && showcaseRows) {
    const testCards = [...developerCards.querySelectorAll('.developer-card')]
      .filter(card => card.dataset.videoTitle === 'TEST DEVELOPER VIDEO');

    const companyOrder = row => Number.isFinite(Number(row.public_display_order))
      ? Number(row.public_display_order)
      : Number.MAX_SAFE_INTEGER;

    showcaseRows.sort((a, b) => {
      const companyDiff = companyOrder(a) - companyOrder(b);
      if (companyDiff) return companyDiff;
      const companyIdDiff = Number(a.company_id) - Number(b.company_id);
      if (companyIdDiff) return companyIdDiff;
      const mode = String(a.public_games_sort || 'RECENT').toUpperCase();
      if (mode === 'ALPHABETICAL') {
        return String(a.game_name || '').localeCompare(String(b.game_name || ''), undefined, { sensitivity: 'base' });
      }
      return Number(b.game_id) - Number(a.game_id);
    });

    const fragment = document.createDocumentFragment();
    for (const row of showcaseRows) {
      const videoId = String(row.video_id || '').trim();
      const playlistId = String(row.playlist_id || '').trim();
      if (!videoId && !playlistId) continue;

      const title = String(row.game_name || '').trim();
      const company = String(row.public_display_name || '').trim();
      const href = String(row.youtube_url || '').trim()
        || (playlistId
          ? `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`
          : `https://youtu.be/${encodeURIComponent(videoId)}`);

      const card = document.createElement('a');
      card.className = 'developer-card';
      card.href = href;
      if (playlistId) {
        card.dataset.playlistId = playlistId;
        card.dataset.playlistTitle = title;
      } else {
        card.dataset.videoId = videoId;
        card.dataset.videoTitle = title;
      }

      const thumbWrap = document.createElement('div');
      thumbWrap.className = 'developer-card-thumb';
      const img = document.createElement('img');
      if (videoId) img.src = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
      img.alt = `${title} walkthrough thumbnail`;
      thumbWrap.appendChild(img);

      const top = document.createElement('div');
      top.className = 'developer-card-top';
      const strong = document.createElement('strong');
      strong.textContent = title;
      const studio = document.createElement('span');
      studio.textContent = company;
      top.append(strong, studio);

      const meta = document.createElement('div');
      meta.className = 'developer-card-meta';
      for (const value of [row.gamerscore, row.completion_time, row.quality]) {
        const span = document.createElement('span');
        span.textContent = String(value || '');
        meta.appendChild(span);
      }

      const link = document.createElement('div');
      link.className = 'developer-card-link';
      link.textContent = 'Watch walkthrough →';

      card.append(thumbWrap, top, meta, link);
      fragment.appendChild(card);
    }

    developerCards.replaceChildren(...testCards, fragment);
  }

  // TEST REV16: iOS uses a smaller/panned visual viewport while the keyboard is open.
  // Keep the already-fixed mobile close button inside that visible viewport when a form field has focus.
  const syncCloseToVisualViewport = () => {
    if (!window.visualViewport || !window.matchMedia('(max-width: 900px)').matches) {
      closeBtn.style.removeProperty('top');
      return;
    }
    closeBtn.style.top = `${Math.round(window.visualViewport.offsetTop + 16)}px`;
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncCloseToVisualViewport);
    window.visualViewport.addEventListener('scroll', syncCloseToVisualViewport);
  }
  overlay.addEventListener('focusin', syncCloseToVisualViewport);
  overlay.addEventListener('focusout', () => requestAnimationFrame(syncCloseToVisualViewport));

  // Keep developer-supported media inside the Mark Lynx player.
  // Hide (rather than close/reset) the Developer overlay while media is open,
  // then restore the exact existing Developer state when the media modal closes.
  const suspendForMedia = () => {
    developerMediaSuspended = true;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  };

  const restoreAfterMedia = () => {
    if (!developerMediaSuspended) return;
    developerMediaSuspended = false;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('developer-modal-open');
    if (closeBtn) closeBtn.focus();
  };

  // Mobile browsers can lose the media modal's JavaScript close callback while
  // the YouTube iframe is active. Watch the actual shared media modal instead:
  // whenever Developer media was suspended and that modal stops being open,
  // restore the existing Developer overlay. Desktop keeps the callback as the
  // immediate path; this observer is the device-independent safety net.
  const sharedMediaOverlay = document.getElementById('videoModalOverlay');
  if (sharedMediaOverlay) {
    // TEST REV01: while Developer media is open on a phone in landscape,
    // backdrop taps must not close the shared player. The X remains the close control.
    sharedMediaOverlay.addEventListener('click', event => {
      const landscapePhone = window.matchMedia('(orientation: landscape) and (max-height: 500px)').matches;
      if (developerMediaSuspended && landscapePhone && event.target === sharedMediaOverlay) {
        event.stopImmediatePropagation();
      }
    }, true);

    new MutationObserver(() => {
      if (developerMediaSuspended && !sharedMediaOverlay.classList.contains('open')) {
        restoreAfterMedia();
      }
    }).observe(sharedMediaOverlay, { attributes: true, attributeFilter: ['class'] });
  }

  const findDeveloperGame = card => {
    const playlistId = card.dataset.playlistId || '';
    const videoId = card.dataset.videoId || '';
    return (window.RAW || []).find(game =>
      (playlistId && game.pl === playlistId) || (videoId && game.v === videoId)
    ) || null;
  };

  overlay.querySelectorAll('.developer-card[data-video-id], .developer-card[data-playlist-id]').forEach(card => {
    const game = findDeveloperGame(card);
    const titleNode = card.querySelector('.developer-card-top strong');
    if (game?.n && titleNode) titleNode.textContent = game.n;

    card.addEventListener('click', event => {
      const playlistId = card.dataset.playlistId || '';
      const videoId = card.dataset.videoId || '';
      const liveGame = findDeveloperGame(card);
      const title = liveGame?.n || card.dataset.videoTitle || card.dataset.playlistTitle || '';
      const opener = playlistId ? window.openPlaylistModal : window.openVideoModal;
      if (typeof opener !== 'function') return;
      event.preventDefault();
      // Open synchronously inside the original tap/click so mobile autoplay keeps
      // the visitor's user activation.
      suspendForMedia();
      opener(playlistId || videoId, title, restoreAfterMedia);
    });
  });
  // TEST REV14: Developer closes deliberately via the persistent X (or Escape), not by clicking the backdrop.
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
