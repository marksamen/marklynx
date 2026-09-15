(() => {
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
        addMeta(button, findGameForVideo(video));

        button.addEventListener('click', () => openVideoModal(video.id, video.title));
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
})();
