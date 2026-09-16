(() => {
  // REV39 test isolation: do not modify the Developer loader just to test Recent Uploads.
  // Wait until the existing loader has finished rendering production Recent Uploads,
  // then replace only those cards with this Recent-specific test implementation.
  const waitForRecentUploads = (attempt = 0) => {
    const section = document.getElementById('recentUploadsSection');
    const grid = document.getElementById('recentUploadsGrid');
    const productionCardsReady = grid && grid.querySelector('.recent-upload-card');
    const playlistApiReady = typeof window.openPlaylistModal === 'function';

    if (!section || !grid || !productionCardsReady || !playlistApiReady || !Array.isArray(window.RAW)) {
      if (attempt < 200) setTimeout(() => waitForRecentUploads(attempt + 1), 50);
      return;
    }

    initializeRecentUploadsTest();
  };

  const initializeRecentUploadsTest = () => {

  const section = document.getElementById('recentUploadsSection');
  const grid = document.getElementById('recentUploadsGrid');
  const gridBtn = document.getElementById('gridBtn');
  const listBtn = document.getElementById('listBtn');
  if (!section || !grid) return;

  section.querySelector('.recent-uploads-head a')?.remove();

  const shortTitle = value => {
    const title = String(value || '').trim();
    const firstPart = title.split('|')[0].trim();
    return firstPart || title;
  };

  const rawGames = Array.isArray(window.RAW) ? window.RAW : [];

  const normalizeName = value =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');

  const gameByVideoId = new Map(
    rawGames
      .filter(game => game && game.v)
      .map(game => [String(game.v), game])
  );

  const gameByName = new Map();
  rawGames.forEach(game => {
    if (!game || !game.n) return;
    const key = normalizeName(game.n);
    if (!gameByName.has(key)) gameByName.set(key, game);
  });

  const findGameForVideo = video => {
    // TEST/explicit playlist-backed Recent entries may share a video ID with a
    // standalone test card. Resolve the declared playlist first so Recent uses
    // the same normal playlist game record and approved playlist modal path.
    if (video && video.testPlaylistId) {
      const playlistGame = rawGames.find(game => game && String(game.pl || '') === String(video.testPlaylistId));
      if (playlistGame) return playlistGame;
    }

    const exact = gameByVideoId.get(String(video.id));
    if (exact) return exact;

    // Recent YouTube titles use "Game Name | ..." so the first segment is
    // the cleanest fallback for playlist/episode uploads that have no direct v ID.
    const titleGame = normalizeName(shortTitle(video.title));
    return gameByName.get(titleGame) || null;
  };

  const createQualityBadge = value => {
    const quality = String(value || '').trim().toLowerCase();
    if (quality !== '4k' && quality !== '1080p') return null;

    const img = document.createElement('img');
    img.className = 'quality-badge';

    if (quality === '4k') {
      img.src = 'quality-4k-60fps.png';
      img.alt = '4K 60 FPS';
      img.title = '4K · 60 FPS';
    } else {
      img.src = 'quality-1080p.png';
      img.alt = 'Full HD 1080p';
      img.title = 'Full HD · 1080p';
    }

    return img;
  };

  const addMeta = (button, game) => {
    if (!game) return;

    const values = [
      ['type', game.ty],
      ['time', game.t],
      ['quality', game.q],
      ['diff', game.df],
      ['gs', game.g]
    ];

    values.forEach(([kind, value]) => {
      if (!value) return;

      const meta = document.createElement('span');
      meta.className = `recent-upload-meta ${kind}`;

      if (kind === 'quality') {
        const badge = createQualityBadge(value);
        if (badge) meta.appendChild(badge);
        else meta.textContent = value;
      } else {
        meta.textContent = value;
      }

      button.appendChild(meta);
    });
  };

  const applyView = view => {
    grid.classList.toggle('list-mode', view === 'list');
    grid.classList.toggle('grid-mode', view !== 'list');
  };

  const syncViewFromButtons = () => {
    applyView(listBtn?.classList.contains('active') ? 'list' : 'grid');
  };

  fetch('data/recent.json', { cache: 'no-store' })
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(data => {
      const videos = Array.isArray(data.videos) ? data.videos.slice(0, 8) : [];
      if (!videos.length) return;

      const frag = document.createDocumentFragment();

      videos.forEach(video => {
        if (!video || !video.id || !video.title) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'recent-upload-card';
        button.setAttribute('aria-label', `Play ${video.title}`);

        const thumb = document.createElement('span');
        thumb.className = 'recent-upload-thumb';

        const img = document.createElement('img');
        img.src = video.thumbnail || `https://i.ytimg.com/vi/${encodeURIComponent(video.id)}/hqdefault.jpg`;
        img.alt = '';
        img.loading = 'lazy';

        const title = document.createElement('span');
        title.className = 'recent-upload-title';
        title.textContent = shortTitle(video.title);

        thumb.appendChild(img);
        button.appendChild(thumb);
        button.appendChild(title);

        const game = findGameForVideo(video);
        addMeta(button, game);

        // If this Recent Upload belongs to a playlist-backed guide, open the
        // exact same approved playlist modal used by the main guide cards.
        // Otherwise preserve the production Recent Upload single-video path.
        button.addEventListener('click', () => {
          if (game && game.pl && !game.adult) {
            openPlaylistModal(game.pl, game.n || video.title);
          } else {
            openVideoModal(video.id, video.title);
          }
        });
        frag.appendChild(button);
      });

      if (!frag.childNodes.length) return;
      // Render everything first, including metadata.
      grid.replaceChildren(frag);
      section.style.display = '';

      // Only after the cards exist do we apply the site's final Grid/List state.
      // site.js registered its button handlers before recent.js, so by the time
      // these handlers run the active button already reflects the new view.
      syncViewFromButtons();

      gridBtn?.addEventListener('click', syncViewFromButtons);
      listBtn?.addEventListener('click', syncViewFromButtons);
    })
    .catch(err => console.warn('Recent uploads unavailable:', err));

  };

  waitForRecentUploads();
})();
