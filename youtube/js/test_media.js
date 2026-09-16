(() => {
  // Permanent TEST-SITE-ONLY playback targets.
  // This file is loaded only by index_.html and never touches games.json/recent.json.
  const waitForPlaybackApi = (attempt = 0) => {
    const ready = typeof window.openVideoModal === 'function' &&
                  typeof window.openPlaylistModal === 'function';
    if (!ready) {
      if (attempt < 200) setTimeout(() => waitForPlaybackApi(attempt + 1), 50);
      return;
    }
    loadTestMedia();
  };

  const loadTestMedia = async () => {
    try {
      const response = await fetch('data/test-videos.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data?.testOnly || !data.video?.id || !data.playlist?.id) return;

      const existing = document.getElementById('testMediaLab');
      if (existing) existing.remove();

      const lab = document.createElement('section');
      lab.id = 'testMediaLab';
      lab.setAttribute('aria-label', 'Test media lab');
      lab.style.cssText = [
        'max-width:1180px',
        'margin:18px auto',
        'padding:14px 16px',
        'border:2px dashed #b91c1c',
        'border-radius:12px',
        'background:rgba(127,29,29,.08)'
      ].join(';');

      const title = document.createElement('div');
      title.textContent = 'TEST LAB — TEST SITE ONLY';
      title.style.cssText = 'font-weight:800;margin-bottom:10px;text-align:center;letter-spacing:.04em';

      const controls = document.createElement('div');
      controls.style.cssText = 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap';

      const makeButton = (label, onClick) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.style.cssText = 'cursor:pointer;padding:10px 16px;border-radius:8px;border:1px solid currentColor;font-weight:700';
        button.addEventListener('click', onClick);
        return button;
      };

      controls.appendChild(makeButton('▶ TEST VIDEO 1', () => {
        window.openVideoModal(data.video.id, data.video.title || '1 - TEST');
      }));

      controls.appendChild(makeButton(`☰ TEST PLAYLIST (${data.playlist.expectedVideos || 3} VIDEOS)`, () => {
        window.openPlaylistModal(data.playlist.id, data.playlist.title || 'TEST');
      }));

      lab.append(title, controls);

      // Keep the lab separate from Main Guides and Recent Uploads.
      // It is inserted immediately before the footer mount on index_.html only.
      const footerMount = document.getElementById('footerModuleMount');
      if (footerMount) footerMount.before(lab);
      else document.body.appendChild(lab);
    } catch (err) {
      console.warn('TEST media lab unavailable:', err);
    }
  };

  waitForPlaybackApi();
})();
